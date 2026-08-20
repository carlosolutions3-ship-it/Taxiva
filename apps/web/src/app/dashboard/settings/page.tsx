import Link from "next/link";
import { requireUser } from "@/lib/actions";
import { updateSettingsAction } from "@/lib/data-actions";
import { changePasswordAction, deleteAccountAction, updateNotificationsAction } from "@/lib/settings-actions";
import { prisma } from "@/lib/prisma";
import { SectionHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { ActionSubmitButton } from "@/components/ActionSubmitButton";
import { ActionForm } from "@/components/ActionForm";
import { AlertIcon, CheckIcon, DocumentIcon, LockIcon } from "@/components/icons";
import { BRAND_NAME } from "@/lib/brand";

const TAXPAYER_TYPES: Record<string, string[]> = {
  US: ["employee", "self_employed", "freelancer", "online_seller", "mixed"],
  PH: ["employee", "self_employed", "professional", "online_seller", "freelancer", "mixed_income_earner"],
};

const FILING_STATUSES: Record<string, string[]> = {
  US: ["single", "married_filing_jointly", "married_filing_separately", "head_of_household"],
  PH: ["individual", "mixed_income_earner"],
};

const SETTINGS_NAV = [
  { id: "personal", label: "Personal information" },
  { id: "tax-profile", label: "Tax profile" },
  { id: "connected-accounts", label: "Connected accounts" },
  { id: "documents", label: "Documents" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "privacy", label: "Privacy & data" },
  { id: "danger", label: "Delete account" },
];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ securityError?: string; securitySaved?: string; deleteError?: string }>;
}) {
  const user = await requireUser();
  const { securityError, securitySaved, deleteError } = await searchParams;
  const documentsCount = await prisma.document.count({ where: { userId: user.id } });

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Settings" title="Account settings" description="Manage your profile, tax details, security, and data." />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <nav className="hidden w-48 shrink-0 lg:sticky lg:top-24 lg:block">
          <ul className="space-y-0.5 text-sm">
            {SETTINGS_NAV.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="block rounded-lg px-3 py-1.5 text-ink-500 hover:bg-ink-100 hover:text-ink-900">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 flex-1 space-y-6">
          {/* Personal information */}
          <ActionForm id="personal" action={updateSettingsAction} className="card scroll-mt-24 animate-in space-y-4">
            <div>
              <h2 className="font-semibold text-ink-900">Personal information</h2>
              <p className="text-sm text-ink-500">Your name and account email.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="displayName">Name</label>
                <input className="input" id="displayName" name="displayName" defaultValue={user.displayName ?? ""} />
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input className="input bg-ink-50 text-ink-400" id="email" value={user.email} disabled />
                <p className="help-text">Email changes aren't supported in this demo build.</p>
              </div>
            </div>
            <ActionSubmitButton pendingText="Saving…">Save changes</ActionSubmitButton>
          </ActionForm>

          {/* Tax profile */}
          <ActionForm id="tax-profile" action={updateSettingsAction} className="card scroll-mt-24 animate-in space-y-4">
            <div>
              <h2 className="font-semibold text-ink-900">Tax profile</h2>
              <p className="text-sm text-ink-500">Your country determines which tax engine, forms, and rules apply.</p>
            </div>
            <div>
              <span className="label">Country</span>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
                  <input type="radio" name="country" value="US" defaultChecked={user.country === "US"} className="accent-brand-600" />
                  🇺🇸 United States
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm transition-colors has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
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
              <input className="input max-w-[10rem]" id="taxYear" name="taxYear" type="number" defaultValue={user.taxYear} min={2023} max={2026} />
            </div>
            <ActionSubmitButton pendingText="Saving…">Save changes</ActionSubmitButton>
          </ActionForm>

          {/* Connected accounts */}
          <div id="connected-accounts" className="card scroll-mt-24 animate-in">
            <h2 className="font-semibold text-ink-900">Connected accounts</h2>
            <p className="mt-1 text-sm text-ink-500">
              Automatic bank and marketplace connections aren't built yet — for now, {BRAND_NAME} works
              entirely from documents you upload yourself. This section is here so the eventual "connect
              your accounts" flow has a home; nothing here does anything today.
            </p>
          </div>

          {/* Documents */}
          <div id="documents" className="card scroll-mt-24 animate-in flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-100 text-ink-500">
                <DocumentIcon className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="font-semibold text-ink-900">Documents</h2>
                <p className="text-sm text-ink-500">{documentsCount} document{documentsCount === 1 ? "" : "s"} on file.</p>
              </div>
            </div>
            <Link href="/dashboard/documents" className="btn-secondary">Manage documents</Link>
          </div>

          {/* Security */}
          <form id="security" action={changePasswordAction} className="card scroll-mt-24 animate-in space-y-4">
            <div className="flex items-center gap-2">
              <LockIcon className="h-4 w-4 text-ink-400" />
              <h2 className="font-semibold text-ink-900">Security</h2>
            </div>
            <p className="text-sm text-ink-500">Change your password. Changing it signs out every other session.</p>
            {securityError && (
              <div className="flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-700">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {securityError}
              </div>
            )}
            {securitySaved && (
              <div className="flex items-start gap-2 rounded-lg bg-success-50 px-3 py-2.5 text-sm text-success-700">
                <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />
                Password updated.
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="label" htmlFor="currentPassword">Current password</label>
                <input className="input" id="currentPassword" name="currentPassword" type="password" required />
              </div>
              <div>
                <label className="label" htmlFor="newPassword">New password</label>
                <input className="input" id="newPassword" name="newPassword" type="password" required minLength={8} />
              </div>
              <div>
                <label className="label" htmlFor="confirmPassword">Confirm new password</label>
                <input className="input" id="confirmPassword" name="confirmPassword" type="password" required minLength={8} />
              </div>
            </div>
            <SubmitButton pendingText="Updating…">Update password</SubmitButton>
          </form>

          {/* Notifications */}
          <ActionForm id="notifications" action={updateNotificationsAction} className="card scroll-mt-24 animate-in space-y-4">
            <h2 className="font-semibold text-ink-900">Notifications</h2>
            <label className="flex items-center justify-between gap-4 rounded-lg border border-ink-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink-900">Email reminders</p>
                <p className="text-xs text-ink-500">Deadline reminders and missing-document nudges. (No email is actually sent yet in this demo — this only controls the stored preference.)</p>
              </div>
              <input type="checkbox" name="emailRemindersEnabled" defaultChecked={user.emailRemindersEnabled} className="h-5 w-5 accent-brand-600" />
            </label>
            <ActionSubmitButton variant="secondary" pendingText="Saving…">Save preference</ActionSubmitButton>
          </ActionForm>

          {/* Privacy & data export */}
          <div id="privacy" className="card scroll-mt-24 animate-in space-y-3">
            <h2 className="font-semibold text-ink-900">Privacy & data</h2>
            <p className="text-sm text-ink-500">
              Your documents and financial data belong to your account only — see the trust section on the{" "}
              <Link href="/" className="text-brand-700 hover:underline">homepage</Link> for what that means today.
            </p>
            {deleteError && (
              <div className="flex items-start gap-2 rounded-lg bg-danger-50 px-3 py-2.5 text-sm text-danger-700">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                {deleteError}
              </div>
            )}
            <a href="/api/account/export" className="btn-secondary inline-flex">Export my data (JSON)</a>
          </div>

          {/* Danger zone */}
          <form id="danger" action={deleteAccountAction} className="card scroll-mt-24 animate-in space-y-4 border-danger-200">
            <div>
              <h2 className="font-semibold text-danger-700">Delete account</h2>
              <p className="text-sm text-ink-500">
                Permanently deletes your account and everything in it — documents, income, expenses,
                deductions, and filing history. This cannot be undone.
              </p>
            </div>
            <div className="max-w-xs">
              <label className="label" htmlFor="deletePassword">Confirm your password</label>
              <input className="input" id="deletePassword" name="password" type="password" required />
            </div>
            <SubmitButton variant="danger" pendingText="Deleting…">Delete my account permanently</SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
