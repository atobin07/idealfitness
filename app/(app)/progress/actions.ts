"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { benchmarkByKey, parseBenchmarkInput } from "@/lib/benchmarks";

export type ProgState = { error?: string; ok?: boolean } | undefined;

export async function addMeasurement(_prev: ProgState, formData: FormData): Promise<ProgState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const num = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v ? Number(v) : null;
  };
  const weight = num("weight_kg");
  const bf = num("body_fat_pct");
  const chest = num("chest_cm");
  const waist = num("waist_cm");
  const hips = num("hips_cm");
  const arms = num("arms_cm");
  const thighs = num("thighs_cm");

  if ([weight, bf, chest, waist, hips, arms, thighs].every((v) => v == null))
    return { error: "Enter at least one measurement." };

  const { error } = await supabase.from("client_progress").insert({
    client_id: profile.id,
    recorded_by: profile.id,
    recorded_at: String(formData.get("recorded_at") || "") || undefined,
    weight_kg: weight,
    body_fat_pct: bf,
    chest_cm: chest,
    waist_cm: waist,
    hips_cm: hips,
    arms_cm: arms,
    thighs_cm: thighs,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/progress");
  return { ok: true };
}

export async function createGoal(_prev: ProgState, formData: FormData): Promise<ProgState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Give the goal a title." };

  const num = (k: string) => {
    const v = String(formData.get(k) || "").trim();
    return v ? Number(v) : null;
  };

  const { error } = await supabase.from("goals").insert({
    client_id: profile.id,
    title,
    metric: String(formData.get("metric") || "").trim() || null,
    unit: String(formData.get("unit") || "").trim() || null,
    start_value: num("start_value"),
    target_value: num("target_value"),
    current_value: num("current_value") ?? num("start_value"),
    target_date: String(formData.get("target_date") || "") || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/progress");
  return { ok: true };
}

export async function updateGoalProgress(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const current = String(formData.get("current_value") || "").trim();
  if (!id || !current) return;
  await supabase.from("goals").update({ current_value: Number(current) }).eq("id", id);
  revalidatePath("/progress");
}

export async function setGoalStatus(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as "active" | "achieved" | "archived";
  if (!id || !status) return;
  await supabase.from("goals").update({ status }).eq("id", id);
  revalidatePath("/progress");
}

export async function deleteGoal(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("goals").delete().eq("id", id);
  revalidatePath("/progress");
}

export async function deleteMeasurement(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  // RLS also restricts this to rows the caller recorded.
  await supabase.from("client_progress").delete().eq("id", id).eq("recorded_by", profile.id);
  revalidatePath("/progress");
}

// ---- Benchmarks / PRs --------------------------------------------------
export async function logBenchmark(formData: FormData): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const key = String(formData.get("key") || "");
  const bench = benchmarkByKey(key);
  if (!bench) return;
  const value = parseBenchmarkInput(bench.kind, String(formData.get("value") || ""));
  if (value == null) return;
  const achievedOn = String(formData.get("achieved_on") || "") || undefined;
  await supabase.from("benchmark_records").insert({
    user_id: profile.id,
    key,
    value,
    achieved_on: achievedOn,
    note: String(formData.get("note") || "").trim() || null,
  });
  revalidatePath("/progress");
}

export async function deleteBenchmark(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("benchmark_records").delete().eq("id", id).eq("user_id", profile.id);
  revalidatePath("/progress");
}
