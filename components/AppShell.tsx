"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MobileTabBar } from "@/components/MobileTabBar";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";
import type { Notification, UserRole } from "@/lib/database.types";
import type { SearchItem } from "@/components/GlobalSearch";

export function AppShell({
  role,
  name,
  userId,
  unread,
  isAdmin,
  notifications,
  searchItems,
  children,
}: {
  role: UserRole;
  name: string;
  userId: string;
  unread: number;
  isAdmin: boolean;
  notifications: Notification[];
  searchItems: SearchItem[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-ink-900 lg:flex">
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />
      )}
      <Sidebar
        role={role}
        name={name}
        unread={unread}
        isAdmin={isAdmin}
        mobileOpen={open}
        onNavigate={() => setOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-200 bg-white/80 px-4 py-2.5 backdrop-blur dark:border-white/10 dark:bg-ink-900/80">
          <button
            onClick={() => setOpen(true)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10 lg:hidden"
            aria-label="Open menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <GlobalSearch items={searchItems} />
          </div>
          <NotificationBell userId={userId} initial={notifications} />
          <ThemeToggle />
        </header>

        <main className="flex-1 overflow-x-hidden">
          <div className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pt-8 lg:pb-8">{children}</div>
        </main>
      </div>

      {!open && <MobileTabBar onMore={() => setOpen(true)} moreActive={false} />}
    </div>
  );
}
