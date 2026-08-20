/**
 * Philippines tax rules — BIR (Bureau of Internal Revenue).
 *
 * ============================ VERIFY BEFORE USE ============================
 * Philippine tax law changes via BIR Revenue Regulations, Revenue Memorandum
 * Circulars, and new legislation (e.g. the Ease of Paying Taxes Act, RA
 * 11976, took effect in 2024 and changed several filing mechanics). This
 * file encodes rules that were correct as of the TRAIN Law (RA 10963)
 * schedule effective January 1, 2023 onward. Every figure below is a
 * candidate for having changed. DO NOT treat this file as legal or tax
 * advice, and DO NOT let a user file a real return based on it without
 * independent verification against:
 *   - https://www.bir.gov.ph (official issuances)
 *   - A Philippine CPA or BIR-accredited tax practitioner
 * The `requiresVerification` flags throughout this package exist so the
 * product surfaces this warning to end users, not just to developers.
 * =============================================================================
 */

export const PH_TAX_YEAR = 2024;
export const PH_CURRENCY = "PHP" as const;

// Source: Sec. 24(A)(2)(a), NIRC as amended by TRAIN Law (RA 10963),
// schedule effective 2023 onward. VERIFY — this is the "final" TRAIN
// step-down bracket; confirm no further legislative change occurred.
export type PhBracket = { upTo: number | null; base: number; rate: number; over: number };

export const GRADUATED_BRACKETS: PhBracket[] = [
  { upTo: 250_000, base: 0, rate: 0, over: 0 },
  { upTo: 400_000, base: 0, rate: 0.15, over: 250_000 },
  { upTo: 800_000, base: 22_500, rate: 0.2, over: 400_000 },
  { upTo: 2_000_000, base: 102_500, rate: 0.25, over: 800_000 },
  { upTo: 8_000_000, base: 402_500, rate: 0.3, over: 2_000_000 },
  { upTo: null, base: 2_202_500, rate: 0.35, over: 8_000_000 },
];

// Sec. 24(A)(2)(b): self-employed/professionals with gross sales/receipts
// not exceeding the VAT threshold may elect an 8% tax on gross sales or
// receipts in excess of ₱250,000, in lieu of BOTH graduated income tax and
// the percentage tax. Election is generally irrevocable for the taxable
// year — VERIFY current election mechanics (BIR Form 1905 / first quarter
// return) before letting a user rely on this.
export const FLAT_OPTION_RATE = 0.08;
export const FLAT_OPTION_EXEMPT_AMOUNT = 250_000;

// Sec. 109 / RR on VAT: mandatory VAT registration threshold.
// VERIFY this has not been adjusted for inflation since TRAIN.
export const VAT_REGISTRATION_THRESHOLD = 3_000_000;
export const VAT_RATE = 0.12;

// Sec. 116, NIRC as amended: percentage tax on gross sales/receipts for
// non-VAT-registered persons below the VAT threshold, when NOT electing
// the 8% flat option. Rate reverted to 3% effective July 1, 2023 (it was
// temporarily 1% under CREATE Act during the pandemic). VERIFY current rate.
export const PERCENTAGE_TAX_RATE = 0.03;

// Optional Standard Deduction: self-employed/professionals may elect a
// standard 40% of gross sales/receipts in lieu of itemized deductions
// (Sec. 34(L), NIRC). Election is made per return and generally binding
// for the taxable year. VERIFY election mechanics before relying on this.
export const OPTIONAL_STANDARD_DEDUCTION_RATE = 0.4;

export function calculateGraduatedTax(taxableIncome: number): { tax: number; marginalRate: number } {
  if (taxableIncome <= 0) return { tax: 0, marginalRate: 0 };
  let bracket = GRADUATED_BRACKETS[0];
  for (const b of GRADUATED_BRACKETS) {
    bracket = b;
    if (b.upTo === null || taxableIncome <= b.upTo) break;
  }
  const tax = bracket.base + (taxableIncome - bracket.over) * bracket.rate;
  return { tax: Math.round(tax * 100) / 100, marginalRate: bracket.rate };
}

export function calculateFlatOptionTax(grossSalesOrReceipts: number): number {
  const taxable = Math.max(0, grossSalesOrReceipts - FLAT_OPTION_EXEMPT_AMOUNT);
  return Math.round(taxable * FLAT_OPTION_RATE * 100) / 100;
}

export function calculatePercentageTax(grossSalesOrReceipts: number): number {
  return Math.round(grossSalesOrReceipts * PERCENTAGE_TAX_RATE * 100) / 100;
}

export function isOverVatThreshold(annualGrossSalesOrReceipts: number): boolean {
  return annualGrossSalesOrReceipts > VAT_REGISTRATION_THRESHOLD;
}
