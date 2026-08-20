import type {
  DeductionCandidate,
  DraftTaxForm,
  ExpenseCategory,
  ExpenseItem,
  FilingWorkflowState,
  IncomeItem,
  MissingDocument,
  TaxEngine,
  TaxEstimate,
  TaxLineItem,
  TaxpayerProfile,
} from "@taxiva/tax-engine-core";
import {
  FEDERAL_BRACKETS,
  STANDARD_DEDUCTION,
  US_TAX_YEAR,
  calculateBracketTax,
  calculateSelfEmploymentTax,
} from "./rules";
import { categorizeExpense, DEDUCTIBLE_CATEGORIES } from "./categorize";

type SupportedStatus = keyof typeof FEDERAL_BRACKETS;

function isSupportedStatus(status: string): status is SupportedStatus {
  return status in FEDERAL_BRACKETS;
}

function sum(items: { amount: number }[]): number {
  return Math.round(items.reduce((acc, i) => acc + i.amount, 0) * 100) / 100;
}

function estimateTax(input: {
  profile: TaxpayerProfile;
  income: IncomeItem[];
  expenses: ExpenseItem[];
}): TaxEstimate {
  const { profile, income, expenses } = input;
  const warnings: string[] = [];
  const status: SupportedStatus = isSupportedStatus(profile.filingStatus)
    ? profile.filingStatus
    : "single";
  if (!isSupportedStatus(profile.filingStatus)) {
    warnings.push(
      `Filing status "${profile.filingStatus}" is not modeled for the US yet — estimated as "single". Verify with a tax professional.`
    );
  }

  const grossIncome = sum(income);
  const selfEmploymentIncome = sum(
    income.filter((i) => i.source === "self_employment" || i.source === "business" || i.source === "online_selling" || i.source === "freelance")
  );
  const deductibleExpenses = sum(
    expenses.filter((e) => DEDUCTIBLE_CATEGORIES.includes(e.category))
  );

  const netSelfEmploymentIncome = Math.max(0, selfEmploymentIncome - deductibleExpenses);
  const seTax = calculateSelfEmploymentTax(netSelfEmploymentIncome);
  // Half of SE tax is deductible from income for federal income tax purposes.
  const seTaxDeduction = Math.round((seTax / 2) * 100) / 100;

  const standardDeduction = STANDARD_DEDUCTION[status];
  const adjustedGrossIncome = Math.max(0, grossIncome - deductibleExpenses - seTaxDeduction);
  const taxableIncome = Math.max(0, adjustedGrossIncome - standardDeduction);

  const { tax: incomeTax, marginalRate } = calculateBracketTax(taxableIncome, status);
  const totalTaxDue = Math.round((incomeTax + seTax) * 100) / 100;
  const effectiveRate = grossIncome > 0 ? totalTaxDue / grossIncome : 0;

  const lineItems: TaxLineItem[] = [
    { label: "Gross income", amount: grossIncome, kind: "income" },
    { label: "Deductible business expenses", amount: -deductibleExpenses, kind: "deduction" },
    {
      label: "Self-employment tax deduction (1/2 of SE tax)",
      amount: -seTaxDeduction,
      kind: "deduction",
      note: "Adjustment to income, IRC §164(f)",
    },
    { label: "Standard deduction", amount: -standardDeduction, kind: "deduction", note: `Filing status: ${status}` },
    { label: "Taxable income", amount: taxableIncome, kind: "info" },
    { label: "Federal income tax", amount: incomeTax, kind: "tax" },
    {
      label: "Self-employment tax (Social Security + Medicare)",
      amount: seTax,
      kind: "tax",
      note: netSelfEmploymentIncome > 0 ? "Schedule SE, simplified" : "No net self-employment income",
    },
    { label: "Total federal tax due", amount: totalTaxDue, kind: "tax" },
  ];

  if (netSelfEmploymentIncome > 0) {
    warnings.push(
      "Self-employment tax does not include the 0.9% Additional Medicare Tax that applies above $200,000 (single) / $250,000 (MFJ) — not yet modeled."
    );
  }
  warnings.push(
    "State income tax is not included. Federal-only estimate for tax year " + US_TAX_YEAR + "."
  );
  warnings.push("No tax credits (Child Tax Credit, EITC, education credits, etc.) are applied yet.");

  return {
    country: "US",
    taxYear: profile.taxYear || US_TAX_YEAR,
    currency: "USD",
    grossIncome,
    totalDeductions: deductibleExpenses + seTaxDeduction + standardDeduction,
    taxableIncome,
    totalTaxDue,
    effectiveRate,
    marginalRate,
    lineItems,
    regimeUsed: "graduated_with_standard_deduction",
    warnings,
    generatedAt: new Date().toISOString(),
  };
}

