"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";

type Coach = {
  id: string;
  full_name: string;
  bio: string | null;
  avatar_url: string | null;
  specialties: string[];
};

export function CoachDirectory({ coaches }: { coaches: Coach[] }) {
  const [active, setActive] = useState<string | null>(null);

  const allSpecialties = useMemo(() => {
    const set = new Set<string>();
    coaches.forEach((c) => c.specialties.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [coaches]);

  const filtered = active ? coaches.filter((c) => c.specialties.includes(active)) : coaches;

  return (
    <div>
      {/* Specialty filter */}
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => setActive(null)}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${active === null ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"}`}
        >
          All coaches
        </button>
        {allSpecialties.map((s) => (
          <button
            key={s}
            onClick={() => setActive(s === active ? null : s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${active === s ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center muted">No coaches match that specialty yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <div key={c.id} className="card flex flex-col p-5">
              <div className="flex items-center gap-3">
                <Avatar name={c.full_name || "Coach"} src={c.avatar_url} size="lg" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900 dark:text-white">{c.full_name}</p>
                  <p className="text-xs muted">Coach</p>
                </div>
              </div>
              {c.bio && <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{c.bio}</p>}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.specialties.map((s) => (
                  <span
                    key={s}
                    className={`badge ${s === active ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
                <Link href={`/members/${c.id}`} className="btn-secondary flex-1 text-center text-sm">Profile</Link>
                <Link href={`/messages?with=${c.id}`} className="btn-secondary flex-1 text-center text-sm">Message</Link>
                <Link href="/calendar" className="btn-primary flex-1 text-center text-sm">Book</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
