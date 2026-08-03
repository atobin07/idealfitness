"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type ContestState = { error?: string; ok?: boolean } | undefined;

export async function createContest(_prev: ContestState, formData: FormData): Promise<ContestState> {
  const profile = await requireProfile();
  if (!profile.is_admin) return { error: "Only admins can start a contest." };
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const prize = String(formData.get("prize") || "").trim() || null;
  const starts_at = String(formData.get("starts_at") || "") || null;
  const ends_at = String(formData.get("ends_at") || "") || null;
  if (!title) return { error: "Give the contest a name." };

  const { error } = await supabase.from("contests").insert({
    title,
    description,
    prize,
    starts_at,
    ends_at,
    created_by: profile.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/contests");
  return { ok: true };
}

export async function joinContest(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const contestId = String(formData.get("contest_id") || "");
  if (!contestId) return;
  await supabase.from("contest_entries").upsert(
    { contest_id: contestId, user_id: profile.id },
    { onConflict: "contest_id,user_id" }
  );
  revalidatePath("/contests");
}

export async function leaveContest(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const contestId = String(formData.get("contest_id") || "");
  if (!contestId) return;
  await supabase.from("contest_entries").delete().eq("contest_id", contestId).eq("user_id", profile.id);
  revalidatePath("/contests");
}

export async function setContestStatus(formData: FormData) {
  const profile = await requireProfile();
  if (!profile.is_admin) return;
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["active", "ended"].includes(status)) return;
  await supabase.from("contests").update({ status }).eq("id", id);
  revalidatePath("/contests");
}

export async function deleteContest(formData: FormData) {
  const profile = await requireProfile();
  if (!profile.is_admin) return;
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("contests").delete().eq("id", id);
  revalidatePath("/contests");
}
