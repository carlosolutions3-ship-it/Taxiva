/**
 * United States federal tax rules, tax year 2024 (returns filed in 2025).
 *
 * SOURCE: IRS Revenue Procedure 2023-34 (annual inflation adjustments).
 * These numbers change every year. VERIFY against https://www.irs.gov
 * before relying on this for a real filing, and before rolling the
 * `taxYear` default forward. This engine covers FEDERAL tax only —
 * state income tax is out of scope for the MVP (see docs/ROADMAP.md).
 *
 * Scope and known simplifications (flagged honestly, not hidden):
 *  - Only single, married_filing_jointly, married_filing_separately,
 *    and head_of_household statuses are modeled.
 *  - Only the standard deduction is applied (no itemized deductions).
 *  - No tax credits (Child Tax Credit, EITC, etc.) are modeled yet.
 *  - Self-employment tax is simplified (see calculateSelfEmploymentTax).
 *  - Alternative Minimum Tax (AMT) is not modeled.
 * This is a planning/estimation tool, not a substitute for a CPA or
 * IRS Free File for an actual return.
 */

import type { FilingStatus } from "@taxiva/tax-engine-core";

export const US_TAX_YEAR = 2024;

export type Bracket = { upTo: number | null; rate: number };

export const FEDERAL_BRACKETS: Record<
  Extract<
    FilingStatus,
    "single" | "married_filing_jointly" | "married_filing_separately" | "head_of_household"
  >,
  Bracket[]
> = {
  single: [
    { upTo: 11_600, rate: 0.1 },
    { upTo: 47_150, rate: 0.12 },
    { upTo: 100_525, rate: 0.22 },
    { upTo: 191_950, rate: 0.24 },
    { upTo: 243_725, rate: 0.32 },
    { upTo: 609_350, rate: 0.35 },
    { upTo: null, rate: 0.37 },
  ],
  married_filing_jointly: [
    { upTo: 23_200, rate: 0.1 },
    { upTo: 94_300, rate: 0.12 },
    { upTo: 201_050, rate: 0.22 },
    { upTo: 383_900, rate: 0.24 },
    { upTo: 487_450, rate: 0.32 },
    { upTo: 731_200, rate: 0.35 },
    { upTo: null, rate: 0.37 },
  ],
  married_filing_separately: [
    { upTo: 11_600, rate: 0.1 },
    { upTo: 47_150, rate: 0.12 },
    { upTo: 100_525, rate: 0.22 },
    { upTo: 191_950, rate: 0.24 },
    { upTo: 243_725, rate: 0.32 },
    { upTo: 365_600, rate: 0.35 },
    { upTo: null, rate: 0.37 },
  ],
  head_of_household: [
    { upTo: 16_550, rate: 0.1 },
    { upTo: 63_100, rate: 0.12 },
    { upTo: 100_500, rate: 0.22 },
    { upTo: 191_950, rate: 0.24 },
    { upTo: 243_700, rate: 0.32 },
    { upTo: 609_350, rate: 0.35 },
    { upTo: null, rate: 0.37 },
  ],
};

export const STANDARD_DEDUCTION: Record<
  Extract<
    FilingStatus,
    "single" | "married_filing_jointly" | "married_filing_separately" | "head_of_household"
  >,
  number
> = {
  single: 14_600,
  married_filing_jointly: 29_200,
  married_filing_separately: 14_600,
  head_of_household: 21_900,
};

// Social Security wage base for 2024 — SE tax's 12.4% component stops here.
export const SE_SOCIAL_SECURITY_WAGE_BASE = 168_600;
export const SE_TAX_RATE_SOCIAL_SECURITY = 0.124;
export const SE_TAX_RATE_MEDICARE = 0.029;
export const SE_NET_EARNINGS_FACTOR = 0.9235; // net SE income is taxed on 92.35% of profit

export function calculateBracketTax(
  taxableIncome: number,
  status: keyof typeof FEDERAL_BRACKETS
): { tax: number; marginalRate: number } {
  const brackets = FEDERAL_BRACKETS[status];
  let tax = 0;
  let lower = 0;
  let marginalRate = brackets[0].rate;

  for (const bracket of brackets) {
    const upper = bracket.upTo ?? Infinity;
    if (taxableIncome > lower) {
      const amountInBracket = Math.min(taxableIncome, upper) - lower;
      tax += amountInBracket * bracket.rate;
      marginalRate = bracket.rate;
    }
    lower = upper;
    if (taxableIncome <= upper) break;
  }

  return { tax: Math.round(tax * 100) / 100, marginalRate };
}

/**
 * Simplified self-employment tax (Schedule SE logic, no additional
 * Medicare surtax over the $200k/$250k threshold — flagged as a
 * known gap above).
 */
export function calculateSelfEmploymentTax(netSelfEmploymentIncome: number): number {
  if (netSelfEmploymentIncome <= 0) return 0;
  const seNetEarnings = netSelfEmploymentIncome * SE_NET_EARNINGS_FACTOR;
  const socialSecurityPortion =
    Math.min(seNetEarnings, SE_SOCIAL_SECURITY_WAGE_BASE) * SE_TAX_RATE_SOCIAL_SECURITY;
  const medicarePortion = seNetEarnings * SE_TAX_RATE_MEDICARE;
  return Math.round((socialSecurityPortion + medicarePortion) * 100) / 100;
}
