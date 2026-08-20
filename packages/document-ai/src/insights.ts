/**
 * Turns raw engine output into the proactive, narrated "insight cards"
 * described in the product vision: instead of a user hunting through
 * numbers at tax season, Taxiva states what it noticed in plain language,
 * continuously, as documents and transactions come in.
 *
 * This is deterministic (template-driven) so it works with zero AI
 * spend. If a real AI provider is configured (see ./ai), the assistant
 * can rephrase/expand these — but the underlying facts always come from
 * the tax engine, never from the model, so numbers can't be hallucinated.
 */

import type { DeductionCandidate, MissingDocument, TaxEstimate } from "@taxiva/tax-engine-core";

export type Insight = {
  id: string;
  headline: string;
  detail: string;
  severity: "info" | "attention" | "action_needed";
};

function money(amount: number, currency: string): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function generateInsights(input: {
  estimate: TaxEstimate;
  deductionCandidates: DeductionCandidate[];
  missingDocuments: MissingDocument[];
}): Insight[] {
  const { estimate, deductionCandidates, missingDocuments } = input;
  const insights: Insight[] = [];

  if (estimate.grossIncome > 0) {
    insights.push({
      id: "income-to-date",
      headline: `You've earned ${money(estimate.grossIncome, estimate.currency)} so far in ${estimate.taxYear}.`,
      detail: "This is the total of every income item recorded — from uploaded documents and manual entries.",
      severity: "info",
    });
  }

  const deductibleTotal = deductionCandidates.reduce((acc, d) => acc + d.amount, 0);
  if (deductibleTotal > 0) {
    insights.push({
      id: "deductions-found",
      headline: `You have ${money(deductibleTotal, estimate.currency)} of potentially deductible expenses.`,
      detail: `Found across ${deductionCandidates.length} categor${deductionCandidates.length === 1 ? "y" : "ies"}. ${deductionCandidates.filter((d) => d.requiresVerification).length} need your confirmation before being claimed.`,
      severity: "info",
    });
  }

  const blocking = missingDocuments.filter((d) => d.severity === "blocking");
  const recommended = missingDocuments.filter((d) => d.severity === "recommended");
  if (blocking.length > 0) {
    insights.push({
      id: "missing-blocking",
      headline: `You're missing ${blocking.length} document${blocking.length === 1 ? "" : "s"} needed to get started.`,
      detail: blocking.map((d) => d.label).join(", "),
      severity: "action_needed",
    });
  } else if (recommended.length > 0) {
    insights.push({
      id: "missing-recommended",
      headline: `You're missing ${recommended.length} document${recommended.length === 1 ? "" : "s"} that would improve your estimate's accuracy.`,
      detail: recommended.map((d) => d.label).join(", "),
      severity: "attention",
    });
  }

  if (estimate.grossIncome > 0) {
    insights.push({
      id: "estimated-liability",
      headline: `Your estimated tax liability is ${money(estimate.totalTaxDue, estimate.currency)}.`,
      detail: `Effective rate ${(estimate.effectiveRate * 100).toFixed(1)}%, marginal rate ${(estimate.marginalRate * 100).toFixed(0)}%. This updates automatically as you add more documents.`,
      severity: estimate.totalTaxDue > 0 ? "attention" : "info",
    });
  }

  if (estimate.warnings.length > 0) {
    insights.push({
      id: "assumptions",
      headline: `${estimate.warnings.length} assumption${estimate.warnings.length === 1 ? "" : "s"} went into this estimate — worth a quick read.`,
      detail: estimate.warnings.join(" "),
      severity: "attention",
    });
  }

  return insights;
}
