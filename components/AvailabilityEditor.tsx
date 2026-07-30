import { createClient } from "@/lib/supabase/server";
import { WEEKDAYS } from "@/lib/format";
import { addAvailability, removeAvailability } from "@/app/(app)/settings/actions";
import type { Availability } from "@/lib/database.types";

function hm(t: string) {
  // "06:00:00" -> "6:00 AM"
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ampm}`;
}

export async function AvailabilityEditor({ trainerId }: { trainerId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("availability")
    .select("*")
    .eq("trainer_id", trainerId)
    .order("weekday")
    .order("start_time");
  const slots = (data ?? []) as Availability[];

  return (
    <div className="card p-6">
      <h2 className="font-semibold text-ink-900 dark:text-white">Weekly availability</h2>
      <p className="mb-4 text-sm muted">When clients can book you. Shown on your booking screens.</p>

      <div className="space-y-2">
        {WEEKDAYS.map((day, i) => {
          const daySlots = slots.filter((s) => s.weekday === i);
          if (daySlots.length === 0) return null;
          return (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <span className="w-24 text-sm font-medium">{day}</span>
              {daySlots.map((s) => (
                <span key={s.id} className="badge gap-1 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                  {hm(s.start_time)}–{hm(s.end_time)}
                  <form action={removeAvailability} className="inline">
                    <input type="hidden" name="id" value={s.id} />
                    <button className="ml-1 text-brand-400 hover:text-red-500" aria-label="Remove">×</button>
                  </form>
                </span>
              ))}
            </div>
          );
        })}
        {slots.length === 0 && <p className="text-sm muted">No availability set yet.</p>}
      </div>

      <form action={addAvailability} className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4 dark:border-white/10">
        <div>
          <label className="label" htmlFor="weekday">Day</label>
          <select id="weekday" name="weekday" className="input" defaultValue="1">
            {WEEKDAYS.map((d, i) => (
              <option key={i} value={i}>{d}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="start_time">From</label>
          <input id="start_time" name="start_time" type="time" className="input" defaultValue="06:00" step={900} />
        </div>
        <div>
          <label className="label" htmlFor="end_time">To</label>
          <input id="end_time" name="end_time" type="time" className="input" defaultValue="12:00" step={900} />
        </div>
        <button className="btn-secondary">Add slot</button>
      </form>
    </div>
  );
}
