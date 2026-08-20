import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";
import { prisma } from "@/lib/prisma";
import { advanceFilingStageAction, resetFilingStageAction } from "@/lib/data-actions";
import { SectionHeader, StatusBadge } from "@/components/ui";
import { ActionSubmitButton } from "@/components/ActionSubmitButton";
import { ActionForm } from "@/components/ActionForm";
import { AlertIcon, CheckIcon, SendIcon } from "@/components/icons";

// The engine's 4 real stages (draft/reviewed/approved/simulated_filed)
// map onto 5 user-facing steps — "Confirmation" is a UI-only view shown
// once "simulated_filed" is reached, not a distinct engine stage. This
// keeps the country-engine filing workflow untouched while presenting
// the flow the product asks for.
const STEP_META = [
  { stage: "draft", title: "Review", headline: "Your return is ready.", description: "AI-assisted estimate and draft forms generated from your documents." },
  { stage: "reviewed", title: "Confirm", headline: "Review your information.", description: "Check every figure, and any assumption the engine had to make, before moving on." },
  { stage: "approved", title: "Authorize", headline: "Complete required authorization.", description: "You approve the draft as ready to file. Real e-signature and identity verification are part of Stage 2 — see docs/ROADMAP.md." },
  { stage: "simulated_filed", title: "File", headline: "Submit through supported filing infrastructure.", description: "Taxiva submits through its sandbox only. Nothing is transmitted to the IRS, the BIR, or any tax authority." },
  { stage: "confirmation", title: "Confirmation", headline: "Your return has been submitted.", description: "A sandbox confirmation — no government agency received anything." },
] as const;

export default async function FilingPage() {
  const user = await requireUser();
  const { engine, profile } = await getUserTaxContext(user);
  const workflow = engine.getFilingWorkflow(profile);
  const filingState = await prisma.filingState.findUnique({ where: { userId: user.id } });
  const currentStage = filingState?.currentStage ?? "draft";
  const engineStageIndex = workflow.steps.findIndex((s) => s.stage === currentStage);
  // 0..3 while progressing through the engine's real stages; once
  // simulated_filed is reached, advance the visual stepper to the 5th
  // (confirmation) node.
  const activeStep = currentStage === "simulated_filed" ? 4 : Math.max(0, engineStageIndex);
  const isFinal = engineStageIndex >= workflow.steps.length - 1;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Filing"
        title="Filing workflow"
        action={
          <StatusBadge tone="warning" dot>
            Sandbox / Demo
          </StatusBadge>
        }
      />

      <div className="card animate-in border-warning-200 bg-warning-50">
        <div className="flex items-start gap-3">
          <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-warning-600" />
          <p className="text-sm text-warning-900">
            <strong>Real filing is not connected yet.</strong> This walks through the actual workflow a
            filed return goes through, but taking a return from "approved" to actually submitted to the{" "}
            {profile.country === "PH" ? "BIR" : "IRS"} requires additional infrastructure, credentials,
            and in many cases a licensed tax professional — see <code>docs/ROADMAP.md</code> for exactly
            what's needed.
          </p>
        </div>
      </div>

      <div className="card animate-in">
        <ol className="space-y-0">
          {STEP_META.map((step, i) => {
            const done = i < activeStep || (i === 4 && currentStage === "simulated_filed");
            const isCurrent = i === activeStep;
            const isLast = i === STEP_META.length - 1;
            return (
              <li key={step.stage} className="relative flex gap-4 pb-8 last:pb-0">
                {!isLast && (
                  <div
                    className={`absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px ${
                      i < activeStep ? "bg-brand-300" : "bg-ink-100"
                    }`}
                  />
                )}
                <div
                  className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    done
                      ? "bg-brand-600 text-white"
                      : isCurrent
                      ? "bg-ink-900 text-white"
                      : "bg-ink-100 text-ink-400"
                  }`}
                >
                  {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
                </div>
                <div className="pt-0.5">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isCurrent ? "text-brand-600" : "text-ink-400"}`}>
                    {step.title}
                  </p>
                  <p className={`mt-0.5 font-medium ${isCurrent || done ? "text-ink-900" : "text-ink-400"}`}>{step.headline}</p>
                  <p className="mt-1 text-sm text-ink-500">{step.description}</p>

                  {isCurrent && step.stage === "confirmation" && (
                    <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
                      <p className="text-sm font-medium text-brand-800">Sandbox confirmation ID</p>
                      <p className="font-mono text-lg text-brand-900">SANDBOX-{filingState?.id.slice(-8).toUpperCase() ?? "PENDING"}</p>
                      <p className="mt-1 text-xs text-brand-700">
                        This ID exists only in this demo's database. It was not issued by, and was never sent to, the {profile.country === "PH" ? "BIR" : "IRS"}.
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-2 flex gap-3 border-t border-ink-100 pt-5">
          {!isFinal && (
            <ActionForm action={advanceFilingStageAction}>
              <input type="hidden" name="fromStage" value={currentStage} />
              <ActionSubmitButton pendingText="Working…">
                <SendIcon className="h-4 w-4" />
                {STEP_META[engineStageIndex + 1]?.stage === "simulated_filed" ? "Submit (sandbox)" : `Continue to "${STEP_META[engineStageIndex + 1]?.title}"`}
              </ActionSubmitButton>
            </ActionForm>
          )}
          {currentStage !== "draft" && (
            <ActionForm action={resetFilingStageAction}>
              <ActionSubmitButton variant="secondary" pendingText="Resetting…">Reset to draft</ActionSubmitButton>
            </ActionForm>
          )}
        </div>
      </div>
    </div>
  );
}
