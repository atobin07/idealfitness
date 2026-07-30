"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type ProfileState = { error?: string; ok?: boolean } | undefined;

export async function updateProfile(
  _prev: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const full_name = String(formData.get("full_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const bio = String(formData.get("bio") || "").trim();
  const goals = String(formData.get("goals") || "").trim();

  if (!full_name) return { error: "Name can't be empty." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      phone: phone || null,
      bio: bio || null,
      goals: goals || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function addAvailability(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "trainer") return;
  const supabase = await createClient();
  const weekday = parseInt(String(formData.get("weekday") || "1"), 10);
  const start_time = String(formData.get("start_time") || "");
  const end_time = String(formData.get("end_time") || "");
  if (!start_time || !end_time || end_time <= start_time) return;
  await supabase.from("availability").insert({
    trainer_id: profile.id,
    weekday,
    start_time,
    end_time,
  });
  revalidatePath("/settings");
}

export async function removeAvailability(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("availability").delete().eq("id", id).eq("trainer_id", profile.id);
  revalidatePath("/settings");
}
