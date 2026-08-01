import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { CreateEventDialog } from "@/components/events/CreateEventDialog";
import { EventRsvpBox } from "@/components/events/EventRsvpBox";
import { deleteEvent } from "@/app/(app)/events/actions";
import { dayLabel } from "@/lib/format";
import type { RsvpStatus } from "@/lib/database.types";

type Person = { id: string; full_name: string; avatar_url: string | null };
type Rsvp = { user_id: string; status: RsvpStatus; note: string | null; user: Person | null };
type EventRow = {
  id: string; kind: string; title: string; description: string | null; location: string | null;
  image_url: string | null; starts_at: string; ends_at: string | null; created_by: string;
  creator: Person | null;
  event_rsvps: Rsvp[];
};

export default async function EventsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("events")
    .select(
      "*, creator:created_by(id, full_name, avatar_url), event_rsvps(user_id, status, note, user:user_id(id, full_name, avatar_url))"
    )
    .gte("starts_at", new Date(Date.now() - 86_400_000).toISOString())
    .order("starts_at", { ascending: true });

  const events = (data ?? []) as unknown as EventRow[];

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Gym events and get-togethers. RSVP and see who's coming."
        action={<CreateEventDialog myId={profile.id} defaultDate={format(new Date(), "yyyy-MM-dd")} />}
      />

      {events.length === 0 && (
        <div className="card p-10 text-center muted">No upcoming events yet. Post the first one!</div>
      )}

      <div className="space-y-5">
        {events.map((e) => {
          const going = e.event_rsvps.filter((r) => r.status === "going");
          const maybe = e.event_rsvps.filter((r) => r.status === "maybe");
          const cant = e.event_rsvps.filter((r) => r.status === "cant");
          const mine = e.event_rsvps.find((r) => r.user_id === profile.id) ?? null;
          const isGym = e.kind === "gym";
          const canDelete = e.created_by === profile.id || profile.is_admin;

          return (
            <div key={e.id} className="card overflow-hidden">
              {e.image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={e.image_url} alt="" className="max-h-72 w-full object-cover" />
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${isGym ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"}`}>
                        {isGym ? "🏋️ Gym event" : "🎉 Social"}
                      </span>
                      <h3 className="text-lg font-bold text-ink-900 dark:text-white">{e.title}</h3>
                    </div>
                    <p className="mt-1 text-sm muted">
                      {dayLabel(new Date(e.starts_at))} · {format(new Date(e.starts_at), "h:mm a")}
                      {e.ends_at ? `–${format(new Date(e.ends_at), "h:mm a")}` : ""}
                      {e.location ? ` · ${e.location}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs muted">Posted by {e.creator?.full_name ?? "A member"}</p>
                  </div>
                  {canDelete && (
                    <form action={deleteEvent}>
                      <input type="hidden" name="id" value={e.id} />
                      <button className="btn-ghost p-1 text-slate-400 hover:text-red-500" aria-label="Delete event">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </form>
                  )}
                </div>

                {e.description && <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900 dark:text-white">{e.description}</p>}

                {/* Counts */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">✅ {going.length} going</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">🤔 {maybe.length} maybe</span>
                  <span className="font-medium text-rose-600 dark:text-rose-400">😔 {cant.length} can&apos;t</span>
                </div>

                {/* RSVP control */}
                <div className="mt-3">
                  <EventRsvpBox eventId={e.id} myStatus={mine?.status ?? null} myNote={mine?.note ?? null} />
                </div>

                {/* Who's coming */}
                {(going.length > 0 || maybe.length > 0) && (
                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-white/10">
                    {going.length > 0 && <AttendeeRow label="Going" people={going} />}
                    {maybe.length > 0 && <AttendeeRow label="Maybe" people={maybe} />}
                  </div>
                )}

                {/* Can't-make-it responses */}
                {cant.length > 0 && (
                  <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-white/10">
                    <p className="text-xs font-semibold uppercase tracking-wide muted">Can&apos;t make it</p>
                    {cant.map((r) => (
                      <div key={r.user_id} className="flex items-start gap-2">
                        <Avatar name={r.user?.full_name || "Member"} src={r.user?.avatar_url} size="sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ink-900 dark:text-white">{r.user?.full_name || "Member"}</p>
                          {r.note && <p className="text-sm italic muted">“{r.note}”</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function AttendeeRow({ label, people }: { label: string; people: { user: Person | null; user_id: string }[] }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 shrink-0 text-xs font-semibold uppercase tracking-wide muted">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {people.map((r) => (
          <div key={r.user_id} className="flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2.5 dark:bg-white/10">
            <Avatar name={r.user?.full_name || "Member"} src={r.user?.avatar_url} size="sm" />
            <span className="text-xs font-medium text-ink-900 dark:text-white">{r.user?.full_name || "Member"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
