import { requireUser } from "@/lib/actions";
import { addIncomeAction, deleteIncomeAction } from "@/lib/data-actions";
import { getUserTaxContext } from "@/lib/tax";

function money(amount: number, currency: string): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const US_SOURCES = ["employment", "self_employment", "freelance", "interest", "dividends", "other"];
const PH_SOURCES = ["employment", "self_employment", "online_selling", "professional_fees", "freelance", "other"];

export default async function IncomePage() {
  const user = await requireUser();
  const { income } = await getUserTaxContext(user);
  const sources = user.country === "PH" ? PH_SOURCES : US_SOURCES;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Income</h1>
        <p className="mt-1 text-ink-600">Every income item you've recorded, manually or via document upload.</p>
      </div>

      <form action={addIncomeAction} className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="description">Description</label>
          <input className="input" id="description" name="description" required placeholder="e.g. Shopee payout, June" />
        </div>
        <div>
          <label className="label" htmlFor="amount">Amount ({user.country === "PH" ? "₱" : "$"})</label>
          <input className="input" id="amount" name="amount" type="number" step="0.01" min="0" required />
        </div>
        <div>
          <label className="label" htmlFor="source">Source</label>
          <select className="input" id="source" name="source" defaultValue={sources[0]}>
            {sources.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="date">Date</label>
          <input className="input" id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        </div>
        {user.country === "PH" && (
          <div className="sm:col-span-2">
            <label className="label" htmlFor="platform">Platform (optional)</label>
            <input className="input" id="platform" name="platform" placeholder="shopee, lazada, tiktok_shop..." />
          </div>
        )}
        <div className="sm:col-span-2">
          <button type="submit" className="btn-primary">Add income</button>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-ink-500">
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Source</th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4 text-right">Amount</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {income.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-ink-400">No income recorded yet.</td>
              </tr>
            )}
            {income.map((item) => (
              <tr key={item.id} className="border-b border-ink-50">
                <td className="py-2 pr-4 text-ink-900">{item.description}</td>
                <td className="py-2 pr-4 text-ink-600">{item.source.replace(/_/g, " ")}</td>
                <td className="py-2 pr-4 text-ink-600">{item.date}</td>
                <td className="py-2 pr-4 text-right font-medium text-ink-900">{money(item.amount, item.currency)}</td>
                <td className="py-2 text-right">
                  <form action={deleteIncomeAction}>
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
