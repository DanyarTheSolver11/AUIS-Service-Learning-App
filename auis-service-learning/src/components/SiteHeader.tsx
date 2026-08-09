"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Eagle } from "./Eagle";

const ADMIN_TABS = [
  { href: "/admin", label: "Registry" },
  { href: "/admin/entries", label: "Entries" },
  { href: "/admin/semesters", label: "Semesters" },
  { href: "/admin/broadcast", label: "Message Students" },
];

export function SiteHeader({
  name,
  role,
}: {
  name?: string | null;
  role: "STUDENT" | "ADMIN";
}) {
  const pathname = usePathname();

  return (
    <header className="border-b border-brass-400/25 bg-ink-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Eagle className="h-6 w-7 text-brass-400" />
          <div className="leading-tight">
            <p className="font-display text-sm italic text-white">AUIS Volunteering Hours Tracker</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-brass-300/70">
              {role === "ADMIN" ? "Student Services" : "American University of Iraq, Sulaimani"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {name && <span className="hidden text-xs text-parchment-100/60 sm:inline">{name}</span>}
          <Link
            href="/help"
            className="text-[11px] font-medium uppercase tracking-wide text-parchment-100/60 transition hover:text-brass-200"
          >
            Help
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="rounded-sm border border-brass-400/30 px-3 py-1.5 text-[11px] font-medium uppercase tracking-wide text-brass-200 transition hover:border-brass-400/60 hover:bg-white/5"
          >
            Sign out
          </button>
        </div>
      </div>

      {role === "ADMIN" && (
        <div className="mx-auto flex max-w-5xl gap-1 px-6">
          {ADMIN_TABS.map((tab) => {
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`border-b-2 px-3 py-2.5 text-[12px] font-medium uppercase tracking-wide transition ${
                  active
                    ? "border-brass-400 text-white"
                    : "border-transparent text-parchment-100/50 hover:text-parchment-100/80"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
