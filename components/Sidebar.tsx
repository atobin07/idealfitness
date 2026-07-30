"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/Avatar";
import type { UserRole } from "@/lib/database.types";

type NavItem = { href: string; label: string; icon: string; badge?: number };
type NavSection = { title: string; items: NavItem[] };

const ICONS: Record<string, string> = {
  dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  classes: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-1.35M12 4a3 3 0 100 6 3 3 0 000-6z",
  workouts: "M6.5 6.5l11 11m-9-13l2 2m-3 1l2 2M17.5 5.5l1 1m-1 11l2 2m-13-3l1 1M4 20l2-2",
  exercises: "M4 6h16M4 10h16M4 14h10M4 18h6",
  progress: "M3 3v18h18M7 14l3-3 3 3 5-6",
  clients: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-1.35",
  messages: "M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 01-13.5 7.8L3 21l1.2-4.5A9 9 0 1121 12z",
  announcements: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4 4 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
  billing: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
  analytics: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
};

export function Sidebar({
  role,
  name,
  unread,
  mobileOpen,
  onNavigate,
}: {
  role: UserRole;
  name: string;
  unread: number;
  mobileOpen: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const isTrainer = role === "trainer";

  const sections: NavSection[] = [
    {
      title: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
        { href: "/calendar", label: "Calendar", icon: "calendar" },
        { href: "/classes", label: "Classes", icon: "classes" },
      ],
    },
    {
      title: "Training",
      items: [
        { href: "/workouts", label: "Workouts", icon: "workouts" },
        ...(isTrainer ? [{ href: "/exercises", label: "Exercise library", icon: "exercises" }] : []),
        { href: "/progress", label: "Progress & goals", icon: "progress" },
      ],
    },
    {
      title: "People",
      items: [
        { href: "/clients", label: isTrainer ? "Clients" : "My Trainer", icon: "clients" },
        { href: "/messages", label: "Messages", icon: "messages", badge: unread },
        { href: "/announcements", label: "Announcements", icon: "announcements" },
      ],
    },
    {
      title: "Business",
      items: [
        { href: "/billing", label: "Billing", icon: "billing" },
        ...(isTrainer ? [{ href: "/analytics", label: "Analytics", icon: "analytics" }] : []),
      ],
    },
  ];

  return (
    <aside
      className={`${
        mobileOpen ? "fixed inset-y-0 left-0 z-40 block w-72" : "hidden"
      } shrink-0 overflow-y-auto bg-ink-900 p-4 text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64`}
    >
      <div className="mb-6 flex items-center gap-2 px-2 pt-1">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-black shadow-lg shadow-brand-600/30">
          IF
        </div>
        <span className="text-lg font-bold tracking-tight">IdealFitness</span>
      </div>

      <nav className="space-y-5">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                      active
                        ? "bg-brand-500/15 text-brand-200"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[item.icon]} />
                    </svg>
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span className="badge bg-brand-500 text-white">{item.badge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-4">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/5 hover:text-white"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
            <path strokeLinecap="round" strokeLinejoin="round" d={ICONS.settings} />
          </svg>
          Settings
        </Link>
        <div className="mt-2 flex items-center gap-3 px-3 py-2">
          <Avatar name={name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs capitalize text-slate-400">{role}</p>
          </div>
        </div>
        <form action={signOut}>
          <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
