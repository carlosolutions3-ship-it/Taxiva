"use client";

import { useState } from "react";
import type { DeductionCandidate } from "@taxiva/tax-engine-core";
import { confirmDeductionAction, markDeductionNotEligibleAction, resetDeductionDecisionAction } from "@/lib/data-actions";
import { formatMoney } from "@/lib/format";
import { deriveDeductionStatus, STATUS_LABEL, type DeductionDisplayStatus } from "@/lib/deductions";
import { ActionSubmitButton } from "./ActionSubmitButton";
import { ActionForm } from "./ActionForm";
import { StatusBadge } from "./ui";
import { ChevronRightIcon, CheckIcon, XIcon } from "./icons";

const STATUS_TONE: Record<DeductionDisplayStatus, "success" | "brand" | "warning" | "neutral"> = {
  confirmed: "success",
  potential: "brand",
  needs_info: "warning",
  not_eligible: "neutral",
};

export function DeductionCard({
  candidate,
  decision,
  evidenceLines,
}: {
  candidate: DeductionCandidate;
  decision?: string;
  evidenceLines: string[];
}) {
  const [expanded, setExpanded] = useState(false);
  const status = deriveDeductionStatus(candidate, decision);
  const dismissed = status === "not_eligible";

  return (
    <div className={`card animate-in !p-0 overflow-hidden ${dismissed ? "opacity-60" : ""}`}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium text-ink-900">{candidate.label}</p>
            <StatusBadge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</StatusBadge>
          </div>
          <p className="mt-1 text-xl font-semibold tabular-nums text-ink-900">
            {formatMoney(candidate.amount, candidate.currency)}
          </p>
          <p className="mt-1.5 text-sm text-ink-500">{candidate.basis}</p>
        </div>
        <ChevronRightIcon className={`mt-1 h-4 w-4 shrink-0 text-ink-300 transition-transform ${expanded ? "rotate-90" : ""}`} />
      </button>

      {expanded && (
        <div className="animate-in border-t border-ink-100 bg-ink-50/60 px-5 py-4">
          {evidenceLines.length > 0 && (
            <div className="mb-4">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-ink-400">Evidence</p>
              <ul className="space-y-1 text-sm text-ink-600">
                {evidenceLines.map((line, i) => (
                  <li key={i}>• {line}</li>
                ))}
              </ul>
            </div>
          )}
          {candidate.requiresVerification && (
            <p className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-xs text-warning-800">
              ⚠ Requires verification before claiming — confirm eligibility with a tax professional or current rules.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {status !== "confirmed" && (
              <ActionForm action={confirmDeductionAction}>
                <input type="hidden" name="candidateId" value={candidate.id} />
                <ActionSubmitButton variant="primary" pendingText="Confirming…" className="text-xs">
                  <CheckIcon className="h-3.5 w-3.5" />
                  Mark as confirmed
                </ActionSubmitButton>
              </ActionForm>
            )}
            {status !== "not_eligible" && (
              <ActionForm action={markDeductionNotEligibleAction}>
                <input type="hidden" name="candidateId" value={candidate.id} />
                <ActionSubmitButton variant="secondary" pendingText="Updating…" className="text-xs">
                  <XIcon className="h-3.5 w-3.5" />
                  Not eligible for me
                </ActionSubmitButton>
              </ActionForm>
            )}
            {decision && (
              <ActionForm action={resetDeductionDecisionAction}>
                <input type="hidden" name="candidateId" value={candidate.id} />
                <button type="submit" className="btn-ghost text-xs">
                  Undo
                </button>
              </ActionForm>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
