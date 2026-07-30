"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import { Avatar } from "@/components/Avatar";
import type { UserRole } from "@/lib/database.types";

type NavItem = { href: string; label: string; icon: string; badge?: number };

function iconPath(name: string) {
  const paths: Record<string, string> = {
    dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    clients: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-1.35",
    messages: "M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 01-13.5 7.8L3 21l1.2-4.5A9 9 0 1121 12z",
    announcements: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4 4 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z",
    settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z",
  };
  return paths[name] ?? "";
}

export function Sidebar({
  role,
  name,
  unread,
}: {
  role: UserRole;
  name: string;
  unread: number;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { href: "/calendar", label: "Calendar", icon: "calendar" },
    {
      href: "/clients",
      label: role === "trainer" ? "Clients" : "My Trainer",
      icon: "clients",
    },
    { href: "/messages", label: "Messages", icon: "messages", badge: unread },
    { href: "/announcements", label: "Announcements", icon: "announcements" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];

  const nav = (
    <nav className="flex flex-1 flex-col gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-brand-500/15 text-brand-200"
                : "text-slate-300 hover:bg-white/5 hover:text-white"
            }`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={iconPath(item.icon)} />
            </svg>
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="badge bg-brand-500 text-white">{item.badge}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-ink-900 px-4 py-3 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-sm font-black">IF</div>
          <span className="font-bold">IdealFitness</span>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Toggle menu">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          open ? "block" : "hidden"
        } w-full shrink-0 bg-ink-900 p-4 text-white lg:block lg:w-64`}
      >
        <div className="mb-6 hidden items-center gap-2 px-2 lg:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-black">IF</div>
          <span className="text-lg font-bold tracking-tight">IdealFitness</span>
        </div>

        <div className="flex h-[calc(100%-3rem)] flex-col">
          {nav}

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 px-2">
              <Avatar name={name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{name}</p>
                <p className="text-xs capitalize text-slate-400">{role}</p>
              </div>
            </div>
            <form action={signOut} className="mt-3">
              <button className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
