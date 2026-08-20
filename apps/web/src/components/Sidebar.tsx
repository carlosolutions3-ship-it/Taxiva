"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_NAME } from "@/lib/brand";
import {
  HomeIcon,
  DocumentIcon,
  BanknoteIcon,
  ReceiptIcon,
  CheckShieldIcon,
  ChartIcon,
  ClipboardIcon,
  SendIcon,
  ChatIcon,
  SettingsIcon,
} from "./icons";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", Icon: HomeIcon },
  { href: "/dashboard/documents", label: "Documents", Icon: DocumentIcon },
  { href: "/dashboard/income", label: "Income", Icon: BanknoteIcon },
  { href: "/dashboard/expenses", label: "Expenses", Icon: ReceiptIcon },
  { href: "/dashboard/deductions", label: "Deductions", Icon: CheckShieldIcon },
  { href: "/dashboard/estimate", label: "Tax return", Icon: ChartIcon },
  { href: "/dashboard/forms", label: "Draft forms", Icon: ClipboardIcon },
  { href: "/dashboard/filing", label: "Filing", Icon: SendIcon },
  { href: "/dashboard/assistant", label: "AI Assistant", Icon: ChatIcon },
  { href: "/dashboard/settings", label: "Settings", Icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden w-60 shrink-0 flex-col gap-0.5 border-r border-ink-100 bg-white p-3 sm:flex">
      <Link href="/dashboard" prefetch={false} className="mb-4 flex items-center gap-2 px-3 py-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-xs font-bold text-white">
          {BRAND_NAME[0]}
        </div>
        <span className="text-[15px] font-semibold text-ink-900">{BRAND_NAME}</span>
      </Link>
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150 ${
              active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50 hover:text-ink-900"
            }`}
          >
            <item.Icon
              className={`h-[18px] w-[18px] shrink-0 ${active ? "text-brand-600" : "text-ink-400 group-hover:text-ink-500"}`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
