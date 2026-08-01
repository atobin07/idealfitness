"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type FeedbackState = { error?: string; ok?: boolean } | undefined;

export async function submitFeedback(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const audience = String(formData.get("audience") || "");
  if (!["owner", "trainer", "staff"].includes(audience)) return { error: "Choose who this is for." };
  const trainerId = String(formData.get("trainer_id") || "") || null;
  if (audience === "trainer" && !trainerId) return { error: "Pick which trainer this is for." };
  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Add your feedback." };
  const category = String(formData.get("category") || "").trim() || null;
  const anonymous = formData.get("anonymous") === "on";

  const { error } = await supabase.from("feedback").insert({
    from_user_id: anonymous ? null : profile.id,
    is_anonymous: anonymous,
    audience,
    trainer_id: audience === "trainer" ? trainerId : null,
    category,
    body,
  });
  if (error) return { error: error.message };

  revalidatePath("/feedback");
  return { ok: true };
}

export async function setFeedbackStatus(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["new", "read", "resolved"].includes(status)) return;
  await supabase.from("feedback").update({ status }).eq("id", id);
  revalidatePath("/feedback");
}
