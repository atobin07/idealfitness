"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type PollState = { error?: string; ok?: boolean } | undefined;

function revalidatePolls() {
  revalidatePath("/feed");
  revalidatePath("/dashboard");
}

export async function createPoll(_prev: PollState, formData: FormData): Promise<PollState> {
  const profile = await requireProfile();
  if (!profile.is_admin) return { error: "Only admins can create polls." };
  const supabase = await createClient();

  const question = String(formData.get("question") || "").trim();
  if (!question) return { error: "Ask a question." };
  const options = formData
    .getAll("option")
    .map((o) => String(o).trim())
    .filter(Boolean)
    .slice(0, 10);
  if (options.length < 2) return { error: "Add at least two options." };

  const { data: poll, error } = await supabase
    .from("polls")
    .insert({
      question,
      description: String(formData.get("description") || "").trim() || null,
      allow_multiple: formData.get("allow_multiple") === "on",
      closes_at: String(formData.get("closes_at") || "") || null,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const { error: optErr } = await supabase
    .from("poll_options")
    .insert(options.map((label, i) => ({ poll_id: poll.id, label, sort: i })));
  if (optErr) return { error: optErr.message };

  revalidatePolls();
  return { ok: true };
}

export async function votePoll(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const pollId = String(formData.get("poll_id") || "");
  const optionId = String(formData.get("option_id") || "");
  if (!pollId || !optionId) return;

  const { data: poll } = await supabase.from("polls").select("status, allow_multiple").eq("id", pollId).maybeSingle();
  if (!poll || poll.status !== "open") return;

  const { data: mine } = await supabase
    .from("poll_votes")
    .select("id, option_id")
    .eq("poll_id", pollId)
    .eq("user_id", profile.id);
  const existing = mine ?? [];
  const already = existing.find((v) => v.option_id === optionId);

  if (poll.allow_multiple) {
    // Toggle just this option.
    if (already) await supabase.from("poll_votes").delete().eq("id", already.id);
    else await supabase.from("poll_votes").insert({ poll_id: pollId, option_id: optionId, user_id: profile.id });
  } else {
    // Single choice: clear any prior vote, then set this one (clicking your
    // current pick clears it).
    if (existing.length) await supabase.from("poll_votes").delete().eq("poll_id", pollId).eq("user_id", profile.id);
    if (!already) await supabase.from("poll_votes").insert({ poll_id: pollId, option_id: optionId, user_id: profile.id });
  }
  revalidatePolls();
}

export async function setPollStatus(formData: FormData) {
  const profile = await requireProfile();
  if (!profile.is_admin) return;
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["open", "closed"].includes(status)) return;
  await supabase.from("polls").update({ status }).eq("id", id);
  revalidatePolls();
}

export async function deletePoll(formData: FormData) {
  const profile = await requireProfile();
  if (!profile.is_admin) return;
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("polls").delete().eq("id", id);
  revalidatePolls();
}
