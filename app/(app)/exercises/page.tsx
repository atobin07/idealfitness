import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PageGuide } from "@/components/PageGuide";
import { NewExerciseForm } from "@/components/NewExerciseForm";
import { deleteExercise } from "@/app/(app)/exercises/actions";
import type { Exercise } from "@/lib/database.types";

export default async function ExercisesPage() {
  const profile = await requireProfile();
  if (profile.role !== "trainer") notFound();
  const supabase = await createClient();

  const { data } = await supabase
    .from("exercises")
    .select("*")
    .order("name", { ascending: true });
  const exercises = (data ?? []) as Exercise[];

  return (
    <>
      <PageHeader title="Exercise library" subtitle="Reusable exercises for your workout programs." />
      <PageGuide
        id="exercises"
        summary="Your master list of exercises — build it once, reuse it everywhere."
        points={[
          "Add each exercise with cues, muscle groups and equipment.",
          "Pull from this library when building workout programs.",
          "Keeps every coach consistent across the gym.",
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div className="card h-fit p-6">
          <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Add an exercise</h2>
          <NewExerciseForm />
        </div>

        <div>
          <div className="mb-2 text-sm muted">{exercises.length} exercises</div>
          <div className="card divide-rows">
            {exercises.length === 0 && <p className="p-5 text-sm muted">No exercises yet.</p>}
            {exercises.map((e) => (
              <div key={e.id} className="flex items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink-900 dark:text-slate-100">{e.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-1.5">
                    {e.muscle_group && <span className="badge bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{e.muscle_group}</span>}
                    {e.category && <span className="badge bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{e.category}</span>}
                    {e.equipment && <span className="badge bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300">{e.equipment}</span>}
                  </div>
                  {e.description && <p className="mt-1 text-sm muted">{e.description}</p>}
                </div>
                {e.created_by === profile.id && (
                  <form action={deleteExercise}>
                    <input type="hidden" name="id" value={e.id} />
                    <button className="text-sm text-slate-400 hover:text-red-500" aria-label="Delete">×</button>
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
