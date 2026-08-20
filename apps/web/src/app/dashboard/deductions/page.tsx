import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";

function money(amount: number, currency: string): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "bg-brand-100 text-brand-800",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-ink-100 text-ink-600",
};

export default async function DeductionsPage() {
  const user = await requireUser();
  const { deductionCandidates } = await getUserTaxContext(user);
  const total = deductionCandidates.reduce((acc, d) => acc + d.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Deduction candidates</h1>
        <p className="mt-1 text-ink-600">
          Flagged automatically from your categorized expenses. Nothing here is claimed on your behalf —
          review each one, especially anything marked "verify."
        </p>
      </div>

      <div className="card">
        <p className="text-sm text-ink-500">Total flagged</p>
        <p className="mt-1 text-2xl font-semibold text-ink-900">{money(total, user.country === "PH" ? "PHP" : "USD")}</p>
      </div>

      <div className="space-y-3">
        {deductionCandidates.length === 0 && (
          <p className="text-center text-ink-400">No deduction candidates yet — log some expenses first.</p>
        )}
        {deductionCandidates.map((d) => (
          <div key={d.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-medium text-ink-900">{d.label}</p>
                <p className="mt-1 text-sm text-ink-600">{d.basis}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink-900">{money(d.amount, d.currency)}</p>
                <span className={`badge mt-1 ${CONFIDENCE_STYLE[d.confidence]}`}>{d.confidence} confidence</span>
              </div>
            </div>
            {d.requiresVerification && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                ⚠ Requires verification before claiming — confirm eligibility with a tax professional or current rules.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
