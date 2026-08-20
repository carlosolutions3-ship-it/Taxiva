import { requireUser } from "@/lib/actions";
import { addIncomeAction, deleteIncomeAction } from "@/lib/data-actions";
import { getUserTaxContext } from "@/lib/tax";
import { formatMoney } from "@/lib/format";
import { SectionHeader, EmptyState } from "@/components/ui";
import { ActionSubmitButton } from "@/components/ActionSubmitButton";
import { ActionForm } from "@/components/ActionForm";
import { BanknoteIcon, TrashIcon } from "@/components/icons";

const US_SOURCES = ["employment", "self_employment", "freelance", "interest", "dividends", "other"];
const PH_SOURCES = ["employment", "self_employment", "online_selling", "professional_fees", "freelance", "other"];

export default async function IncomePage() {
  const user = await requireUser();
  const { income } = await getUserTaxContext(user);
  const sources = user.country === "PH" ? PH_SOURCES : US_SOURCES;
  const total = income.reduce((acc, i) => acc + i.amount, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Income"
        title="Income"
        description="Every income item you've recorded, manually or via document upload."
        action={income.length > 0 ? <p className="text-sm text-ink-500">Total: <span className="font-semibold text-ink-900">{formatMoney(total, income[0].currency)}</span></p> : undefined}
      />

      <ActionForm action={addIncomeAction} className="card animate-in grid gap-4 sm:grid-cols-2">
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
          <ActionSubmitButton pendingText="Adding…">Add income</ActionSubmitButton>
        </div>
      </ActionForm>

      {income.length === 0 ? (
        <EmptyState
          icon={<BanknoteIcon className="h-5 w-5" />}
          title="No income recorded yet"
          description="Add an entry above, or upload a payout report and let extraction do it for you."
        />
      ) : (
        <div className="card animate-in overflow-x-auto !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {income.map((item) => (
                <tr key={item.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/40">
                  <td className="px-5 py-3 text-ink-900">{item.description}</td>
                  <td className="px-4 py-3 capitalize text-ink-500">{item.source.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-ink-500">{item.date}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums text-ink-900">{formatMoney(item.amount, item.currency)}</td>
                  <td className="px-4 py-3 text-right">
                    <ActionForm action={deleteIncomeAction}>
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
