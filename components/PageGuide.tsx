"use client";

import { useEffect, useState } from "react";

/**
 * A dismissible "How this page works" banner to speed up staff training and
 * adoption. Collapsed state is remembered per-page in localStorage, so power
 * users can tuck it away while new staff keep it open.
 */
export function PageGuide({
  id,
  summary,
  points,
}: {
  id: string;
  summary: string;
  points?: string[];
}) {
  const key = `guide:${id}`;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(key) === "closed") setOpen(false);
    } catch {}
  }, [key]);

  function toggle() {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(key, next ? "open" : "closed");
      } catch {}
      return next;
    });
  }

  return (
    <div
      suppressHydrationWarning
      className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-50 to-white ring-1 ring-brand-100 dark:from-brand-500/10 dark:to-ink-800 dark:ring-brand-500/20"
    >
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
        aria-expanded={open}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">i</span>
        <span className="flex-1 text-sm font-bold text-brand-800 dark:text-brand-200">How this page works</span>
        <svg className={`h-4 w-4 text-brand-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 pl-11">
          <p className="text-sm text-ink-700 dark:text-slate-300">{summary}</p>
          {points && points.length > 0 && (
            <ul className="mt-2 space-y-1">
              {points.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span className="mt-0.5 text-brand-500">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
