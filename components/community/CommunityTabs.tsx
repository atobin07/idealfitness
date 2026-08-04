"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/dashboard", label: "Feed" },
  { href: "/community/leaderboard", label: "Leaderboard" },
  { href: "/community/challenges", label: "Challenges" },
  { href: "/community/duels", label: "Duels" },
  { href: "/community/goals", label: "Partner goals" },
];

export function CommunityTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 inline-flex flex-wrap gap-1 rounded-2xl bg-slate-100/80 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] dark:bg-white/5">
      {TABS.map((t) => {
        // The feed lives on the dashboard; its pathname carries no query string.
        const active = t.href.startsWith("/dashboard") ? pathname === "/dashboard" : pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-all duration-150 ${
              active
                ? "bg-white text-brand-700 shadow-sm dark:bg-white/10 dark:text-brand-200"
                : "text-slate-500 hover:text-ink-900 dark:hover:text-white"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
