import Link from "next/link";
import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";
import { computeRefundEstimate } from "@/lib/finance";
import { formatMoney, formatPercent } from "@/lib/format";
import { SectionHeader } from "@/components/ui";
import { ArrowRightIcon, ChevronRightIcon, ClipboardIcon } from "@/components/icons";

const KIND_STYLE: Record<string, string> = {
  income: "text-ink-900",
  deduction: "text-success-700",
  tax: "text-danger-700 font-semibold",
  credit: "text-brand-700",
  info: "text-ink-500 italic",
};

export default async function EstimatePage() {
  const user = await requireUser();
  const { estimate, income } = await getUserTaxContext(user);
  const refund = computeRefundEstimate(income, estimate);

  const summaryRows = [
    { label: "Income", value: estimate.grossIncome },
    { label: "Deductions", value: estimate.totalDeductions },
    { label: "Taxable income", value: estimate.taxableIncome, emphasis: true },
    { label: "Estimated tax", value: estimate.totalTaxDue },
    { label: "Payments & withholding", value: refund.withheld },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Tax return"
        title="Your tax summary"
        description={`Tax year ${estimate.taxYear} · ${user.country === "PH" ? "Philippines (BIR)" : "United States (federal)"} · updated ${new Date(estimate.generatedAt).toLocaleString()}`}
      />

      <div className="card animate-in">
        <dl className="divide-y divide-ink-100">
          {summaryRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <dt className={row.emphasis ? "font-medium text-ink-900" : "text-ink-500"}>{row.label}</dt>
              <dd className={`tabular-nums ${row.emphasis ? "text-lg font-semibold text-ink-900" : "font-medium text-ink-900"}`}>
                {formatMoney(row.value, estimate.currency)}
              </dd>
            </div>
          ))}
        </dl>
        <div className={`mt-4 flex items-center justify-between rounded-xl px-4 py-4 ${refund.isRefund ? "bg-brand-50" : "bg-warning-50"}`}>
          <div>
            <p className={`text-xs font-medium uppercase tracking-wide ${refund.isRefund ? "text-brand-700" : "text-warning-700"}`}>
              {refund.isRefund ? "Estimated refund" : "Estimated balance due"}
            </p>
            <p className={`text-2xl font-semibold tabular-nums ${refund.isRefund ? "text-brand-800" : "text-warning-800"}`}>
              {formatMoney(Math.abs(refund.amount), estimate.currency)}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard/filing" className="btn-primary">
          Review return
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
        <Link href="/dashboard/forms" className="btn-secondary">
          <ClipboardIcon className="h-4 w-4" />
          View draft forms (advanced)
        </Link>
      </div>

      <details className="card group animate-in [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <div>
            <p className="font-medium text-ink-900">Detailed breakdown</p>
            <p className="text-sm text-ink-500">Line-by-line calculation and every assumption made.</p>
          </div>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-300 transition-transform group-open:rotate-90" />
        </summary>

        <div className="mt-5 border-t border-ink-100 pt-5">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
            Regime used: {estimate.regimeUsed.replace(/_/g, " ")}
          </p>
          <table className="w-full text-sm">
            <tbody>
              {estimate.lineItems.map((line, i) => (
                <tr key={i} className="border-b border-ink-50 last:border-0">
                  <td className="py-2 pr-4">
                    <span className={KIND_STYLE[line.kind]}>{line.label}</span>
                    {line.note && <p className="text-xs text-ink-400">{line.note}</p>}
                  </td>
                  <td className={`py-2 text-right tabular-nums ${KIND_STYLE[line.kind]}`}>
                    {formatMoney(line.amount, estimate.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-ink-500">Effective rate</p>
              <p className="font-semibold text-ink-900">{formatPercent(estimate.effectiveRate)}</p>
            </div>
            <div>
              <p className="text-ink-500">Marginal rate</p>
              <p className="font-semibold text-ink-900">{formatPercent(estimate.marginalRate, 0)}</p>
            </div>
          </div>

          {estimate.warnings.length > 0 && (
            <div className="mt-5 rounded-lg border border-warning-200 bg-warning-50 p-4">
              <p className="mb-2 text-sm font-semibold text-warning-900">Assumptions & things to verify</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-warning-800">
                {estimate.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}