function findDeductionCandidates(input: {
  profile: TaxpayerProfile;
  income: IncomeItem[];
  expenses: ExpenseItem[];
}): DeductionCandidate[] {
  const candidates: DeductionCandidate[] = [];
  const byCategory = new Map<ExpenseCategory, ExpenseItem[]>();
  for (const e of input.expenses) {
    if (!DEDUCTIBLE_CATEGORIES.includes(e.category)) continue;
    byCategory.set(e.category, [...(byCategory.get(e.category) ?? []), e]);
  }

  for (const [category, items] of byCategory) {
    const total = sum(items);
    if (total <= 0) continue;
    const isCapped = category === "meals";
    const isConditional = category === "home_office";
    candidates.push({
      id: `us-deduction-${category}`,
      label: `${categoryLabel(category)} (Schedule C)`,
      amount: isCapped ? Math.round(total * 0.5 * 100) / 100 : total,
      currency: "USD",
      basis: isCapped
        ? "Business meals are generally 50% deductible under IRC §274(n)."
        : isConditional
        ? "Home office deduction requires regular and exclusive business use — confirm before filing."
        : `${items.length} transaction(s) categorized as ${categoryLabel(category).toLowerCase()}, an ordinary and necessary business expense under IRC §162.`,
      confidence: isConditional ? "medium" : "high",
      requiresVerification: isCapped || isConditional,
      sourceExpenseIds: items.map((i) => i.id),
    });
  }

  return candidates;
}

