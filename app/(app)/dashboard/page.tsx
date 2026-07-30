import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { dayLabel, timeRange, statusBadge, statusLabel } from "@/lib/format";
import type { Profile, Session } from "@/lib/database.types";

type SessionWithPeople = Session & {
  trainer: Pick<Profile, "id" | "full_name"> | null;
  client: Pick<Profile, "id" | "full_name"> | null;
};

function Stat({ label, value, href }: { label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="card p-5 transition hover:shadow-md">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-ink-900">{value}</p>
    </Link>
  );
}

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";
  const nowIso = new Date().toISOString();

  const [{ data: upcoming }, { count: unread }, { data: announcements }] =
    await Promise.all([
      supabase
        .from("sessions")
        .select("*, trainer:trainer_id(id, full_name), client:client_id(id, full_name)")
        .gte("starts_at", nowIso)
        .eq("status", "scheduled")
        .order("starts_at", { ascending: true })
        .limit(6),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("recipient_id", profile.id)
        .is("read_at", null),
      supabase
        .from("announcements")
        .select("id, title, body, created_at")
        .order("created_at", { ascending: false })
        .limit(3),
    ]);

  const sessions = (upcoming ?? []) as SessionWithPeople[];

  let clientCount = 0;
  if (isTrainer) {
    const { count } = await supabase
      .from("trainer_clients")
      .select("id", { count: "exact", head: true })
      .eq("trainer_id", profile.id)
      .eq("status", "active");
    clientCount = count ?? 0;
  }

  const firstName = (profile.full_name || "there").split(" ")[0];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        subtitle={
          isTrainer
            ? "Here's what's happening across your roster."
            : "Here's your training at a glance."
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <Stat label="Upcoming sessions" value={sessions.length} href="/calendar" />
        <Stat label="Unread messages" value={unread ?? 0} href="/messages" />
        {isTrainer ? (
          <Stat label="Active clients" value={clientCount} href="/clients" />
        ) : (
          <Stat label="Announcements" value={announcements?.length ?? 0} href="/announcements" />
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">Upcoming sessions</h2>
            <Link href="/calendar" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              View calendar →
            </Link>
          </div>
          <div className="card divide-y divide-slate-100">
            {sessions.length === 0 && (
              <p className="p-6 text-sm text-slate-500">
                No upcoming sessions.{" "}
                <Link href="/calendar" className="font-medium text-brand-600">
                  Book one →
                </Link>
              </p>
            )}
            {sessions.map((s) => {
              const other = isTrainer ? s.client : s.trainer;
              return (
                <div key={s.id} className="flex items-center gap-4 p-4">
                  <div className="w-24 shrink-0 text-sm">
                    <p className="font-semibold text-ink-900">{dayLabel(new Date(s.starts_at))}</p>
                    <p className="text-slate-500">{timeRange(s.starts_at, s.ends_at)}</p>
                  </div>
                  <Avatar name={other?.full_name || "Open slot"} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink-900">{s.title}</p>
                    <p className="truncate text-sm text-slate-500">
                      {isTrainer ? "with " : "with "}
                      {other?.full_name || "Unassigned"}
                    </p>
                  </div>
                  <span className={`badge ${statusBadge(s.status)}`}>{statusLabel(s.status)}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-900">Announcements</h2>
            <Link href="/announcements" className="text-sm font-medium text-brand-600 hover:text-brand-700">
              All →
            </Link>
          </div>
          <div className="space-y-3">
            {(!announcements || announcements.length === 0) && (
              <div className="card p-5 text-sm text-slate-500">No announcements yet.</div>
            )}
            {announcements?.map((a) => (
              <div key={a.id} className="card p-4">
                <p className="font-semibold text-ink-900">{a.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-slate-600">{a.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
