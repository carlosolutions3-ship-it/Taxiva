import { requireUser } from "@/lib/actions";
import { logoutAction } from "@/lib/actions";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { LogOutIcon } from "@/components/icons";
import { StatusBadge } from "@/components/ui";

const COUNTRY_FLAG: Record<string, string> = { US: "🇺🇸", PH: "🇵🇭" };

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-ink-100 bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <MobileNav />
            <span className="text-lg leading-none">{COUNTRY_FLAG[user.country] ?? "🌐"}</span>
            <span className="hidden text-sm font-medium text-ink-900 sm:inline">
              {user.displayName || user.email}
            </span>
            <StatusBadge tone="neutral">Tax year {user.taxYear}</StatusBadge>
            <span className="hidden sm:inline">
              <StatusBadge tone="warning">Sandbox mode</StatusBadge>
            </span>
            {user.isDemo && (
              <StatusBadge tone="brand">Demo account — fictional data</StatusBadge>
            )}
          </div>
          <form action={logoutAction}>
            <button type="submit" className="btn-ghost text-xs">
              <LogOutIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Log out</span>
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
