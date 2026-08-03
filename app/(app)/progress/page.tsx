import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { LineChart } from "@/components/LineChart";
import { MeasurementForm } from "@/components/MeasurementForm";
import { GoalForm } from "@/components/GoalForm";
import { deleteGoal, setGoalStatus, updateGoalProgress, deleteMeasurement } from "@/app/(app)/progress/actions";
import type { ClientProgress, Goal } from "@/lib/database.types";

function goalPct(g: Goal): number | null {
  if (g.start_value == null || g.target_value == null || g.current_value == null) return null;
  const span = g.target_value - g.start_value;
  if (span === 0) return 100;
  const done = ((g.current_value - g.start_value) / span) * 100;
  return Math.max(0, Math.min(100, Math.round(done)));
}

function GoalCard({ g, canEdit }: { g: Goal; canEdit: boolean }) {
  const pct = goalPct(g);
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-ink-900 dark:text-slate-100">{g.title}</p>
          {g.metric && <p className="text-xs muted">{g.metric}{g.unit ? ` · ${g.unit}` : ""}</p>}
        </div>
        <span className={`badge ${g.status === "achieved" ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : g.status === "archived" ? "bg-slate-100 text-slate-500 dark:bg-white/10" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"}`}>
          {g.status}
        </span>
      </div>

      {pct != null && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs muted">
            <span>{g.current_value}{g.unit ? ` ${g.unit}` : ""}</span>
            <span>Target {g.target_value}{g.unit ? ` ${g.unit}` : ""}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-right text-xs font-medium text-brand-600">{pct}%</p>
        </div>
      )}
      {g.target_date && <p className="mt-2 text-xs muted">Target date: {format(new Date(g.target_date + "T00:00:00"), "MMM d, yyyy")}</p>}

      {canEdit && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
          <form action={updateGoalProgress} className="flex items-center gap-1">
            <input type="hidden" name="id" value={g.id} />
            <input name="current_value" type="number" step="any" className="input h-8 w-24 py-1" placeholder="Update" />
            <button className="btn-secondary px-2 py-1 text-xs">Save</button>
          </form>
          {g.status !== "achieved" && (
            <form action={setGoalStatus}>
              <input type="hidden" name="id" value={g.id} />
              <input type="hidden" name="status" value="achieved" />
              <button className="btn-ghost px-2 py-1 text-xs text-brand-600">Mark achieved</button>
            </form>
          )}
          <form action={deleteGoal}>
            <input type="hidden" name="id" value={g.id} />
            <button className="btn-ghost px-2 py-1 text-xs text-slate-400 hover:text-red-500">Delete</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default async function ProgressPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";
  const today = format(new Date(), "yyyy-MM-dd");

  if (isTrainer) {
    const { data } = await supabase
      .from("goals")
      .select("*, client:client_id(full_name)")
      .eq("trainer_id", profile.id)
      .order("created_at", { ascending: false });
    const goals = (data ?? []) as any[];
    return (
      <>
        <PageHeader title="Goals" subtitle="Goals you've set with your clients. Track measurements on each client's page." />
        {goals.length === 0 ? (
          <div className="card p-10 text-center muted">No client goals yet. Add goals from a client's profile.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((g) => (
              <div key={g.id}>
                <p className="mb-1 text-xs font-medium muted">{g.client?.full_name}</p>
                <GoalCard g={g} canEdit />
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  // Client
  const [{ data: mData }, { data: gData }] = await Promise.all([
    supabase.from("client_progress").select("*").eq("client_id", profile.id).order("recorded_at", { ascending: true }),
    supabase.from("goals").select("*").eq("client_id", profile.id).order("created_at", { ascending: false }),
  ]);
  const measurements = (mData ?? []) as ClientProgress[];
  const goals = (gData ?? []) as Goal[];

  const series = (key: keyof ClientProgress) =>
    measurements
      .filter((m) => m[key] != null)
      .map((m) => ({ date: m.recorded_at, value: Number(m[key]) }));

  return (
    <>
      <PageHeader title="Progress & goals" subtitle="Track your measurements and goals over time." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Body weight</h2>
          <LineChart points={series("weight_kg")} unit="kg" />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Body fat</h2>
          <LineChart points={series("body_fat_pct")} unit="%" />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Waist</h2>
          <LineChart points={series("waist_cm")} unit="cm" />
        </div>
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Log a measurement</h2>
          <MeasurementForm today={today} />
        </div>
      </div>

      {/* Entry history — every measurement you've logged, newest first */}
      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Measurement history</h2>
        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
          {measurements.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-400">No entries yet — log your first measurement above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                    <th className="px-4 py-2.5 font-semibold">Date</th>
                    <th className="px-3 py-2.5 font-semibold">Weight</th>
                    <th className="px-3 py-2.5 font-semibold">Body fat</th>
                    <th className="px-3 py-2.5 font-semibold">Chest</th>
                    <th className="px-3 py-2.5 font-semibold">Waist</th>
                    <th className="px-3 py-2.5 font-semibold">Hips</th>
                    <th className="px-3 py-2.5 font-semibold">Arms</th>
                    <th className="px-3 py-2.5 font-semibold">Thighs</th>
                    <th className="px-3 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {[...measurements].reverse().map((m) => {
                    const cell = (v: number | null, unit: string) => (v == null ? <span className="text-slate-300 dark:text-slate-600">—</span> : `${v}${unit}`);
                    return (
                      <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 dark:border-white/5 dark:hover:bg-white/5">
                        <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-ink-900 dark:text-white">{format(new Date(m.recorded_at + (m.recorded_at.length === 10 ? "T00:00:00" : "")), "MMM d, yyyy")}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{cell(m.weight_kg, " kg")}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{cell(m.body_fat_pct, "%")}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{cell(m.chest_cm, " cm")}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{cell(m.waist_cm, " cm")}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{cell(m.hips_cm, " cm")}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{cell(m.arms_cm, " cm")}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{cell(m.thighs_cm, " cm")}</td>
                        <td className="px-3 py-2.5 text-right">
                          <form action={deleteMeasurement}>
                            <input type="hidden" name="id" value={m.id} />
                            <button className="text-xs font-medium text-slate-300 hover:text-red-500" title="Delete entry">Delete</button>
                          </form>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Goals</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => (
            <GoalCard key={g.id} g={g} canEdit />
          ))}
          <div className="flex items-center">
            <GoalForm />
          </div>
        </div>
      </div>
    </>
  );
}
