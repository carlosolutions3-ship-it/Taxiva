import type { DeductionCandidate } from "@taxiva/tax-engine-core";

export type DeductionDisplayStatus = "confirmed" | "potential" | "needs_info" | "not_eligible";

/**
 * The system never asserts "confirmed" on its own — that word is reserved
 * for a real user action (see DeductionDecision in schema.prisma). Absent
 * a decision, a candidate is "potential" (medium/high confidence) or
 * "needs info" (low confidence) — both explicitly non-guaranteed states.
 */
export function deriveDeductionStatus(
  candidate: DeductionCandidate,
  decision: string | undefined
): DeductionDisplayStatus {
  if (decision === "confirmed") return "confirmed";
  if (decision === "not_eligible") return "not_eligible";
  if (candidate.confidence === "low") return "needs_info";
  return "potential";
}

export const STATUS_LABEL: Record<DeductionDisplayStatus, string> = {
  confirmed: "Confirmed",
  potential: "Likely deductible",
  needs_info: "Needs information",
  not_eligible: "Not eligible",
};
