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
