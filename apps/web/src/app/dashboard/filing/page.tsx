import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";
import { prisma } from "@/lib/prisma";
import { advanceFilingStageAction, resetFilingStageAction } from "@/lib/data-actions";

export default async function FilingPage() {
  const user = await requireUser();
  const { engine, profile } = await getUserTaxContext(user);
  const workflow = engine.getFilingWorkflow(profile);
  const filingState = await prisma.filingState.findUnique({ where: { userId: user.id } });
  const currentStage = filingState?.currentStage ?? "draft";
  const currentIndex = workflow.steps.findIndex((s) => s.stage === currentStage);
  const isFinalStage = currentIndex === workflow.steps.length - 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Filing workflow</h1>
        <p className="mt-1 text-ink-600">
          {workflow.isSandbox
            ? "This is a sandbox simulation — nothing is transmitted to any tax authority."
            : "Live filing"}
        </p>
      </div>

      <div className="card border-amber-200 bg-amber-50">
        <p className="text-sm text-amber-900">
          <strong>Real filing is not connected yet.</strong> Taking a return from "approved" to actually
          submitted to the {profile.country === "PH" ? "BIR" : "IRS"} requires additional infrastructure —
          see the roadmap in <code>docs/ROADMAP.md</code> for exactly what's needed and what Taxiva can and
          can't do on its own.
        </p>
      </div>

      <div className="card">
        <ol className="space-y-4">
          {workflow.steps.map((step, i) => {
            const done = i < currentIndex || (i === currentIndex && currentStage !== "draft") || (i === 0 && currentIndex === 0);
            const isCurrent = i === currentIndex;
            return (
              <li key={step.stage} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                    i <= currentIndex ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-400"
                  }`}
                >
                  {i + 1}
                </div>
                <div>
                  <p className={`font-medium ${isCurrent ? "text-brand-700" : "text-ink-900"}`}>{step.label}</p>
                  <p className="text-sm text-ink-600">{step.description}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 flex gap-3">
          {!isFinalStage && (
            <form action={advanceFilingStageAction}>
              <button type="submit" className="btn-primary">
                Mark "{workflow.steps[currentIndex + 1]?.label}" complete
              </button>
            </form>
          )}
          {currentStage !== "draft" && (
            <form action={resetFilingStageAction}>
              <button type="submit" className="btn-secondary">Reset to draft</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
