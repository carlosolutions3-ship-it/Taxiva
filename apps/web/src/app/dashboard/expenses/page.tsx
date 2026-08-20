import { requireUser } from "@/lib/actions";
import { addExpenseAction, deleteExpenseAction } from "@/lib/data-actions";
import { getUserTaxContext } from "@/lib/tax";

function money(amount: number, currency: string): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const CATEGORIES = [
  "supplies", "equipment", "software_subscriptions", "advertising_marketing", "shipping_logistics",
  "home_office", "utilities", "professional_fees", "travel", "meals", "rent", "salaries_and_wages",
  "taxes_and_licenses", "depreciation", "other",
];

export default async function ExpensesPage() {
  const user = await requireUser();
  const { expenses } = await getUserTaxContext(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Expenses</h1>
        <p className="mt-1 text-ink-600">
          Leave category as "Auto-detect" and Taxiva will categorize it from the description — the same
          engine used when a receipt is uploaded.
        </p>
      </div>

      <form action={addExpenseAction} className="card grid gap-4 sm:grid-cols-2">
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
          <button type="submit" className="btn-primary">Add expense</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-ink-500">
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4 text-right">Amount</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-400">No expenses recorded yet.</td>
              </tr>
            )}
            {expenses.map((item) => (
              <tr key={item.id} className="border-b border-ink-50">
                <td className="py-2 pr-4 text-ink-900">{item.description}</td>
                <td className="py-2 pr-4">
                  <span className="badge bg-ink-100 text-ink-700">{item.category.replace(/_/g, " ")}</span>
                </td>
                <td className="py-2 pr-4 text-ink-600">{item.date}</td>
                <td className="py-2 pr-4 text-right font-medium text-ink-900">{money(item.amount, item.currency)}</td>
                <td className="py-2 text-right">
                  <form action={deleteExpenseAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button type="submit" className="text-xs text-ink-400 hover:text-red-600">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
