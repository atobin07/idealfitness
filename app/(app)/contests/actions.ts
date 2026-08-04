"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type ContestState = { error?: string; ok?: boolean } | undefined;

const CHEER_KINDS = ["congrats", "fistbump", "cheer"];

function revalidateContests() {
  revalidatePath("/contests");
  revalidatePath("/contests/[id]", "page");
}

export async function createContest(_prev: ContestState, formData: FormData): Promise<ContestState> {
  const profile = await requireProfile();
  if (!profile.is_admin) return { error: "Only admins can start a contest." };
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Give the contest a name." };
  const scoring = String(formData.get("scoring") || "high") === "low" ? "low" : "high";

  const { data, error } = await supabase
    .from("contests")
    .insert({
      title,
      description: String(formData.get("description") || "").trim() || null,
      prize: String(formData.get("prize") || "").trim() || null,
      rules: String(formData.get("rules") || "").trim() || null,
      metric: String(formData.get("metric") || "").trim() || null,
      unit: String(formData.get("unit") || "").trim() || null,
      scoring,
      starts_at: String(formData.get("starts_at") || "") || null,
      ends_at: String(formData.get("ends_at") || "") || null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  // The creator is the first rule keeper.
  if (data) await supabase.from("contest_rule_keepers").insert({ contest_id: data.id, user_id: profile.id });

  revalidateContests();
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
  revalidateContests();
}

export async function leaveContest(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const contestId = String(formData.get("contest_id") || "");
  if (!contestId) return;
  await supabase.from("contest_entries").delete().eq("contest_id", contestId).eq("user_id", profile.id);
  revalidateContests();
}

export async function setContestStatus(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["active", "ended"].includes(status)) return;
  // RLS restricts this to admins / rule keepers.
  await supabase.from("contests").update({ status }).eq("id", id);
  revalidateContests();
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

// ---- Score keeping (rule keepers / admins) -----------------------------
export async function recordScore(formData: FormData): Promise<void> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const contestId = String(formData.get("contest_id") || "");
  const participantId = String(formData.get("participant_id") || "");
  const raw = String(formData.get("value") || "").trim();
  const value = Number(raw);
  if (!contestId || !participantId || !Number.isFinite(value)) return;
  // RLS enforces that only keepers/admins can insert, and recorded_by = self.
  await supabase.from("contest_scores").insert({
    contest_id: contestId,
    participant_id: participantId,
    value,
    note: String(formData.get("note") || "").trim() || null,
    recorded_by: profile.id,
    recorded_at: String(formData.get("recorded_at") || "") || undefined,
  });
  revalidateContests();
}

export async function deleteScore(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("contest_scores").delete().eq("id", id);
  revalidateContests();
}

// ---- Rule keepers ------------------------------------------------------
export async function addRuleKeeper(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const contestId = String(formData.get("contest_id") || "");
  const userId = String(formData.get("user_id") || "");
  if (!contestId || !userId) return;
  await supabase.from("contest_rule_keepers").upsert(
    { contest_id: contestId, user_id: userId },
    { onConflict: "contest_id,user_id" }
  );
  revalidateContests();
}

export async function removeRuleKeeper(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const contestId = String(formData.get("contest_id") || "");
  const userId = String(formData.get("user_id") || "");
  if (!contestId || !userId) return;
  await supabase.from("contest_rule_keepers").delete().eq("contest_id", contestId).eq("user_id", userId);
  revalidateContests();
}

// ---- Cheers (congrats / fistbump / keep-it-up) -------------------------
export async function toggleCheer(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const contestId = String(formData.get("contest_id") || "");
  const toUser = String(formData.get("to_user") || "");
  const kind = String(formData.get("kind") || "");
  if (!contestId || !toUser || !CHEER_KINDS.includes(kind)) return;

  const { data: existing } = await supabase
    .from("contest_cheers")
    .select("id")
    .eq("contest_id", contestId)
    .eq("from_user", profile.id)
    .eq("to_user", toUser)
    .eq("kind", kind)
    .maybeSingle();
  if (existing) await supabase.from("contest_cheers").delete().eq("id", existing.id);
  else await supabase.from("contest_cheers").insert({ contest_id: contestId, from_user: profile.id, to_user: toUser, kind });
  revalidateContests();
}
