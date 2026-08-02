import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { setSessionStatus } from "@/app/(app)/calendar/actions";
import { timeRange, statusBadge, statusLabel } from "@/lib/format";

export default async function TodayPage() {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && !profile.is_admin) notFound();
  const supabase = await createClient();

  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 86_400_000);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  const [{ data: sessRaw }, { data: classRaw }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, client:client_id(id, full_name)")
      .eq("trainer_id", profile.id)
      .gte("starts_at", startIso)
      .lt("starts_at", endIso)
      .order("starts_at", { ascending: true }),
    supabase
      .from("classes")
      .select("*, class_bookings(status, client:client_id(full_name))")
      .gte("starts_at", startIso)
      .lt("starts_at", endIso)
      .order("starts_at", { ascending: true }),
  ]);

  const sessions = (sessRaw ?? []) as any[];
  const classes = (classRaw ?? []) as any[];

  const done = sessions.filter((s) => s.status === "completed").length;
  const remaining = sessions.filter((s) => s.status === "scheduled").length;

  return (
    <>
      <PageHeader
        title={`Today · ${format(now, "EEEE, MMM d")}`}
        subtitle="Run your day from one screen — check people off as they come and go."
        action={<Link href="/calendar" className="btn-secondary">Full calendar →</Link>}
      />

      {/* Quick tallies */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Tally label="Sessions" value={sessions.length} />
        <Tally label="Still to come" value={remaining} tone="text-brand-600 dark:text-brand-300" />
        <Tally label="Completed" value={done} tone="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Sessions */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08),0_24px_56px_-16px_rgba(15,23,42,0.28)] dark:bg-ink-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
          <h2 className="px-4 py-3 text-sm font-bold text-ink-900 dark:text-white">Personal training</h2>
          <div className="space-y-1 px-2 pb-2">
            {sessions.length === 0 && <p className="px-3 py-8 text-center text-sm text-slate-400">No sessions booked today.</p>}
            {sessions.map((s) => {
              const scheduled = s.status === "scheduled";
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                  <div className="w-16 shrink-0 text-xs">
                    <p className="font-bold text-ink-900 dark:text-white">{format(new Date(s.starts_at), "h:mm a")}</p>
                  </div>
                  <Avatar name={s.client?.full_name || "Open"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{s.client?.full_name || "Open slot"}</p>
                    <p className="truncate text-xs text-slate-400">{s.title} · {timeRange(s.starts_at, s.ends_at)}</p>
                  </div>
                  {scheduled ? (
                    <div className="flex shrink-0 gap-1">
                      <form action={setSessionStatus}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="status" value="completed" />
                        <button className="rounded-lg bg-emerald-500 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-600" title="Mark completed">✓ Done</button>
                      </form>
                      <form action={setSessionStatus}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="status" value="no_show" />
                        <button className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-rose-100 hover:text-rose-600 dark:bg-white/10 dark:text-slate-300" title="Mark no-show">No-show</button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`badge ${statusBadge(s.status)}`}>{statusLabel(s.status)}</span>
                      <form action={setSessionStatus}>
                        <input type="hidden" name="id" value={s.id} />
                        <input type="hidden" name="status" value="scheduled" />
                        <button className="text-xs font-medium text-slate-400 hover:text-brand-600" title="Undo">↺</button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Classes */}
        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08),0_24px_56px_-16px_rgba(15,23,42,0.28)] dark:bg-ink-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
          <h2 className="px-4 py-3 text-sm font-bold text-ink-900 dark:text-white">Group classes</h2>
          <div className="space-y-2 px-3 pb-3">
            {classes.length === 0 && <p className="px-1 py-8 text-center text-sm text-slate-400">No classes today.</p>}
            {classes.map((c) => {
              const booked = (c.class_bookings ?? []).filter((b: any) => b.status === "booked");
              return (
                <div key={c.id} className="rounded-xl bg-slate-50/70 p-3 dark:bg-white/[0.03]">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-ink-900 dark:text-white">{format(new Date(c.starts_at), "h:mm a")} · {c.title}</p>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-600 shadow-sm dark:bg-white/10 dark:text-brand-300">{booked.length}/{c.capacity}</span>
                  </div>
                  {booked.length > 0 ? (
                    <p className="mt-1 text-xs text-slate-500">{booked.map((b: any) => b.client?.full_name).filter(Boolean).join(", ")}</p>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400">No one booked yet.</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

function Tally({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 text-center shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
      <p className={`text-2xl font-extrabold ${tone ?? "text-ink-900 dark:text-white"}`}>{value}</p>
      <p className="text-xs font-medium text-slate-400">{label}</p>
    </div>
  );
}
