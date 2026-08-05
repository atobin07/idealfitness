"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICON: Record<string, string> = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  community: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-1.35M12 4a3 3 0 100 6 3 3 0 000-6z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  progress: "M3 3v18h18M7 14l3-3 3 3 5-6",
  menu: "M4 6h16M4 12h16M4 18h16",
};

const ITEMS = [
  { href: "/dashboard", label: "Home", icon: "dashboard", match: (p: string) => p === "/dashboard" },
  { href: "/feed", label: "Community", icon: "community", match: (p: string) => p.startsWith("/feed") },
  { href: "/calendar", label: "Calendar", icon: "calendar", match: (p: string) => p.startsWith("/calendar") },
  { href: "/progress", label: "Progress", icon: "progress", match: (p: string) => p.startsWith("/progress") },
];

export function MobileTabBar({ onMore, moreActive }: { onMore: () => void; moreActive: boolean }) {
  const pathname = usePathname();

  const cell = (active: boolean) =>
    `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-semibold ${
      active ? "text-brand-600 dark:text-brand-300" : "text-slate-500 dark:text-slate-400"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-white/10 dark:bg-ink-900/95 lg:hidden"
      aria-label="Primary"
    >
      {ITEMS.map((it) => {
        const active = it.match(pathname);
        return (
          <Link key={it.href} href={it.href} className={cell(active)}>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.6}>
              <path strokeLinecap="round" strokeLinejoin="round" d={ICON[it.icon]} />
            </svg>
            {it.label}
          </Link>
        );
      })}
      <button type="button" onClick={onMore} className={cell(moreActive)}>
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
          <path strokeLinecap="round" strokeLinejoin="round" d={ICON.menu} />
        </svg>
        More
      </button>
    </nav>
  );
}
