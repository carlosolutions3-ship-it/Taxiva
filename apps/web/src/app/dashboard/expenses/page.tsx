import { requireUser } from "@/lib/actions";
import { addExpenseAction, deleteExpenseAction } from "@/lib/data-actions";
import { getUserTaxContext } from "@/lib/tax";
import { formatMoney } from "@/lib/format";
import { SectionHeader, EmptyState, StatusBadge } from "@/components/ui";
import { ActionSubmitButton } from "@/components/ActionSubmitButton";
import { ActionForm } from "@/components/ActionForm";
import { ReceiptIcon, TrashIcon } from "@/components/icons";

const CATEGORIES = [
  "supplies", "equipment", "software_subscriptions", "advertising_marketing", "shipping_logistics",
  "home_office", "utilities", "professional_fees", "travel", "meals", "rent", "salaries_and_wages",
  "taxes_and_licenses", "depreciation", "other",
];

export default async function ExpensesPage() {
  const user = await requireUser();
  const { expenses } = await getUserTaxContext(user);
  const total = expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Expenses"
        title="Expenses"
        description={'Leave category as "Auto-detect" and Fyleo will categorize it from the description — the same engine used when a receipt is uploaded.'}
        action={expenses.length > 0 ? <p className="text-sm text-ink-500">Total: <span className="font-semibold text-ink-900">{formatMoney(total, expenses[0].currency)}</span></p> : undefined}
      />

      <ActionForm action={addExpenseAction} className="card animate-in grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="description">Description</label>
          <input className="input" id="description" name="description" required placeholder="e.g. Canva subscription" />
        </div>
        <div>
          <label className="label" htmlFor="vendor">Vendor (optional, helps categorization)</label>
          <input className="input" id="vendor" name="vendor" placeholder="e.g. Canva" />
        </div>
        <div>
          <label className="label" htmlFor="amount">Amount ({user.country === "PH" ? "₱" : "$"})</label>
          <input className="input" id="amount" name="amount" type="number" step="0.01" min="0" required />
        </div>
        <div>
          <label className="label" htmlFor="date">Date</label>
          <input className="input" id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="category">Category</label>
          <select className="input" id="category" name="category" defaultValue="">
            <option value="">Auto-detect from description/vendor</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <ActionSubmitButton pendingText="Adding…">Add expense</ActionSubmitButton>
        </div>
      </ActionForm>

      {expenses.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon className="h-5 w-5" />}
          title="No expenses recorded yet"
          description="Add an entry above, or upload a receipt and let extraction and categorization do it for you."
        />
      ) : (
        <div className="card animate-in overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((item) => (
                <tr key={item.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                  <td className="px-5 py-3 text-ink-900">{item.description}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone="neutral">{item.category.replace(/_/g, " ")}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-ink-500">{item.date}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-ink-900">{formatMoney(item.amount, item.currency)}</td>
                  <td className="px-4 py-3 text-right">
                    <ActionForm action={deleteExpenseAction}>
                      <input type="hidden" name="id" value={item.id} />
                      <button type="submit" className="rounded p-1.5 text-ink-300 hover:bg-danger-50 hover:text-danger-600" aria-label="Remove">
                        <TrashIcon className="h-3.5 w-3.5" />
                      </button>
                    </ActionForm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
