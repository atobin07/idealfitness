import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { MessagesOverview } from "@/components/hub/MessagesOverview";
import { MembersOverview } from "@/components/hub/MembersOverview";
import { dayLabel, timeRange, statusBadge, statusLabel } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import type { Profile, Session } from "@/lib/database.types";

type SessionWithPeople = Session & {
  trainer: Pick<Profile, "id" | "full_name"> | null;
  client: Pick<Profile, "id" | "full_name"> | null;
};

function Stat({ label, value, href }: { label: string; value: string | number; href: string; tone?: string }) {
  return (
    <Link href={href} className="card-brand p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-600/30">
      <p className="text-sm text-white/75">{label}</p>
      <p className="stat-value mt-1">{value}</p>
    </Link>
  );
}

/** The "everything else" tab: your numbers, sessions, messages, members, news. */
export async function OverviewSection({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";
  const nowIso = new Date().toISOString();

  const [{ data: upcoming }, { count: unread }, { data: announcements }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, trainer:trainer_id(id, full_name), client:client_id(id, full_name)")
      .gte("starts_at", nowIso)
      .eq("status", "scheduled")
      .order("starts_at", { ascending: true })
      .limit(6),
    supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", profile.id).is("read_at", null),
    supabase.from("announcements").select("id, title, body, created_at").order("created_at", { ascending: false }).limit(3),
  ]);

  const sessions = (upcoming ?? []) as SessionWithPeople[];

  let stats: React.ReactNode;
  if (isTrainer) {
    const [{ count: clients }, { data: invoices }, { count: due }] = await Promise.all([
      supabase.from("trainer_clients").select("id", { count: "exact", head: true }).eq("trainer_id", profile.id).eq("status", "active"),
      supabase.from("invoices").select("amount_cents, status").eq("trainer_id", profile.id).eq("status", "paid"),
      supabase.from("invoices").select("id", { count: "exact", head: true }).eq("trainer_id", profile.id).eq("status", "due"),
    ]);
    const revenue = (invoices ?? []).reduce((s, i) => s + i.amount_cents, 0);
    stats = (
      <>
        <Stat label="Active clients" value={clients ?? 0} href="/clients" />
        <Stat label="Revenue (paid)" value={formatMoney(revenue)} href="/analytics" tone="text-brand-600 dark:text-brand-400" />
        <Stat label="Upcoming sessions" value={sessions.length} href="/calendar" />
        <Stat label="Invoices due" value={due ?? 0} href="/billing" />
      </>
    );
  } else {
    const [{ data: credits }, { count: programs }] = await Promise.all([
      supabase.from("client_packages").select("sessions_total, sessions_used").eq("client_id", profile.id).eq("status", "active"),
      supabase.from("workout_assignments").select("id", { count: "exact", head: true }).eq("client_id", profile.id).eq("status", "active"),
    ]);
    const remaining = (credits ?? []).reduce((s, c) => s + (c.sessions_total - c.sessions_used), 0);
    stats = (
      <>
        <Stat label="Upcoming sessions" value={sessions.length} href="/calendar" />
        <Stat label="Session credits" value={remaining} href="/billing" tone="text-brand-600 dark:text-brand-400" />
        <Stat label="Active programs" value={programs ?? 0} href="/workouts" />
        <Stat label="Unread messages" value={unread ?? 0} href="/messages" />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{stats}</div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Upcoming sessions</h2>
              <Link href="/calendar" className="text-sm font-medium text-brand-600 hover:text-brand-700">View calendar →</Link>
            </div>
            <div className="card divide-rows">
              {sessions.length === 0 && (
                <p className="p-6 text-sm muted">
                  No upcoming sessions. <Link href="/calendar" className="font-medium text-brand-600">Book one →</Link>
                </p>
              )}
              {sessions.map((s) => {
                const other = isTrainer ? s.client : s.trainer;
                return (
                  <div key={s.id} className="flex items-center gap-4 p-4">
                    <div className="w-24 shrink-0 text-sm">
                      <p className="font-semibold text-ink-900 dark:text-white">{dayLabel(new Date(s.starts_at))}</p>
                      <p className="muted">{timeRange(s.starts_at, s.ends_at)}</p>
                    </div>
                    <Avatar name={other?.full_name || "Open slot"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-900 dark:text-white">{s.title}</p>
                      <p className="truncate text-sm muted">with {other?.full_name || "Unassigned"}</p>
                    </div>
                    <span className={`badge ${statusBadge(s.status)}`}>{statusLabel(s.status)}</span>
                  </div>
                );
              })}
            </div>
          </section>

          <MessagesOverview profile={profile} />
        </div>

        <section className="space-y-6">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Announcements</h2>
              <Link href="/announcements" className="text-sm font-medium text-brand-600 hover:text-brand-700">All →</Link>
            </div>
            <div className="space-y-3">
              {(!announcements || announcements.length === 0) && (
                <div className="card p-5 text-sm muted">No announcements yet.</div>
              )}
              {announcements?.map((a) => (
                <div key={a.id} className="card p-4">
                  <p className="font-semibold text-ink-900 dark:text-white">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm muted">{a.body}</p>
                </div>
              ))}
            </div>
          </div>

          <MembersOverview />
        </section>
      </div>
    </>
  );
}
