import Link from "next/link";
import { addDays, format, startOfWeek } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { WeekCalendar, type CalClass, type CalSession } from "@/components/WeekCalendar";
import { dayLabel, timeRange, statusBadge, statusLabel } from "@/lib/format";
import type { Profile, Session } from "@/lib/database.types";

type SessionWithPeople = Session & {
  trainer: Pick<Profile, "id" | "full_name"> | null;
  client: Pick<Profile, "id" | "full_name"> | null;
};

async function bookablePeople(profileId: string, role: string) {
  const supabase = await createClient();
  const sel = role === "trainer" ? "client:client_id(id, full_name)" : "trainer:trainer_id(id, full_name)";
  const col = role === "trainer" ? "trainer_id" : "client_id";
  const { data } = await supabase.from("trainer_clients").select(sel).eq(col, profileId).eq("status", "active");
  return (data ?? [])
    .map((r) => (role === "trainer" ? (r as any).client : (r as any).trainer) as { id: string; full_name: string })
    .filter(Boolean);
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const { view: viewParam, date: dateParam } = await searchParams;
  const view = viewParam === "day" || viewParam === "list" ? viewParam : "week";
  const profile = await requireProfile();
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";

  const anchor = dateParam ? new Date(dateParam + "T00:00:00") : new Date();

  // ------- LIST (agenda) view -------
  if (view === "list") {
    const { data } = await supabase
      .from("sessions")
      .select("*, trainer:trainer_id(id, full_name), client:client_id(id, full_name)")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(60);
    const sessions = (data ?? []) as SessionWithPeople[];
    const groups = new Map<string, SessionWithPeople[]>();
    for (const s of sessions) {
      const key = format(new Date(s.starts_at), "yyyy-MM-dd");
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }
    return (
      <>
        <CalendarHeader view="list" anchor={anchor} />
        {sessions.length === 0 && <div className="card p-10 text-center muted">No upcoming appointments.</div>}
        <div className="space-y-6">
          {[...groups.entries()].map(([key, items]) => (
            <div key={key}>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">{dayLabel(new Date(key + "T00:00:00"))}</h2>
              <div className="card divide-rows">
                {items.map((s) => {
                  const other = isTrainer ? s.client : s.trainer;
                  return (
                    <div key={s.id} className="flex items-center gap-4 p-4">
                      <div className="w-28 shrink-0 text-sm muted">{timeRange(s.starts_at, s.ends_at)}</div>
                      <Avatar name={other?.full_name || "Open"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-ink-900 dark:text-white">{s.title}</p>
                        <p className="truncate text-sm muted">with {other?.full_name || "Unassigned"}{s.location ? ` · ${s.location}` : ""}</p>
                      </div>
                      <span className={`badge ${statusBadge(s.status)}`}>{statusLabel(s.status)}</span>
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

  // ------- WEEK / DAY grid -------
  const isDay = view === "day";
  const start = isDay ? anchor : startOfWeek(anchor, { weekStartsOn: 0 });
  const dayCount = isDay ? 1 : 7;
  const days = Array.from({ length: dayCount }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
  const rangeStart = addDays(start, -1).toISOString();
  const rangeEnd = addDays(start, dayCount + 1).toISOString();

  const [{ data: sessData }, { data: classData }] = await Promise.all([
    supabase
      .from("sessions")
      .select("*, trainer:trainer_id(id, full_name), client:client_id(id, full_name)")
      .gte("starts_at", rangeStart)
      .lt("starts_at", rangeEnd)
      .order("starts_at", { ascending: true }),
    supabase
      .from("classes")
      .select("*, class_bookings(client_id, status)")
      .gte("starts_at", rangeStart)
      .lt("starts_at", rangeEnd)
      .order("starts_at", { ascending: true }),
  ]);

  const sessions: CalSession[] = ((sessData ?? []) as SessionWithPeople[]).map((s) => ({
    id: s.id,
    title: s.title,
    starts_at: s.starts_at,
    ends_at: s.ends_at,
    status: s.status,
    location: s.location,
    trainer_id: s.trainer_id,
    client_id: s.client_id,
    otherName: (isTrainer ? s.client?.full_name : s.trainer?.full_name) || "Unassigned",
  }));

  const classes: CalClass[] = ((classData ?? []) as any[]).map((c) => {
    const bookings = (c.class_bookings ?? []) as { client_id: string; status: string }[];
    const mine = bookings.find((b) => b.client_id === profile.id);
    return {
      id: c.id,
      title: c.title,
      starts_at: c.starts_at,
      ends_at: c.ends_at,
      capacity: c.capacity,
      location: c.location,
      booked: bookings.filter((b) => b.status === "booked").length,
      waitlisted: bookings.filter((b) => b.status === "waitlisted").length,
      myStatus: (mine?.status as "booked" | "waitlisted") ?? null,
    };
  });

  const people = await bookablePeople(profile.id, profile.role);

  return (
    <>
      <CalendarHeader view={view} anchor={anchor} />
      <WeekCalendar days={days} sessions={sessions} classes={classes} role={profile.role} people={people} myId={profile.id} />
    </>
  );
}

function CalendarHeader({ view, anchor }: { view: string; anchor: Date }) {
  const isDay = view === "day";
  const weekStart = startOfWeek(anchor, { weekStartsOn: 0 });
  const title =
    view === "list"
      ? "Upcoming"
      : isDay
      ? format(anchor, "EEEE, MMMM d, yyyy")
      : `${format(weekStart, "MMM d")} – ${format(addDays(weekStart, 6), "MMM d, yyyy")}`;

  const step = isDay ? 1 : 7;
  const base = isDay ? anchor : weekStart;
  const prev = format(addDays(base, -step), "yyyy-MM-dd");
  const next = format(addDays(base, step), "yyyy-MM-dd");
  const today = format(new Date(), "yyyy-MM-dd");

  const tab = (v: string, label: string) => (
    <Link
      href={`/calendar?view=${v}`}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === v ? "bg-brand-600 text-white" : "text-slate-600 hover:text-ink-900 dark:text-slate-300"}`}
    >
      {label}
    </Link>
  );

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold tracking-tight text-ink-900 dark:text-white">{title}</h1>
        {view !== "list" && (
          <div className="flex items-center gap-1">
            <Link href={`/calendar?view=${view}&date=${prev}`} className="btn-ghost px-2 py-1" aria-label="Previous">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Link>
            <Link href={`/calendar?view=${view}&date=${today}`} className="btn-secondary px-3 py-1 text-xs">Today</Link>
            <Link href={`/calendar?view=${view}&date=${next}`} className="btn-ghost px-2 py-1" aria-label="Next">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        )}
      </div>
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-ink-800">
        {tab("day", "Day")}
        {tab("week", "Week")}
        {tab("list", "List")}
      </div>
    </div>
  );
}
