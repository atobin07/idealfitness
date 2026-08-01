import { Avatar } from "@/components/Avatar";

type Attendee = { full_name: string; avatar_url: string | null } | null;

/**
 * Shows a "N coming" count that reveals the member list on hover / focus.
 * Pure CSS popover — works in a Server Component, no client JS needed.
 */
export function ClassRoster({
  booked,
  waitlisted = [],
}: {
  booked: Attendee[];
  waitlisted?: Attendee[];
}) {
  const going = booked.filter(Boolean) as { full_name: string; avatar_url: string | null }[];
  const wait = waitlisted.filter(Boolean) as { full_name: string; avatar_url: string | null }[];

  if (going.length === 0) {
    return <span className="text-xs muted">Be the first in! 💪</span>;
  }

  return (
    <span className="group relative inline-block">
      <span
        tabIndex={0}
        className="inline-flex cursor-default items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 outline-none ring-brand-200 focus:ring-2 dark:bg-brand-500/15 dark:text-brand-300"
      >
        👥 {going.length} coming
      </span>

      <span className="pointer-events-none absolute bottom-full left-0 z-30 mb-2 hidden w-60 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-lg group-hover:block group-focus-within:block dark:border-white/10 dark:bg-ink-800">
        <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide muted">Who&apos;s coming</span>
        <span className="block space-y-1.5">
          {going.map((p, i) => (
            <span key={i} className="flex items-center gap-2">
              <Avatar name={p.full_name} src={p.avatar_url} size="sm" />
              <span className="truncate text-sm text-ink-900 dark:text-white">{p.full_name}</span>
            </span>
          ))}
        </span>
        {wait.length > 0 && (
          <>
            <span className="mb-1 mt-2 block border-t border-slate-100 pt-2 text-[11px] font-semibold uppercase tracking-wide muted dark:border-white/10">Waitlist</span>
            <span className="block space-y-1.5">
              {wait.map((p, i) => (
                <span key={i} className="flex items-center gap-2">
                  <Avatar name={p.full_name} src={p.avatar_url} size="sm" />
                  <span className="truncate text-sm text-ink-900 dark:text-white">{p.full_name}</span>
                </span>
              ))}
            </span>
          </>
        )}
      </span>
    </span>
  );
}
