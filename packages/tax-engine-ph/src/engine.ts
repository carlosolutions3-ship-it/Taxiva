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
  FLAT_OPTION_EXEMPT_AMOUNT,
  GRADUATED_BRACKETS,
  OPTIONAL_STANDARD_DEDUCTION_RATE,
  PERCENTAGE_TAX_RATE,
  PH_TAX_YEAR,
  VAT_REGISTRATION_THRESHOLD,
  calculateFlatOptionTax,
  calculateGraduatedTax,
  calculatePercentageTax,
  isOverVatThreshold,
} from "./rules";
import { categorizeExpense, DEDUCTIBLE_CATEGORIES } from "./categorize";

function sum(items: { amount: number }[]): number {
  return Math.round(items.reduce((acc, i) => acc + i.amount, 0) * 100) / 100;
}

function estimateTax(input: {
  profile: TaxpayerProfile;
  income: IncomeItem[];
  expenses: ExpenseItem[];
}): TaxEstimate {
  const { profile, income, expenses } = input;
  const warnings: string[] = [
    "Philippine tax rules change frequently via BIR issuances. Every figure here must be verified against current BIR regulations before filing — see docs/PH_TAX_VERIFICATION.md.",
  ];

  const grossSalesOrReceipts = sum(income);
  const itemizedDeductible = sum(expenses.filter((e) => DEDUCTIBLE_CATEGORIES.includes(e.category)));
  const osdAmount = Math.round(grossSalesOrReceipts * OPTIONAL_STANDARD_DEDUCTION_RATE * 100) / 100;
  const useOsd = osdAmount > itemizedDeductible;
  const deduction = useOsd ? osdAmount : itemizedDeductible;

  const taxableIncomeGraduated = Math.max(0, grossSalesOrReceipts - deduction);
  const { tax: graduatedTax, marginalRate } = calculateGraduatedTax(taxableIncomeGraduated);

  const overVatThreshold = isOverVatThreshold(grossSalesOrReceipts);
  const flatOptionAvailable = !overVatThreshold;
  const flatTax = flatOptionAvailable ? calculateFlatOptionTax(grossSalesOrReceipts) : Infinity;

  // Under the 8% option, percentage tax is not owed separately (it's baked
  // into the flat rate). Under the graduated option, non-VAT-registered
  // taxpayers below the VAT threshold owe percentage tax ON TOP of income
  // tax — so the fair comparison is the flat tax against the graduated
  // regime's TOTAL burden (income tax + percentage tax), not income tax
  // alone, or a taxpayer could be steered into paying more overall.
  const graduatedRegimePercentageTax = !overVatThreshold ? calculatePercentageTax(grossSalesOrReceipts) : 0;
  const graduatedRegimeTotal = graduatedTax + graduatedRegimePercentageTax;

  const useFlatOption = flatOptionAvailable && flatTax < graduatedRegimeTotal;
  const incomeTax = useFlatOption ? flatTax : graduatedTax;
  const percentageTaxDue = useFlatOption ? 0 : graduatedRegimePercentageTax;

  const totalTaxDue = Math.round((incomeTax + percentageTaxDue) * 100) / 100;
  const effectiveRate = grossSalesOrReceipts > 0 ? totalTaxDue / grossSalesOrReceipts : 0;

  // The deduction/taxable-income lines must reflect whichever regime is
  // actually being used: the 8% flat option ignores OSD/itemized
  // deductions entirely and instead exempts a flat ₱250,000 of gross
  // sales/receipts (Sec. 24(A)(2)(b)) — showing the OSD figure here while
  // the tax itself is computed from the flat exemption would contradict
  // the line directly below it.
  const displayedDeduction = useFlatOption ? FLAT_OPTION_EXEMPT_AMOUNT : deduction;
  const displayedTaxableIncome = useFlatOption
    ? Math.max(0, grossSalesOrReceipts - FLAT_OPTION_EXEMPT_AMOUNT)
    : Math.max(0, grossSalesOrReceipts - deduction);

  const lineItems: TaxLineItem[] = [
    { label: "Gross sales / receipts", amount: grossSalesOrReceipts, kind: "income" },
    {
      label: useFlatOption
        ? "Flat-option exemption (first ₱250,000 of gross)"
        : useOsd
        ? "Optional Standard Deduction (40%)"
        : "Itemized deductible expenses",
      amount: -displayedDeduction,
      kind: "deduction",
      note: useFlatOption
        ? "Under the 8% option, OSD/itemized deductions do not apply — only this flat exemption does."
        : useOsd
        ? "OSD election is generally binding for the taxable year — confirm before using."
        : undefined,
    },
    { label: "Taxable income", amount: displayedTaxableIncome, kind: "info" },
    {
      label: useFlatOption ? "Income tax (8% flat option)" : "Income tax (graduated rates)",
      amount: incomeTax,
      kind: "tax",
      note: useFlatOption
        ? `8% of gross sales/receipts over ₱${FLAT_OPTION_EXEMPT_AMOUNT.toLocaleString()}`
        : "Sec. 24(A), NIRC as amended by TRAIN Law",
    },
    {
      label: "Percentage tax (3%, non-VAT)",
      amount: percentageTaxDue,
      kind: "tax",
      note: percentageTaxDue > 0 ? "Sec. 116, NIRC — owed on top of graduated income tax when not VAT-registered and not electing the 8% option." : "Not applicable under the option selected",
    },
    { label: "Total estimated tax due", amount: totalTaxDue, kind: "tax" },
  ];

  if (overVatThreshold) {
    warnings.push(
      `Gross sales/receipts exceed the ₱${VAT_REGISTRATION_THRESHOLD.toLocaleString()} VAT threshold. VAT registration and the 8% flat option are not applicable — this estimate assumes VAT-registered graduated-rate treatment and does NOT compute output/input VAT. Verify VAT obligations separately.`
    );
  }
  if (grossSalesOrReceipts > 0 && grossSalesOrReceipts <= VAT_REGISTRATION_THRESHOLD) {
    warnings.push(
      `Estimate compares the 8% flat option against graduated rates + percentage tax and uses whichever is lower (₱${flatOptionAvailable ? flatTax.toLocaleString() : "n/a"} vs ₱${graduatedRegimeTotal.toLocaleString()}). The actual election must be made with the BIR and is generally binding for the year — this is a planning estimate, not a filed election.`
    );
  }
  warnings.push("Withholding taxes already deducted at source by clients/marketplaces are not yet reconciled against BIR Form 2307 — upload withholding certificates so they can be credited.");

  return {
    country: "PH",
    taxYear: profile.taxYear || PH_TAX_YEAR,
    currency: "PHP",
    grossIncome: grossSalesOrReceipts,
    totalDeductions: displayedDeduction,
    taxableIncome: displayedTaxableIncome,
    totalTaxDue,
    effectiveRate,
    marginalRate,
    lineItems,
    regimeUsed: useFlatOption ? "flat_8_percent" : "graduated_plus_percentage_tax",
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
  const itemizedTotal = sum(input.expenses.filter((e) => DEDUCTIBLE_CATEGORIES.includes(e.category)));

  const grossSalesOrReceipts = sum(input.income);
  const osdAmount = Math.round(grossSalesOrReceipts * OPTIONAL_STANDARD_DEDUCTION_RATE * 100) / 100;

  // OSD and itemized deductions are mutually exclusive elections under
  // Sec. 34(L) NIRC — a taxpayer claims one or the other, never both. To
  // avoid double-counting "potential deductions," only surface whichever
  // one is actually larger (matching the choice estimateTax() makes); the
  // other is still visible via the estimate's line items and warnings.
  const useOsd = osdAmount > itemizedTotal;

  if (useOsd && osdAmount > 0) {
    candidates.push({
      id: "ph-osd",
      label: "Optional Standard Deduction (40% of gross sales/receipts)",
      amount: osdAmount,
      currency: "PHP",
      basis: `Sec. 34(L), NIRC — larger than your ${itemizedTotal > 0 ? `itemized total (₱${itemizedTotal.toLocaleString()})` : "itemized expenses"}, so this is what the estimate uses. Election in lieu of itemizing is generally binding for the taxable year.`,
      confidence: "high",
      requiresVerification: true,
      sourceExpenseIds: [],
    });
  } else {
    for (const [category, items] of byCategory) {
      const total = sum(items);
      if (total <= 0) continue;
      candidates.push({
        id: `ph-deduction-${category}`,
        label: `${categoryLabel(category)} (itemized, Sec. 34 NIRC)`,
        amount: total,
        currency: "PHP",
        basis: `${items.length} transaction(s) categorized as ${categoryLabel(category).toLowerCase()}. Used instead of the 40% Optional Standard Deduction because your itemized total is larger.`,
        confidence: "medium",
        requiresVerification: true,
        sourceExpenseIds: items.map((i) => i.id),
      });
    }
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
  missing.push({
    id: "ph-cor-2303",
    label: "BIR Certificate of Registration (Form 2303)",
    reason: "Needed to confirm your registered tax type, RDO, and whether you're VAT or non-VAT registered.",
    severity: "recommended",
  });
  if (input.income.length > 0) {
    missing.push({
      id: "ph-2307",
      label: "Certificate of Creditable Tax Withheld at Source (Form 2307)",
      reason: "If clients or marketplaces withheld tax on your income, upload 2307s so withheld amounts can be credited against what you owe.",
      severity: "recommended",
    });
    missing.push({
      id: "ph-official-receipts",
      label: "Official Receipts / Sales Invoices issued",
      reason: "BIR requires registered receipts/invoices for reported income — upload or log these to support your gross sales/receipts figure.",
      severity: "recommended",
    });
  }
  if (input.income.length === 0) {
    missing.push({
      id: "ph-any-income-doc",
      label: "Any income document",
      reason: "No income has been recorded yet. Upload a sales report, marketplace payout summary, or invoice to get started.",
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
  const disclaimer =
    "DRAFT — generated by Taxiva for planning purposes only. This is not a BIR-accepted form and has not been filed via eBIRForms/eFPS. Verify every figure with a Philippine tax professional before filing.";

  forms.push({
    formId: "PH-1701A",
    formName: "BIR Form 1701A — Annual Income Tax Return (individuals, graduated or 8% option) (draft)",
    country: "PH",
    taxYear: estimate.taxYear,
    status: "draft",
    fields: [
      { key: "tax_regime", label: "Tax regime used for this estimate", value: estimate.regimeUsed },
      { key: "gross_sales_receipts", label: "Gross sales/receipts", value: estimate.grossIncome },
      { key: "allowable_deductions", label: "Allowable deductions", value: estimate.totalDeductions },
      { key: "taxable_income", label: "Taxable income", value: estimate.taxableIncome },
      { key: "tax_due", label: "Tax due", value: estimate.totalTaxDue },
    ],
    generatedAt: estimate.generatedAt,
    disclaimer,
  });

  forms.push({
    formId: "PH-2551Q",
    formName: "BIR Form 2551Q — Quarterly Percentage Tax Return (draft)",
    country: "PH",
    taxYear: estimate.taxYear,
    status: "draft",
    fields: [
      { key: "gross_receipts_quarter", label: "Gross receipts (est., full-year figure shown)", value: estimate.grossIncome },
      {
        key: "percentage_tax_due",
        label: "Percentage tax due (3%)",
        value: estimate.lineItems.find((l) => l.label.startsWith("Percentage tax"))?.amount ?? 0,
      },
    ],
    generatedAt: estimate.generatedAt,
    disclaimer: disclaimer + " Only applicable if you did not elect the 8% flat option and are not VAT-registered.",
  });

  return forms;
}

function getFilingWorkflow(profile: TaxpayerProfile): FilingWorkflowState {
  return {
    country: "PH",
    taxYear: profile.taxYear || PH_TAX_YEAR,
    currentStage: "draft",
    isSandbox: true,
    steps: [
      { stage: "draft", label: "Draft return", description: "AI-assisted estimate and draft BIR forms generated from your documents." },
      { stage: "reviewed", label: "Review", description: "You review every figure, the OSD-vs-itemized choice, and the 8%-vs-graduated comparison." },
      { stage: "approved", label: "Approve", description: "You approve the draft as ready to file." },
      {
        stage: "simulated_filed",
        label: "Sandbox filing",
        description:
          "Taxiva simulates submission in a sandbox. Nothing is transmitted to the BIR. Real filing requires eBIRForms/eFPS submission and, for many taxpayers, an accredited tax practitioner — see docs/ROADMAP.md.",
      },
    ],
  };
}

export const phTaxEngine: TaxEngine = {
  country: "PH",
  countryName: "Philippines",
  currency: "PHP",
  supportedTaxpayerTypes: [
    "employee",
    "self_employed",
    "professional",
    "online_seller",
    "freelancer",
    "mixed_income_earner",
  ],
  supportedForms: [
    { formId: "PH-1701A", formName: "BIR Form 1701A" },
    { formId: "PH-2551Q", formName: "BIR Form 2551Q" },
  ],
  estimateTax,
  findDeductionCandidates,
  categorizeExpense,
  detectMissingDocuments,
  generateDraftForms,
  getFilingWorkflow,
};
