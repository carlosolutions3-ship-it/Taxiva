"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND_NAME } from "@/lib/brand";
import { NAV_ITEMS } from "./Sidebar";
import { XIcon } from "./icons";

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" {...props}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-100"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 animate-fade-in">
          <div className="absolute inset-0 bg-ink-950/40" onClick={() => setOpen(false)} />
          <nav className="animate-in absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col gap-0.5 bg-white p-3 shadow-popover">
            <div className="mb-4 flex items-center justify-between px-2 py-2">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-ink-900 text-xs font-bold text-white">
                  {BRAND_NAME[0]}
                </div>
                <span className="text-[15px] font-semibold text-ink-900">{BRAND_NAME}</span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                  }`}
                >
                  <item.Icon className={`h-[18px] w-[18px] shrink-0 ${active ? "text-brand-600" : "text-ink-400"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}
