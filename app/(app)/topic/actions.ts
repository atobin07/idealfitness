"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile, requireAdmin } from "@/lib/auth";

export type TopicState = { error?: string; ok?: boolean } | undefined;

export async function postResponse(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const discussionId = String(formData.get("discussion_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!discussionId || !body) return;
  await supabase.from("discussion_responses").insert({ discussion_id: discussionId, user_id: profile.id, body });
  revalidatePath("/topic");
  revalidatePath("/dashboard");
}

export async function deleteResponse(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const q = supabase.from("discussion_responses").delete().eq("id", id);
  if (!profile.is_admin) q.eq("user_id", profile.id);
  await q;
  revalidatePath("/topic");
  revalidatePath("/dashboard");
}

export async function toggleResponseLike(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const responseId = String(formData.get("response_id") || "");
  if (!responseId) return;
  const { data: existing } = await supabase
    .from("discussion_response_likes")
    .select("id")
    .eq("response_id", responseId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (existing) await supabase.from("discussion_response_likes").delete().eq("id", existing.id);
  else await supabase.from("discussion_response_likes").insert({ response_id: responseId, user_id: profile.id });
  revalidatePath("/topic");
  revalidatePath("/dashboard");
}

export async function createDiscussion(_prev: TopicState, formData: FormData): Promise<TopicState> {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const prompt = String(formData.get("prompt") || "").trim();
  if (!prompt) return { error: "Give the topic a question or prompt." };
  const details = String(formData.get("details") || "").trim() || null;
  const { error } = await supabase.from("discussions").insert({ prompt, details, created_by: profile.id, status: "active" });
  if (error) return { error: error.message };
  revalidatePath("/topic");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function concludeDiscussion(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const conclusion = String(formData.get("conclusion") || "").trim();
  if (!id || !conclusion) return;
  await supabase
    .from("discussions")
    .update({ status: "archived", conclusion, archived_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/topic");
  revalidatePath("/dashboard");
}
