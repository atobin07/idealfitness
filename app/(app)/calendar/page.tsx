import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { NewSessionDialog } from "@/components/NewSessionDialog";
import { SessionActions } from "@/components/SessionActions";
import { dayLabel, timeRange, statusBadge, statusLabel } from "@/lib/format";
import { format } from "date-fns";
import type { Profile, Session } from "@/lib/database.types";

type SessionWithPeople = Session & {
  trainer: Pick<Profile, "id" | "full_name"> | null;
  client: Pick<Profile, "id" | "full_name"> | null;
};

async function bookablePeople(profileId: string, role: string) {
  const supabase = await createClient();
  if (role === "trainer") {
    const { data } = await supabase
      .from("trainer_clients")
      .select("client:client_id(id, full_name)")
      .eq("trainer_id", profileId)
      .eq("status", "active");
    return (data ?? [])
      .map((r) => r.client as unknown as { id: string; full_name: string })
      .filter(Boolean);
  }
  const { data } = await supabase
    .from("trainer_clients")
    .select("trainer:trainer_id(id, full_name)")
    .eq("client_id", profileId)
    .eq("status", "active");
  return (data ?? [])
    .map((r) => r.trainer as unknown as { id: string; full_name: string })
    .filter(Boolean);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const showPast = view === "past";
  const profile = await requireProfile();
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";
  const nowIso = new Date().toISOString();

  const query = supabase
    .from("sessions")
    .select("*, trainer:trainer_id(id, full_name), client:client_id(id, full_name)");

  const { data } = showPast
    ? await query.lt("starts_at", nowIso).order("starts_at", { ascending: false }).limit(50)
    : await query.gte("starts_at", nowIso).order("starts_at", { ascending: true }).limit(50);

  const sessions = (data ?? []) as SessionWithPeople[];
  const people = await bookablePeople(profile.id, profile.role);

  // Group by calendar day.
  const groups = new Map<string, SessionWithPeople[]>();
  for (const s of sessions) {
    const key = format(new Date(s.starts_at), "yyyy-MM-dd");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Your sessions and bookings."
        action={<NewSessionDialog role={profile.role} people={people} defaultDate={todayStr} />}
      />

      <div className="mb-5 inline-flex rounded-lg border border-slate-200 bg-white p-1 text-sm dark:border-white/10 dark:bg-ink-800">
        <a
          href="/calendar"
          className={`rounded-md px-3 py-1.5 font-medium ${!showPast ? "bg-brand-600 text-white" : "text-slate-600 hover:text-ink-900 dark:text-white"}`}
        >
          Upcoming
        </a>
        <a
          href="/calendar?view=past"
          className={`rounded-md px-3 py-1.5 font-medium ${showPast ? "bg-brand-600 text-white" : "text-slate-600 hover:text-ink-900 dark:text-white"}`}
        >
          Past
        </a>
      </div>

      {sessions.length === 0 && (
        <div className="card p-10 text-center">
          <p className="text-slate-500">
            {showPast ? "No past sessions." : "No upcoming sessions yet."}
          </p>
          {!showPast && (
            <p className="mt-1 text-sm text-slate-400">
              Use “Book session” to schedule your first one.
            </p>
          )}
        </div>
      )}

      <div className="space-y-6">
        {[...groups.entries()].map(([key, items]) => (
          <div key={key}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              {dayLabel(new Date(key + "T00:00:00"))}
            </h2>
            <div className="card divide-y divide-slate-100 dark:divide-white/10">
              {items.map((s) => {
                const other = isTrainer ? s.client : s.trainer;
                return (
                  <div key={s.id} className="flex items-center gap-4 p-4">
                    <div className="w-28 shrink-0 text-sm text-slate-600">
                      {timeRange(s.starts_at, s.ends_at)}
                    </div>
                    <Avatar name={other?.full_name || "Open"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink-900 dark:text-white">{s.title}</p>
                      <p className="truncate text-sm text-slate-500">
                        with {other?.full_name || "Unassigned"}
                        {s.location ? ` · ${s.location}` : ""}
                      </p>
                    </div>
                    <span className={`badge ${statusBadge(s.status)}`}>{statusLabel(s.status)}</span>
                    <SessionActions id={s.id} status={s.status} isTrainer={isTrainer} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
