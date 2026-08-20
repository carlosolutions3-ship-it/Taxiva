import Link from "next/link";
import { requireUser } from "@/lib/actions";
import { getUserTaxContext } from "@/lib/tax";

const SEVERITY_STYLE: Record<string, string> = {
  info: "border-ink-200 bg-white",
  attention: "border-amber-200 bg-amber-50",
  action_needed: "border-red-200 bg-red-50",
};

function money(amount: number, currency: string): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function OverviewPage() {
  const user = await requireUser();
  const { estimate, insights, income, expenses, missingDocuments } = await getUserTaxContext(user);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">
          Welcome back{user.displayName ? `, ${user.displayName}` : ""}.
        </h1>
        <p className="mt-1 text-ink-600">Here's what Taxiva has noticed about your {user.taxYear} finances.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-ink-500">Total income recorded</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{money(estimate.grossIncome, estimate.currency)}</p>
          <p className="mt-1 text-xs text-ink-400">{income.length} item(s)</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-500">Deductions applied</p>
          <p className="mt-1 text-2xl font-semibold text-ink-900">{money(estimate.totalDeductions, estimate.currency)}</p>
          <p className="mt-1 text-xs text-ink-400">{expenses.length} expense(s) logged</p>
        </div>
        <div className="card">
          <p className="text-sm text-ink-500">Estimated tax due</p>
          <p className="mt-1 text-2xl font-semibold text-brand-700">{money(estimate.totalTaxDue, estimate.currency)}</p>
          <p className="mt-1 text-xs text-ink-400">{(estimate.effectiveRate * 100).toFixed(1)}% effective rate</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-ink-900">Insights</h2>
        <div className="space-y-3">
          {insights.map((insight) => (
            <div key={insight.id} className={`rounded-xl border p-4 ${SEVERITY_STYLE[insight.severity]}`}>
              <p className="font-medium text-ink-900">{insight.headline}</p>
              <p className="mt-1 text-sm text-ink-600">{insight.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/documents" className="card transition hover:border-brand-300">
          <p className="font-medium text-ink-900">Upload a document →</p>
          <p className="mt-1 text-sm text-ink-600">Receipts, invoices, payout reports.</p>
        </Link>
        <Link href="/dashboard/estimate" className="card transition hover:border-brand-300">
          <p className="font-medium text-ink-900">See the full breakdown →</p>
          <p className="mt-1 text-sm text-ink-600">Line-by-line tax estimate with every assumption.</p>
        </Link>
        <Link href="/dashboard/assistant" className="card transition hover:border-brand-300">
          <p className="font-medium text-ink-900">Ask the AI assistant →</p>
          <p className="mt-1 text-sm text-ink-600">
            {missingDocuments.length > 0 ? `${missingDocuments.length} document(s) still needed` : "You're all caught up"}
          </p>
        </Link>
      </div>
    </div>
  );
}
