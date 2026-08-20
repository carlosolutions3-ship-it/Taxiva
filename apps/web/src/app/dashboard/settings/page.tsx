import { requireUser } from "@/lib/actions";
import { updateSettingsAction } from "@/lib/data-actions";

const TAXPAYER_TYPES: Record<string, string[]> = {
  US: ["employee", "self_employed", "freelancer", "online_seller", "mixed"],
  PH: ["employee", "self_employed", "professional", "online_seller", "freelancer", "mixed_income_earner"],
};

const FILING_STATUSES: Record<string, string[]> = {
  US: ["single", "married_filing_jointly", "married_filing_separately", "head_of_household"],
  PH: ["individual", "mixed_income_earner"],
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Settings</h1>
        <p className="mt-1 text-ink-600">Your country determines which tax engine, forms, and rules apply.</p>
      </div>

      <form action={updateSettingsAction} className="card space-y-4">
        <div>
          <label className="label" htmlFor="displayName">Name</label>
          <input className="input" id="displayName" name="displayName" defaultValue={user.displayName ?? ""} />
        </div>

        <div>
          <span className="label">Country</span>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="country" value="US" defaultChecked={user.country === "US"} className="accent-brand-600" />
              🇺🇸 United States
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="country" value="PH" defaultChecked={user.country === "PH"} className="accent-brand-600" />
              🇵🇭 Philippines
            </label>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="taxpayerType">Taxpayer type</label>
            <select className="input" id="taxpayerType" name="taxpayerType" defaultValue={user.taxpayerType}>
              {(TAXPAYER_TYPES[user.country] ?? TAXPAYER_TYPES.US).map((t) => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="filingStatus">Filing status</label>
            <select className="input" id="filingStatus" name="filingStatus" defaultValue={user.filingStatus}>
              {(FILING_STATUSES[user.country] ?? FILING_STATUSES.US).map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label" htmlFor="taxYear">Tax year</label>
          <input className="input" id="taxYear" name="taxYear" type="number" defaultValue={user.taxYear} min={2023} max={2026} />
        </div>

        <button type="submit" className="btn-primary">Save settings</button>
      </form>

      <div className="card border-ink-200 bg-ink-50">
        <h2 className="font-medium text-ink-900">About this account</h2>
        <p className="mt-1 text-sm text-ink-600">Email: {user.email}</p>
        <p className="mt-1 text-sm text-ink-600">Account created: {new Date(user.createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
