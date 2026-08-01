import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { NewClassDialog } from "@/components/NewClassDialog";
import { bookClass, cancelBooking, deleteClass, generateSchedule } from "@/app/(app)/classes/actions";
import { dayLabel, timeRange } from "@/lib/format";

type Booking = { client_id: string; status: string; client: { full_name: string } | null };
type ClassRow = {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string;
  capacity: number;
  location: string | null;
  trainer_id: string;
  trainer: { full_name: string } | null;
  class_bookings: Booking[];
};

export default async function ClassesPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";
  const canManage = isTrainer || profile.is_admin;

  const { data } = await supabase
    .from("classes")
    .select("*, trainer:trainer_id(full_name), class_bookings(client_id, status, client:client_id(full_name))")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  const classes = (data ?? []) as unknown as ClassRow[];

  return (
    <>
      <PageHeader
        title="Classes"
        subtitle={canManage ? "Create and manage group sessions." : "Book group sessions at the gym."}
        action={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <form action={generateSchedule}>
                <button className="btn-secondary">Generate 2-week schedule</button>
              </form>
              <NewClassDialog defaultDate={format(new Date(), "yyyy-MM-dd")} />
            </div>
          ) : undefined
        }
      />

      {classes.length === 0 && (
        <div className="card p-10 text-center muted">No upcoming classes.</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {classes.map((c) => {
          const booked = c.class_bookings.filter((b) => b.status === "booked");
          const waitlist = c.class_bookings.filter((b) => b.status === "waitlisted");
          const mine = c.class_bookings.find((b) => b.client_id === profile.id);
          const spotsLeft = Math.max(0, c.capacity - booked.length);
          const pct = Math.min(100, Math.round((booked.length / Math.max(1, c.capacity)) * 100));

          return (
            <div key={c.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink-900 dark:text-white">{c.title}</h3>
                  <p className="text-sm muted">
                    {dayLabel(new Date(c.starts_at))} · {timeRange(c.starts_at, c.ends_at)}
                    {c.location ? ` · ${c.location}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs muted">with {c.trainer?.full_name ?? "Coach"}</p>
                </div>
                {mine && (
                  <span className={`badge ${mine.status === "booked" ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
                    {mine.status === "booked" ? "Booked" : "Waitlisted"}
                  </span>
                )}
              </div>

              {c.description && <p className="mt-2 text-sm muted">{c.description}</p>}

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs muted">
                  <span>{booked.length}/{c.capacity} booked{waitlist.length > 0 ? ` · ${waitlist.length} waitlisted` : ""}</span>
                  <span>{spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left` : "Full"}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className={`h-full rounded-full ${spotsLeft > 0 ? "bg-brand-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                {isTrainer && c.trainer_id === profile.id ? (
                  <>
                    <div className="flex-1 truncate text-xs muted">
                      {booked.length > 0 ? booked.map((b) => b.client?.full_name).filter(Boolean).join(", ") : "No bookings yet"}
                    </div>
                    <form action={deleteClass}>
                      <input type="hidden" name="id" value={c.id} />
                      <button className="btn-danger px-3 py-1.5 text-xs">Delete</button>
                    </form>
                  </>
                ) : mine ? (
                  <form action={cancelBooking} className="w-full">
                    <input type="hidden" name="class_id" value={c.id} />
                    <button className="btn-secondary w-full">Cancel {mine.status === "waitlisted" ? "waitlist spot" : "booking"}</button>
                  </form>
                ) : (
                  <form action={bookClass} className="w-full">
                    <input type="hidden" name="class_id" value={c.id} />
                    <button className="btn-primary w-full">{spotsLeft > 0 ? "I'll be there crushing it! 💪" : "Add me to the waitlist"}</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
