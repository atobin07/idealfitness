import { Avatar } from "@/components/Avatar";

type Attendee = { full_name: string; avatar_url: string | null } | null;
type Member = { full_name: string; avatar_url: string | null };

/**
 * "N coming" count that, on hover/focus, fans the members out along an arc.
 * Pure CSS + inline transforms — works in a Server Component, no client JS.
 */
export function ClassRoster({
  booked,
  waitlisted = [],
}: {
  booked: Attendee[];
  waitlisted?: Attendee[];
}) {
  const going = booked.filter(Boolean) as Member[];
  const wait = waitlisted.filter(Boolean) as Member[];

  if (going.length === 0) {
    return <span className="text-xs muted">Be the first in! 💪</span>;
  }

  // Arc geometry.
  const shown = going.slice(0, 9);
  const extra = going.length - shown.length;
  const n = shown.length;
  const R = 88;
  const spread = Math.min(150, Math.max(0, (n - 1) * 26)); // total degrees
  const half = spread / 2;
  const halfRad = (half * Math.PI) / 180;
  const W = Math.round(2 * R * Math.sin(halfRad)) + 96;
  const H = R + 76;
  const pivotTop = H - 16;

  const seats = shown.map((p, i) => {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const ang = (-half + t * spread) * (Math.PI / 180);
    return { p, x: Math.round(R * Math.sin(ang)), y: Math.round(-R * Math.cos(ang)), i };
  });

  return (
    <span className="group relative inline-block">
      {/* Trigger: overlapped avatars + count */}
      <span
        tabIndex={0}
        className="inline-flex cursor-default items-center gap-2 rounded-full bg-brand-50 py-0.5 pl-0.5 pr-2.5 outline-none ring-brand-200 focus:ring-2 dark:bg-brand-500/15"
      >
        <span className="flex -space-x-2">
          {going.slice(0, 4).map((p, i) => (
            <span key={i} className="rounded-full ring-2 ring-brand-50 dark:ring-transparent">
              <Avatar name={p.full_name} src={p.avatar_url} size="sm" />
            </span>
          ))}
        </span>
        <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">{going.length} coming</span>
      </span>

      {/* Fan-out popover */}
      <span
        className="pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 opacity-0 transition duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        style={{ width: W + 28 }}
      >
        <span className="block rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-ink-800">
          <span className="mb-1 block text-center text-[11px] font-semibold uppercase tracking-wide muted">
            Who&apos;s crushing it 💪
          </span>

          {/* The arc */}
          <span className="relative mx-auto block" style={{ width: W, height: H }}>
            {seats.map(({ p, x, y, i }) => (
              <span
                key={i}
                className="group/av absolute block h-10 w-10 origin-center [transform:translate(-50%,-50%)_scale(0.35)] transition-all duration-300 ease-out group-hover:[transform:translate(calc(-50%_+_var(--x)),calc(-50%_+_var(--y)))_scale(1)] group-focus-within:[transform:translate(calc(-50%_+_var(--x)),calc(-50%_+_var(--y)))_scale(1)]"
                style={
                  {
                    left: "50%",
                    top: pivotTop,
                    ["--x" as string]: `${x}px`,
                    ["--y" as string]: `${y}px`,
                    transitionDelay: `${i * 35}ms`,
                  } as React.CSSProperties
                }
              >
                <span className="block rounded-full shadow-md ring-2 ring-white transition hover:z-10 hover:scale-110 dark:ring-ink-800">
                  <Avatar name={p.full_name} src={p.avatar_url} size="md" />
                </span>
                <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-ink-900 px-1.5 py-0.5 text-[10px] font-medium text-white opacity-0 shadow transition group-hover/av:opacity-100 dark:bg-white dark:text-ink-900">
                  {p.full_name.split(" ")[0]}
                </span>
              </span>
            ))}
          </span>

          <span className="mt-1 block text-center text-xs muted">
            {going.map((p) => p.full_name.split(" ")[0]).join(", ")}
            {extra > 0 ? ` +${extra} more` : ""}
          </span>

          {wait.length > 0 && (
            <span className="mt-2 block border-t border-slate-100 pt-2 text-center text-[11px] muted dark:border-white/10">
              Waitlist: {wait.map((p) => p.full_name.split(" ")[0]).join(", ")}
            </span>
          )}
        </span>
      </span>
    </span>
  );
}