function categoryLabel(category: ExpenseCategory): string {
  return category
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function detectMissingDocuments(input: {
  profile: TaxpayerProfile;
  income: IncomeItem[];
  expenses: ExpenseItem[];
}): MissingDocument[] {
  const missing: MissingDocument[] = [];
  const hasEmploymentIncome = input.income.some((i) => i.source === "employment");
  const hasSelfEmploymentIncome = input.income.some(
    (i) => i.source === "self_employment" || i.source === "business" || i.source === "freelance" || i.source === "online_selling"
  );

  if (hasEmploymentIncome) {
    missing.push({
      id: "us-w2",
      label: "Form W-2 (Wage and Tax Statement)",
      reason: "Employment income was recorded but no W-2 document has been uploaded yet.",
      severity: "recommended",
    });
  }
  if (hasSelfEmploymentIncome) {
    missing.push({
      id: "us-1099",
      label: "Form 1099-NEC / 1099-K",
      reason: "Self-employment or platform income was recorded — upload any 1099s received to cross-check totals.",
      severity: "recommended",
    });
  }
  if (input.income.length === 0) {
    missing.push({
      id: "us-any-income-doc",
      label: "Any income document",
      reason: "No income has been recorded yet. Upload a pay stub, 1099, or bank statement to get started.",
      severity: "blocking",
    });
  }
  return missing;
}

function generateDraftForms(input: {
  profile: TaxpayerProfile;
  income: IncomeItem[];
  expenses: ExpenseItem[];
  estimate: TaxEstimate;
}): DraftTaxForm[] {
  const { profile, estimate } = input;
  const forms: DraftTaxForm[] = [];

  forms.push({
    formId: "US-1040",
    formName: "Form 1040 — U.S. Individual Income Tax Return (draft)",
    country: "US",
    taxYear: estimate.taxYear,
    status: "draft",
    fields: [
      { key: "filing_status", label: "Filing status", value: profile.filingStatus },
      { key: "line_1_wages", label: "Line 1: Wages, salaries", value: sum(input.income.filter((i) => i.source === "employment")) },
      { key: "line_9_total_income", label: "Line 9: Total income", value: estimate.grossIncome },
      { key: "line_12_std_deduction", label: "Line 12: Standard deduction", value: estimate.totalDeductions },
      { key: "line_15_taxable_income", label: "Line 15: Taxable income", value: estimate.taxableIncome },
      { key: "line_16_tax", label: "Line 16: Tax", value: estimate.lineItems.find((l) => l.label === "Federal income tax")?.amount ?? 0 },
      { key: "line_23_other_taxes", label: "Line 23: Other taxes (incl. self-employment tax)", value: estimate.lineItems.find((l) => l.label.startsWith("Self-employment tax"))?.amount ?? 0 },
      { key: "line_24_total_tax", label: "Line 24: Total tax", value: estimate.totalTaxDue },
    ],
    generatedAt: estimate.generatedAt,
    disclaimer:
      "DRAFT — generated by Taxiva for planning purposes only. This is not an IRS-accepted form and has not been e-filed. Verify every figure before using it to prepare a real return.",
  });

  const hasSE = input.income.some((i) => i.source === "self_employment" || i.source === "business" || i.source === "freelance" || i.source === "online_selling");
  if (hasSE) {
    forms.push({
      formId: "US-SCHEDULE-C",
      formName: "Schedule C — Profit or Loss From Business (draft)",
      country: "US",
      taxYear: estimate.taxYear,
      status: "draft",
      fields: [
        { key: "line_1_gross_receipts", label: "Line 1: Gross receipts", value: sum(input.income.filter((i) => i.source !== "employment")) },
        { key: "line_28_total_expenses", label: "Line 28: Total expenses", value: estimate.totalDeductions },
        { key: "line_31_net_profit", label: "Line 31: Net profit", value: estimate.taxableIncome },
      ],
      generatedAt: estimate.generatedAt,
      disclaimer:
        "DRAFT — generated by Taxiva for planning purposes only. Not an IRS-accepted form.",
    });
  }

  return forms;
}

function getFilingWorkflow(profile: TaxpayerProfile): FilingWorkflowState {
  return {
    country: "US",
    taxYear: profile.taxYear || US_TAX_YEAR,
    currentStage: "draft",
    isSandbox: true,
    steps: [
      { stage: "draft", label: "Draft return", description: "AI-assisted estimate and draft forms generated from your documents." },
      { stage: "reviewed", label: "Review", description: "You review every figure and flagged assumption." },
      { stage: "approved", label: "Approve", description: "You approve the draft as ready to file." },
      {
        stage: "simulated_filed",
        label: "Sandbox filing",
        description:
          "Taxiva simulates submission in a sandbox. No data is transmitted to the IRS. Real e-file requires an Authorized IRS e-file Provider relationship — see docs/ROADMAP.md.",
      },
    ],
  };
}

export const usTaxEngine: TaxEngine = {
  country: "US",
  countryName: "United States",
  currency: "USD",
  supportedTaxpayerTypes: ["employee", "self_employed", "freelancer", "online_seller", "mixed"],
  supportedForms: [
    { formId: "US-1040", formName: "Form 1040" },
    { formId: "US-SCHEDULE-C", formName: "Schedule C" },
  ],
  estimateTax,
  findDeductionCandidates,
  categorizeExpense,
  detectMissingDocuments,
  generateDraftForms,
  getFilingWorkflow,
};
