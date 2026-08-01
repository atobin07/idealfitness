import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { NewClassDialog } from "@/components/NewClassDialog";
import { ClassRoster } from "@/components/ClassRoster";
import { ClassJoinButton } from "@/components/ClassJoinButton";
import { deleteClass, generateSchedule } from "@/app/(app)/classes/actions";
import { dayLabel, timeRange } from "@/lib/format";
import { HYPE, randomOf } from "@/lib/hype";

type Booking = { client_id: string; status: string; client: { full_name: string; avatar_url: string | null } | null };
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
    .select("*, trainer:trainer_id(full_name), class_bookings(client_id, status, client:client_id(full_name, avatar_url))")
    .gte("ends_at", new Date().toISOString())
    .order("starts_at", { ascending: true });

  const classes = (data ?? []) as unknown as ClassRow[];

  return (
    <>
      <PageHeader
        title="Classes"
        subtitle={canManage ? "Create and manage group classes." : "Come get a great workout in with the crew."}
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
          const myStatus = mine && (mine.status === "booked" || mine.status === "waitlisted") ? mine.status : null;
          const spotsLeft = Math.max(0, c.capacity - booked.length);
          const full = spotsLeft <= 0;
          const pct = Math.min(100, Math.round((booked.length / Math.max(1, c.capacity)) * 100));
          const encouragement =
            myStatus === "waitlisted" ? "You're on the waitlist"
            : myStatus ? "✓ You're in the group"
            : full ? "Group full · join the waitlist"
            : `${spotsLeft} ${spotsLeft === 1 ? "spot" : "spots"} left`;

          return (
            <div key={c.id} className="card-brand flex flex-col p-5">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-white">{c.title}</h3>
                <p className="text-sm text-white/75">
                  {dayLabel(new Date(c.starts_at))} · {timeRange(c.starts_at, c.ends_at)}
                  {c.location ? ` · ${c.location}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-white/60">with {c.trainer?.full_name ?? "Coach"}</p>
              </div>

              {c.description && <p className="mt-2 text-sm text-white/85">{c.description}</p>}

              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <ClassRoster onBrand booked={booked.map((b) => b.client)} waitlisted={waitlist.map((b) => b.client)} />
                  <span className="text-right text-xs font-medium text-white/85">{encouragement}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/25">
                  <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {isTrainer && c.trainer_id === profile.id ? (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 truncate text-xs text-white/80">
                    {booked.length > 0 ? booked.map((b) => b.client?.full_name).filter(Boolean).join(", ") : "No one's in yet"}
                  </div>
                  <form action={deleteClass}>
                    <input type="hidden" name="id" value={c.id} />
                    <button className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/25 hover:bg-white/25">Delete</button>
                  </form>
                </div>
              ) : (
                <ClassJoinButton classId={c.id} status={myStatus} full={full} initialPhrase={randomOf(HYPE)} />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
