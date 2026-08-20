import { requireUser } from "@/lib/actions";
import { logoutAction } from "@/lib/actions";
import { Sidebar } from "@/components/Sidebar";

const COUNTRY_FLAG: Record<string, string> = { US: "🇺🇸", PH: "🇵🇭" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar />
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-ink-100 bg-white px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-lg">{COUNTRY_FLAG[user.country] ?? "🌐"}</span>
            <span className="font-medium text-ink-900">{user.displayName || user.email}</span>
            <span className="badge bg-ink-100 text-ink-600">Tax year {user.taxYear}</span>
            <span className="badge bg-amber-100 text-amber-800">Sandbox mode</span>
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn-secondary text-xs">Log out</button>
          </form>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
