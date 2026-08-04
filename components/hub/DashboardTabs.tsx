"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { key: "home", label: "Home" },
  { key: "hub", label: "My Hub" },
  { key: "classes", label: "Classes" },
  { key: "events", label: "Events" },
  { key: "topic", label: "Hot Topic" },
];

export function DashboardTabs() {
  const params = useSearchParams();
  const current = params.get("tab") ?? "home";

  return (
    <div className="mb-6 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      <div className="inline-flex gap-1 rounded-2xl bg-slate-100/80 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] dark:bg-white/5">
        {TABS.map((t) => {
          const active = current === t.key;
          const href = t.key === "home" ? "/dashboard" : `/dashboard?tab=${t.key}`;
          return (
            <Link
              key={t.key}
              href={href}
              scroll={false}
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-all duration-150 ${
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
    </div>
  );
}
