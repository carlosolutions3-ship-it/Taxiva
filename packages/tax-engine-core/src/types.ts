/**
 * Country-agnostic domain types shared by every jurisdiction's tax engine.
 * A country package (tax-engine-us, tax-engine-ph, ...) implements the
 * TaxEngine interface using these shapes. Nothing in this file may
 * reference a specific country's rules, forms, or currency.
 */

export type CountryCode = "US" | "PH";

export type FilingStatus =
  // US
  | "single"
  | "married_filing_jointly"
  | "married_filing_separately"
  | "head_of_household"
  // PH
  | "individual"
  | "mixed_income_earner";

export type TaxpayerProfile = {
  id: string;
  country: CountryCode;
  filingStatus: FilingStatus;
  taxYear: number;
  /** e.g. "employee" | "self_employed" | "professional" | "mixed" | "corporation" — country engines interpret this */
  taxpayerType: string;
  displayName?: string;
};

export type IncomeSource =
  | "employment"
  | "self_employment"
  | "business"
  | "online_selling"
  | "freelance"
  | "professional_fees"
  | "rental"
  | "interest"
  | "dividends"
  | "other";

export type IncomeItem = {
  id: string;
  source: IncomeSource;
  description: string;
  amount: number; // in the taxpayer's local currency, minor-unit-free (e.g. 1500.00)
  currency: "USD" | "PHP";
  date: string; // ISO date
  documentId?: string;
  withheldTax?: number;
  /** free-form platform tag, e.g. "shopee" | "lazada" | "tiktok_shop" | "upwork" */
  platform?: string;
};

export type ExpenseCategory =
  | "supplies"
  | "equipment"
  | "software_subscriptions"
  | "advertising_marketing"
  | "shipping_logistics"
  | "home_office"
  | "utilities"
  | "professional_fees"
  | "travel"
  | "meals"
  | "rent"
  | "salaries_and_wages"
  | "taxes_and_licenses"
  | "depreciation"
  | "other";

export type ExpenseItem = {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  currency: "USD" | "PHP";
  date: string;
  documentId?: string;
  /** whether this expense is likely deductible under the taxpayer's jurisdiction — set by the tax engine, not the user */
  deductible?: boolean;
  deductibilityNote?: string;
};

export type DeductionCandidate = {
  id: string;
  label: string;
  amount: number;
  currency: "USD" | "PHP";
  basis: string; // human-readable explanation of why this was flagged
  confidence: "low" | "medium" | "high";
  requiresVerification: boolean;
  sourceExpenseIds: string[];
};

export type TaxLineItem = {
  label: string;
  amount: number;
  kind: "income" | "deduction" | "tax" | "credit" | "info";
  note?: string;
};

export type TaxEstimate = {
  country: CountryCode;
  taxYear: number;
  currency: "USD" | "PHP";
  grossIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  totalTaxDue: number;
  effectiveRate: number; // 0..1
  marginalRate: number; // 0..1
  lineItems: TaxLineItem[];
  regimeUsed: string; // e.g. "graduated" | "flat_8_percent" | "standard_deduction"
  warnings: string[]; // things the engine could not fully resolve, or rules that changed recently
  generatedAt: string; // ISO datetime
};

export type MissingDocument = {
  id: string;
  label: string;
  reason: string;
  severity: "blocking" | "recommended";
};

export type TaxFormField = {
  key: string;
  label: string;
  value: string | number;
  sourceLineItem?: string;
};

export type DraftTaxForm = {
  formId: string; // e.g. "US-1040" | "PH-1701A"
  formName: string;
  country: CountryCode;
  taxYear: number;
  status: "draft";
  fields: TaxFormField[];
  generatedAt: string;
  disclaimer: string;
};

export type FilingStage =
  | "not_started"
  | "draft"
  | "reviewed"
  | "approved"
  | "simulated_filed" // Stage 1 — sandbox only, no real submission to any tax authority
  | "filed"; // Stage 2 — real e-file, requires the infrastructure described in docs/ROADMAP.md

export type FilingWorkflowStep = {
  stage: FilingStage;
  label: string;
  description: string;
  completedAt?: string;
};

export type FilingWorkflowState = {
  country: CountryCode;
  taxYear: number;
  currentStage: FilingStage;
  steps: FilingWorkflowStep[];
  isSandbox: boolean;
};

/**
 * The contract every country's tax engine implements. A country package
 * exports a single object of this shape and registers it with
 * `registerEngine`. Nothing outside this package (and the country
 * packages) should compute taxes directly — always go through this
 * interface so the product stays country-modular.
 */
export interface TaxEngine {
  country: CountryCode;
  countryName: string;
  currency: "USD" | "PHP";
  supportedTaxpayerTypes: string[];
  supportedForms: { formId: string; formName: string }[];

  estimateTax(input: {
    profile: TaxpayerProfile;
    income: IncomeItem[];
    expenses: ExpenseItem[];
  }): TaxEstimate;

  findDeductionCandidates(input: {
    profile: TaxpayerProfile;
    income: IncomeItem[];
    expenses: ExpenseItem[];
  }): DeductionCandidate[];

  categorizeExpense(description: string, vendor?: string): ExpenseCategory;

  detectMissingDocuments(input: {
    profile: TaxpayerProfile;
    income: IncomeItem[];
    expenses: ExpenseItem[];
  }): MissingDocument[];

  generateDraftForms(input: {
    profile: TaxpayerProfile;
    income: IncomeItem[];
    expenses: ExpenseItem[];
    estimate: TaxEstimate;
  }): DraftTaxForm[];

  getFilingWorkflow(profile: TaxpayerProfile): FilingWorkflowState;
}
