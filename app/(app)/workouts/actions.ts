"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type PlanState = { error?: string; ok?: boolean } | undefined;

export async function createPlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  const profile = await requireProfile();
  if (profile.role !== "trainer") return { error: "Only trainers can create programs." };
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Give the program a name." };

  const { data, error } = await supabase
    .from("workout_plans")
    .insert({
      trainer_id: profile.id,
      name,
      description: String(formData.get("description") || "").trim() || null,
      weeks: parseInt(String(formData.get("weeks") || "4"), 10),
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  revalidatePath("/workouts");
  redirect(`/workouts/${data.id}`);
}

export async function deletePlan(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("workout_plans").delete().eq("id", id).eq("trainer_id", profile.id);
  redirect("/workouts");
}

export async function addPlanItem(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const plan_id = String(formData.get("plan_id") || "");
  const exercise_id = String(formData.get("exercise_id") || "") || null;
  let exercise_name = String(formData.get("exercise_name") || "").trim();
  if (!plan_id) return;

  // Resolve name from the library if an exercise was picked.
  if (exercise_id && !exercise_name) {
    const { data: ex } = await supabase.from("exercises").select("name").eq("id", exercise_id).single();
    exercise_name = ex?.name ?? "Exercise";
  }
  if (!exercise_name) return;

  const { count } = await supabase
    .from("workout_plan_items")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", plan_id);

  await supabase.from("workout_plan_items").insert({
    plan_id,
    day_label: String(formData.get("day_label") || "Day 1").trim() || "Day 1",
    exercise_id,
    exercise_name,
    position: count ?? 0,
    sets: formData.get("sets") ? parseInt(String(formData.get("sets")), 10) : null,
    reps: String(formData.get("reps") || "").trim() || null,
    rest_seconds: formData.get("rest_seconds") ? parseInt(String(formData.get("rest_seconds")), 10) : null,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath(`/workouts/${plan_id}`);
}

export async function removePlanItem(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const plan_id = String(formData.get("plan_id") || "");
  if (!id) return;
  await supabase.from("workout_plan_items").delete().eq("id", id);
  revalidatePath(`/workouts/${plan_id}`);
}

export async function assignPlan(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const plan_id = String(formData.get("plan_id") || "");
  const client_id = String(formData.get("client_id") || "");
  if (!plan_id || !client_id) return;
  await supabase.from("workout_assignments").insert({
    plan_id,
    trainer_id: profile.id,
    client_id,
  });
  revalidatePath(`/workouts/${plan_id}`);
}

export async function unassignPlan(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const plan_id = String(formData.get("plan_id") || "");
  if (!id) return;
  await supabase.from("workout_assignments").delete().eq("id", id);
  revalidatePath(`/workouts/${plan_id}`);
}

export async function logWorkout(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const assignment_id = String(formData.get("assignment_id") || "");
  const plan_item_id = String(formData.get("plan_item_id") || "") || null;
  if (!assignment_id) return;

  await supabase.from("workout_logs").insert({
    assignment_id,
    plan_item_id,
    client_id: profile.id,
    performed_on: String(formData.get("performed_on") || "") || undefined,
    sets_done: formData.get("sets_done") ? parseInt(String(formData.get("sets_done")), 10) : null,
    reps_done: String(formData.get("reps_done") || "").trim() || null,
    weight_kg: formData.get("weight_kg") ? Number(formData.get("weight_kg")) : null,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath(`/workouts/${String(formData.get("plan_id") || "")}`);
  revalidatePath("/workouts");
}
