import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { NewPlanDialog } from "@/components/NewPlanDialog";
import { statusLabel } from "@/lib/format";

export default async function WorkoutsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";

  if (isTrainer) {
    const { data } = await supabase
      .from("workout_plans")
      .select("*, workout_plan_items(count), workout_assignments(count)")
      .eq("trainer_id", profile.id)
      .order("created_at", { ascending: false });
    const plans = (data ?? []) as any[];

    return (
      <>
        <PageHeader title="Workout programs" subtitle="Build programs and assign them to clients." action={<NewPlanDialog />} />
        {plans.length === 0 ? (
          <div className="card p-10 text-center muted">No programs yet. Create your first one.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => (
              <Link key={p.id} href={`/workouts/${p.id}`} className="card p-5 transition hover:shadow-md">
                <h3 className="font-semibold text-ink-900 dark:text-white">{p.name}</h3>
                {p.description && <p className="mt-1 line-clamp-2 text-sm muted">{p.description}</p>}
                <div className="mt-3 flex gap-4 text-xs muted">
                  <span>{p.workout_plan_items?.[0]?.count ?? 0} exercises</span>
                  <span>{p.workout_assignments?.[0]?.count ?? 0} assigned</span>
                  <span>{p.weeks} wks</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  // Client view — assigned programs
  const { data } = await supabase
    .from("workout_assignments")
    .select("*, plan:plan_id(id, name, description, weeks), trainer:trainer_id(full_name)")
    .eq("client_id", profile.id)
    .order("created_at", { ascending: false });
  const assignments = (data ?? []) as any[];

  return (
    <>
      <PageHeader title="My workouts" subtitle="Programs your trainer assigned to you." />
      {assignments.length === 0 ? (
        <div className="card p-10 text-center muted">No workout programs assigned yet.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((a) => (
            <Link key={a.id} href={`/workouts/${a.plan?.id}`} className="card p-5 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink-900 dark:text-white">{a.plan?.name}</h3>
                <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{statusLabel(a.status)}</span>
              </div>
              {a.plan?.description && <p className="mt-1 line-clamp-2 text-sm muted">{a.plan.description}</p>}
              <p className="mt-3 text-xs muted">Coached by {a.trainer?.full_name ?? "your trainer"} · {a.plan?.weeks} weeks</p>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
