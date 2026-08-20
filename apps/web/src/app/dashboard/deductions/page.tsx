import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/format";
import { deriveDeductionStatus } from "@/lib/deductions";
import { SectionHeader, EmptyState } from "@/components/ui";
import { DeductionCard } from "@/components/DeductionCard";
import { CheckShieldIcon } from "@/components/icons";

export default async function DeductionsPage() {
  const user = await requireUser();
  const { deductionCandidates, expenses } = await getUserTaxContext(user);
  const decisions = await prisma.deductionDecision.findMany({
    where: { userId: user.id, taxYear: user.taxYear },
  });
  const decisionMap = new Map(decisions.map((d) => [d.candidateId, d.decision]));
  const expenseById = new Map(expenses.map((e) => [e.id, e]));

  const currency = deductionCandidates[0]?.currency ?? (user.country === "PH" ? "PHP" : "USD");
  const activeTotal = deductionCandidates
    .filter((c) => deriveDeductionStatus(c, decisionMap.get(c.id)) !== "not_eligible")
    .reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Flagship: deductions"
        title="We found potential tax savings."
        description="Flagged automatically from your categorized expenses. Nothing here is claimed on your behalf — review each one, confirm what applies, and dismiss what doesn't."
      />

      {deductionCandidates.length > 0 && (
        <div className="card animate-in bg-gradient-to-br from-brand-600 to-brand-800 text-white">
          <p className="text-xs font-medium uppercase tracking-wide text-brand-200">Potential savings found</p>
          <p className="mt-1.5 text-3xl font-semibold tabular-nums">{formatMoney(activeTotal, currency, { compact: true })}</p>
          <p className="mt-1 text-sm text-brand-100">across {deductionCandidates.length} categor{deductionCandidates.length === 1 ? "y" : "ies"}</p>
        </div>
      )}

      {deductionCandidates.length === 0 ? (
        <EmptyState
          icon={<CheckShieldIcon className="h-5 w-5" />}
          title="No deduction candidates yet"
          description="Log some expenses or upload a receipt, and I'll start flagging what looks deductible."
          actionLabel="Add an expense"
          actionHref="/dashboard/expenses"
        />
      ) : (
        <div className="space-y-3">
          {deductionCandidates.map((candidate) => {
            const evidenceLines = candidate.sourceExpenseIds
              .map((id) => expenseById.get(id))
              .filter((e): e is NonNullable<typeof e> => Boolean(e))
              .map((e) => `${e.description} — ${formatMoney(e.amount, e.currency)} on ${e.date}`);
            return (
              <DeductionCard
                key={candidate.id}
                candidate={candidate}
                decision={decisionMap.get(candidate.id)}
                evidenceLines={evidenceLines}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
