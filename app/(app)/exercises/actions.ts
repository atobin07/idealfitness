"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type ExState = { error?: string; ok?: boolean } | undefined;

export async function createExercise(_prev: ExState, formData: FormData): Promise<ExState> {
  const profile = await requireProfile();
  if (profile.role !== "trainer") return { error: "Only trainers can add exercises." };
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Add an exercise name." };

  const { error } = await supabase.from("exercises").insert({
    created_by: profile.id,
    name,
    category: String(formData.get("category") || "").trim() || null,
    muscle_group: String(formData.get("muscle_group") || "").trim() || null,
    equipment: String(formData.get("equipment") || "").trim() || null,
    description: String(formData.get("description") || "").trim() || null,
    video_url: String(formData.get("video_url") || "").trim() || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/exercises");
  return { ok: true };
}

export async function deleteExercise(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("exercises").delete().eq("id", id).eq("created_by", profile.id);
  revalidatePath("/exercises");
}
