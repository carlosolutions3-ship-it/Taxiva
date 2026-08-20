"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "🏠" },
  { href: "/dashboard/documents", label: "Documents", icon: "📄" },
  { href: "/dashboard/income", label: "Income", icon: "💰" },
  { href: "/dashboard/expenses", label: "Expenses", icon: "🧾" },
  { href: "/dashboard/deductions", label: "Deductions", icon: "✅" },
  { href: "/dashboard/estimate", label: "Tax estimate", icon: "📊" },
  { href: "/dashboard/forms", label: "Draft forms", icon: "📋" },
  { href: "/dashboard/filing", label: "Filing", icon: "📬" },
  { href: "/dashboard/assistant", label: "AI Assistant", icon: "💬" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex w-60 shrink-0 flex-col gap-1 border-r border-ink-100 bg-white p-4">
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active ? "bg-brand-50 text-brand-800" : "text-ink-600 hover:bg-ink-50"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
