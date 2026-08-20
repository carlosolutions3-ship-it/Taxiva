/**
 * App-level arithmetic that sits ON TOP OF tax engine output — readiness
 * scoring, refund estimation, action-item aggregation. None of this is
 * tax law: it's UI-facing math the product needs regardless of country,
 * so it lives here rather than inside a country package. Every figure it
 * produces is still traceable back to real engine output (income,
 * expenses, TaxEstimate, DeductionCandidate, MissingDocument) — nothing
 * here invents a number.
 */
import type { DeductionCandidate, FilingStage, IncomeItem, MissingDocument, TaxEstimate } from "@taxiva/tax-engine-core";

export function computeTotalWithheld(income: IncomeItem[]): number {
  return Math.round(income.reduce((acc, i) => acc + (i.withheldTax ?? 0), 0) * 100) / 100;
}

export type RefundEstimate = {
  withheld: number;
  amount: number; // positive = refund, negative = balance due
  isRefund: boolean;
};

export function computeRefundEstimate(income: IncomeItem[], estimate: TaxEstimate): RefundEstimate {
  const withheld = computeTotalWithheld(income);
  const amount = Math.round((withheld - estimate.totalTaxDue) * 100) / 100;
  return { withheld, amount, isRefund: amount >= 0 };
}

const FILING_STAGE_ORDER: FilingStage[] = ["draft", "reviewed", "approved", "simulated_filed", "filed"];

export function computeReadiness(input: {
  hasIncome: boolean;
  documentsCollected: number;
  documentsExpected: number;
  blockingMissingCount: number;
  hasEstimate: boolean;
  filingStage: FilingStage;
}): number {
  let score = 0;
  if (input.hasIncome) score += 25;

  if (input.documentsExpected > 0) {
    score += Math.round(20 * Math.min(1, input.documentsCollected / input.documentsExpected));
  } else if (input.documentsCollected > 0) {
    score += 20;
  }

  if (input.blockingMissingCount === 0 && (input.hasIncome || input.documentsCollected > 0)) score += 20;
  if (input.hasEstimate) score += 20;

  const stageIndex = Math.max(0, FILING_STAGE_ORDER.indexOf(input.filingStage));
  score += Math.min(3, stageIndex) * 5; // draft→reviewed→approved→filed, capped at 15

  return Math.min(100, score);
}

export type ActionItem = {
  id: string;
  label: string;
  description: string;
  href: string;
  severity: "blocking" | "recommended";
};

export function computeActionItems(input: {
  missingDocuments: MissingDocument[];
  deductionCandidates: DeductionCandidate[];
}): ActionItem[] {
  const items: ActionItem[] = input.missingDocuments.map((d) => ({
    id: `doc-${d.id}`,
    label: d.label,
    description: d.reason,
    href: "/dashboard/documents",
    severity: d.severity,
  }));

  const needsReview = input.deductionCandidates.filter((c) => c.requiresVerification);
  if (needsReview.length > 0) {
    items.push({
      id: "deductions-review",
      label: `${needsReview.length} deduction${needsReview.length === 1 ? "" : "s"} need${needsReview.length === 1 ? "s" : ""} your confirmation`,
      description: needsReview.map((c) => c.label).join(", "),
      href: "/dashboard/deductions",
      severity: "recommended",
    });
  }

  return items;
}

export type TaxHealth = { status: "good" | "attention"; headline: string; reason: string };

export function computeTaxHealth(input: { blockingMissingCount: number; hasIncome: boolean }): TaxHealth {
  if (!input.hasIncome) {
    return {
      status: "attention",
      headline: "We need your attention",
      reason: "No income has been recorded yet — add a document or entry to get started.",
    };
  }
  if (input.blockingMissingCount > 0) {
    return {
      status: "attention",
      headline: "We need your attention",
      reason: "There's at least one document blocking an accurate estimate.",
    };
  }
  return {
    status: "good",
    headline: "Everything looks good",
    reason: "No blocking issues found — your estimate reflects what you've entered so far.",
  };
}
