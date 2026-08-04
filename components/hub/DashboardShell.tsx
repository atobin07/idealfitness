"use client";

import { createContext, useContext, useState } from "react";
import { PageHeader } from "@/components/PageHeader";

export type ShellTab = { key: string; label: string; content: React.ReactNode };

const TabContext = createContext<(key: string) => void>(() => {});

/** Lets in-panel controls switch tabs without navigating. */
export function useDashboardTab() {
  return useContext(TabContext);
}

/**
 * Client-side tab shell. Every panel is rendered once on the server and passed
 * in as `content`; switching tabs just shows/hides — no navigation, no reload,
 * no scroll jump, so the page flows.
 */
export function DashboardShell({
  tabs,
  initial,
  title,
  subtitle,
}: {
  tabs: ShellTab[];
  initial: string;
  title: string;
  subtitle?: string;
}) {
  const [active, setActive] = useState(tabs.some((t) => t.key === initial) ? initial : tabs[0].key);

  function select(key: string) {
    if (!tabs.some((t) => t.key === key)) return;
    setActive(key);
    // Keep the address bar in sync for refresh/share/deep-links, without a
    // Next.js navigation (no re-render, no scroll reset).
    if (typeof window !== "undefined") {
      const url = key === tabs[0].key ? "/dashboard" : `/dashboard?tab=${key}`;
      window.history.replaceState(null, "", url);
    }
  }

  return (
    <TabContext.Provider value={select}>
      <PageHeader title={title} subtitle={subtitle} />

      <div className="mb-6 -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
        <div className="inline-flex gap-1 rounded-2xl bg-slate-100/80 p-1 shadow-[inset_0_1px_2px_rgba(15,23,42,0.06)] dark:bg-white/5">
          {tabs.map((t) => {
            const isActive = t.key === active;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => select(t.key)}
                aria-pressed={isActive}
                className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-white text-brand-700 shadow-sm dark:bg-white/10 dark:text-brand-200"
                    : "text-slate-500 hover:text-ink-900 dark:hover:text-white"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map((t) => (
        <div key={t.key} className={t.key === active ? "" : "hidden"}>
          {t.content}
        </div>
      ))}
    </TabContext.Provider>
  );
}
