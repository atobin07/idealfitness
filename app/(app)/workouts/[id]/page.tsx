import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import {
  addPlanItem,
  assignPlan,
  deletePlan,
  logWorkout,
  removePlanItem,
  unassignPlan,
} from "@/app/(app)/workouts/actions";
import type { Exercise, WorkoutPlanItem } from "@/lib/database.types";

export default async function WorkoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: plan } = await supabase.from("workout_plans").select("*").eq("id", id).maybeSingle();
  if (!plan) notFound();

  const isOwner = plan.trainer_id === profile.id;

  const { data: itemData } = await supabase
    .from("workout_plan_items")
    .select("*")
    .eq("plan_id", id)
    .order("day_label")
    .order("position");
  const items = (itemData ?? []) as WorkoutPlanItem[];

  // Group by day
  const days = new Map<string, WorkoutPlanItem[]>();
  for (const it of items) {
    if (!days.has(it.day_label)) days.set(it.day_label, []);
    days.get(it.day_label)!.push(it);
  }

  const today = format(new Date(), "yyyy-MM-dd");

  if (isOwner) {
    const [{ data: exData }, { data: assignData }, { data: clientData }] = await Promise.all([
      supabase.from("exercises").select("id, name").order("name"),
      supabase
        .from("workout_assignments")
        .select("id, client:client_id(id, full_name)")
        .eq("plan_id", id),
      supabase
        .from("trainer_clients")
        .select("client:client_id(id, full_name)")
        .eq("trainer_id", profile.id)
        .eq("status", "active"),
    ]);
    const exercises = (exData ?? []) as Pick<Exercise, "id" | "name">[];
    const assignments = (assignData ?? []) as any[];
    const clients = (clientData ?? []).map((r) => r.client as unknown as { id: string; full_name: string }).filter(Boolean);
    const assignedIds = new Set(assignments.map((a) => a.client?.id));

    return (
      <>
        <Link href="/workouts" className="mb-4 inline-block text-sm muted hover:underline">← All programs</Link>
        <PageHeader
          title={plan.name}
          subtitle={plan.description ?? `${plan.weeks}-week program`}
          action={
            <form action={deletePlan}>
              <input type="hidden" name="id" value={plan.id} />
              <button className="btn-danger">Delete program</button>
            </form>
          }
        />

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            {[...days.entries()].map(([day, list]) => (
              <div key={day}>
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">{day}</h3>
                <div className="card divide-rows">
                  {list.map((it) => (
                    <div key={it.id} className="flex items-center gap-3 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink-900 dark:text-slate-100">{it.exercise_name}</p>
                        <p className="text-xs muted">
                          {[it.sets && `${it.sets} sets`, it.reps && `${it.reps} reps`, it.rest_seconds && `${it.rest_seconds}s rest`]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                          {it.notes ? ` · ${it.notes}` : ""}
                        </p>
                      </div>
                      <form action={removePlanItem}>
                        <input type="hidden" name="id" value={it.id} />
                        <input type="hidden" name="plan_id" value={plan.id} />
                        <button className="text-slate-400 hover:text-red-500" aria-label="Remove">×</button>
                      </form>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {items.length === 0 && <div className="card p-8 text-center muted">No exercises yet — add some →</div>}

            <div className="card p-5">
              <h3 className="mb-3 font-semibold text-ink-900 dark:text-white">Add exercise</h3>
              <form action={addPlanItem} className="space-y-3">
                <input type="hidden" name="plan_id" value={plan.id} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="day_label">Day</label>
                    <input id="day_label" name="day_label" className="input" placeholder="Day 1 · Lower" defaultValue="Day 1" />
                  </div>
                  <div>
                    <label className="label" htmlFor="exercise_id">From library</label>
                    <select id="exercise_id" name="exercise_id" className="input" defaultValue="">
                      <option value="">— pick or type below —</option>
                      {exercises.map((e) => (
                        <option key={e.id} value={e.id}>{e.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <input name="exercise_name" className="input" placeholder="…or type a custom exercise name" />
                <div className="grid grid-cols-3 gap-3">
                  <input name="sets" type="number" min={1} className="input" placeholder="Sets" />
                  <input name="reps" className="input" placeholder="Reps (e.g. 5 or 8-12)" />
                  <input name="rest_seconds" type="number" className="input" placeholder="Rest (s)" />
                </div>
                <input name="notes" className="input" placeholder="Notes / tempo cues" />
                <button className="btn-primary">Add to program</button>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="mb-3 font-semibold text-ink-900 dark:text-white">Assign to clients</h3>
              <form action={assignPlan} className="flex gap-2">
                <input type="hidden" name="plan_id" value={plan.id} />
                <select name="client_id" required className="input" defaultValue="">
                  <option value="" disabled>Select a client…</option>
                  {clients.filter((c) => !assignedIds.has(c.id)).map((c) => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
                <button className="btn-primary whitespace-nowrap">Assign</button>
              </form>
              <div className="mt-4 space-y-2">
                {assignments.length === 0 && <p className="text-sm muted">Not assigned to anyone yet.</p>}
                {assignments.map((a) => (
                  <div key={a.id} className="flex items-center gap-2">
                    <Avatar name={a.client?.full_name ?? "?"} size="sm" />
                    <span className="flex-1 text-sm">{a.client?.full_name}</span>
                    <form action={unassignPlan}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="plan_id" value={plan.id} />
                      <button className="text-xs text-slate-400 hover:text-red-500">Remove</button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Client view — must be assigned
  const { data: assignment } = await supabase
    .from("workout_assignments")
    .select("*")
    .eq("plan_id", id)
    .eq("client_id", profile.id)
    .maybeSingle();
  if (!assignment) notFound();

  const { data: logData } = await supabase
    .from("workout_logs")
    .select("*")
    .eq("assignment_id", assignment.id)
    .order("performed_on", { ascending: false })
    .limit(10);
  const logs = (logData ?? []) as any[];

  return (
    <>
      <Link href="/workouts" className="mb-4 inline-block text-sm muted hover:underline">← My workouts</Link>
      <PageHeader title={plan.name} subtitle={plan.description ?? `${plan.weeks}-week program`} />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          {[...days.entries()].map(([day, list]) => (
            <div key={day}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">{day}</h3>
              <div className="card divide-rows">
                {list.map((it) => (
                  <div key={it.id} className="p-4">
                    <p className="font-medium text-ink-900 dark:text-slate-100">{it.exercise_name}</p>
                    <p className="text-xs muted">
                      {[it.sets && `${it.sets} sets`, it.reps && `${it.reps} reps`, it.rest_seconds && `${it.rest_seconds}s rest`]
                        .filter(Boolean).join(" · ") || "—"}
                      {it.notes ? ` · ${it.notes}` : ""}
                    </p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium text-brand-600">Log this exercise</summary>
                      <form action={logWorkout} className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <input type="hidden" name="assignment_id" value={assignment.id} />
                        <input type="hidden" name="plan_item_id" value={it.id} />
                        <input type="hidden" name="plan_id" value={plan.id} />
                        <input type="hidden" name="performed_on" value={today} />
                        <input name="sets_done" type="number" className="input" placeholder="Sets" />
                        <input name="reps_done" className="input" placeholder="Reps" />
                        <input name="weight_kg" type="number" step="0.5" className="input" placeholder="kg" />
                        <button className="btn-primary">Log</button>
                      </form>
                    </details>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="card p-8 text-center muted">Your trainer hasn't added exercises yet.</div>}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">Recent logs</h3>
          <div className="card divide-rows">
            {logs.length === 0 && <p className="p-5 text-sm muted">No logs yet. Complete an exercise to track it.</p>}
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between p-3 text-sm">
                <span className="muted">{format(new Date(l.performed_on + "T00:00:00"), "MMM d")}</span>
                <span className="text-ink-900 dark:text-slate-100">
                  {[l.sets_done && `${l.sets_done}×`, l.reps_done, l.weight_kg && `${l.weight_kg}kg`].filter(Boolean).join(" ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
