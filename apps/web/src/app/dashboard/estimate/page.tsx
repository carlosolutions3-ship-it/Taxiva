import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";

function money(amount: number, currency: string): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  const abs = Math.abs(amount);
  const formatted = `${symbol}${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return amount < 0 ? `-${formatted}` : formatted;
}

const KIND_STYLE: Record<string, string> = {
  income: "text-ink-900",
  deduction: "text-emerald-700",
  tax: "text-red-700 font-semibold",
  credit: "text-brand-700",
  info: "text-ink-500 italic",
};

export default async function EstimatePage() {
  const user = await requireUser();
  const { estimate } = await getUserTaxContext(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Tax estimate</h1>
        <p className="mt-1 text-ink-600">
          Tax year {estimate.taxYear} · regime: {estimate.regimeUsed.replace(/_/g, " ")} · generated{" "}
          {new Date(estimate.generatedAt).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-ink-500">Taxable income</p>
          <p className="mt-1 text-xl font-semibold text-ink-900">{money(estimate.taxableIncome, estimate.currency)}</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-500">Effective rate</p>
          <p className="mt-1 text-xl font-semibold text-ink-900">{(estimate.effectiveRate * 100).toFixed(1)}%</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-500">Marginal rate</p>
          <p className="mt-1 text-xl font-semibold text-ink-900">{(estimate.marginalRate * 100).toFixed(0)}%</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-ink-900">Line-by-line breakdown</h2>
        <table className="w-full text-sm">
          <tbody>
            {estimate.lineItems.map((line, i) => (
              <tr key={i} className="border-b border-ink-50 last:border-0">
                <td className="py-2 pr-4">
                  <span className={KIND_STYLE[line.kind]}>{line.label}</span>
                  {line.note && <p className="text-xs text-ink-400">{line.note}</p>}
                </td>
                <td className={`py-2 text-right ${KIND_STYLE[line.kind]}`}>{money(line.amount, estimate.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {estimate.warnings.length > 0 && (
        <div className="card border-amber-200 bg-amber-50">
          <h2 className="mb-2 font-semibold text-amber-900">Assumptions & things to verify</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
            {estimate.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
