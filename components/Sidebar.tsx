"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/Avatar";
import { Logo } from "@/components/Logo";
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
  community: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0",
  events: "M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z",
  members: "M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
  topic: "M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z",
  feedback: "M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z",
  pets: "M8.5 10.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 8a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm4.5 2.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM12 13c-2 0-3.5 1.6-3.5 3.2 0 1 .8 1.8 1.8 1.8h3.4c1 0 1.8-.8 1.8-1.8C15.5 14.6 14 13 12 13z",
};

export function Sidebar({
  role,
  name,
  unread,
  isAdmin,
  mobileOpen,
  onNavigate,
}: {
  role: UserRole;
  name: string;
  unread: number;
  isAdmin: boolean;
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
        { href: "/community", label: "Community", icon: "community" },
        { href: "/events", label: "Events", icon: "events" },
        { href: "/topic", label: "Hot Topic", icon: "topic" },
        { href: "/animal-kingdom", label: "Animal Kingdom", icon: "pets" },
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
        { href: "/members", label: "Members", icon: "members" },
        { href: "/messages", label: "Messages", icon: "messages", badge: unread },
        { href: "/announcements", label: "Announcements", icon: "announcements" },
        { href: "/feedback", label: "Feedback", icon: "feedback" },
      ],
    },
    {
      title: "Business",
      items: [
        { href: "/billing", label: "Billing", icon: "billing" },
        ...(isTrainer ? [{ href: "/analytics", label: "Analytics", icon: "analytics" }] : []),
      ],
    },
    ...(isAdmin
      ? [
          {
            title: "Admin",
            items: [
              { href: "/admin", label: "Admin console", icon: "analytics" },
              { href: "/admin/people", label: "People & roster", icon: "clients" },
              { href: "/admin/settings", label: "Gym settings", icon: "settings" },
            ],
          },
        ]
      : []),
  ];

  return (
    <aside
      className={`${
        mobileOpen ? "fixed inset-y-0 left-0 z-40 block w-72" : "hidden"
      } shrink-0 overflow-y-auto bg-ink-900 p-4 text-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64`}
    >
      <div className="mb-6 px-2 pt-1">
        <Logo variant="white" />
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
