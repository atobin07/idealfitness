"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { ChallengeMetric, PostKind } from "@/lib/database.types";

const POST_KINDS: PostKind[] = ["post", "shoutout", "congrats", "thank_you", "milestone", "announcement"];
function asKind(v: unknown): PostKind {
  const s = String(v || "");
  return (POST_KINDS.includes(s as PostKind) ? s : "post") as PostKind;
}

const METRICS: ChallengeMetric[] = ["checkins", "sessions", "classes", "workouts", "points"];
function asMetric(v: unknown): ChallengeMetric {
  const s = String(v || "");
  return (METRICS.includes(s as ChallengeMetric) ? s : "checkins") as ChallengeMetric;
}
function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86_400_000).toISOString();
}

export type FormState = { error?: string; ok?: boolean } | undefined;

// ---- Check-in ----------------------------------------------------------
export async function checkIn(): Promise<{ already: boolean; streak: number; points: number } | { error: string }> {
  await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("do_checkin");
  if (error) return { error: error.message };
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
  revalidatePath("/dashboard");
  return data as { already: boolean; streak: number; points: number };
}

// ---- Kudos -------------------------------------------------------------
export async function giveKudos(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const activityId = String(formData.get("activity_id") || "");
  if (!activityId) return;
  await supabase.rpc("give_kudos", { p_activity: activityId });
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
}

// ---- Challenges --------------------------------------------------------
export async function createChallenge(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Give the challenge a title." };
  const metric = asMetric(formData.get("metric"));
  const days = Math.max(1, parseInt(String(formData.get("days") || "14"), 10) || 14);
  const reward = Math.max(0, parseInt(String(formData.get("reward") || "100"), 10) || 100);

  const { data, error } = await supabase
    .from("challenges")
    .insert({
      title,
      description: String(formData.get("description") || "").trim() || null,
      metric,
      starts_at: new Date().toISOString(),
      ends_at: daysFromNow(days),
      reward_points: reward,
      created_by: profile.id,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  if (data) await supabase.from("challenge_participants").insert({ challenge_id: data.id, user_id: profile.id });
  revalidatePath("/community/challenges");
  return { ok: true };
}

export async function joinChallenge(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("challenge_id") || "");
  if (!id) return;
  await supabase.from("challenge_participants").upsert({ challenge_id: id, user_id: profile.id }, { onConflict: "challenge_id,user_id" });
  revalidatePath("/community/challenges");
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
}

export async function leaveChallenge(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("challenge_id") || "");
  if (!id) return;
  await supabase.from("challenge_participants").delete().eq("challenge_id", id).eq("user_id", profile.id);
  revalidatePath("/community/challenges");
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
}

// ---- Duels -------------------------------------------------------------
export async function createDuel(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const opponent = String(formData.get("opponent_id") || "");
  if (!opponent || opponent === profile.id) return { error: "Pick an opponent." };
  const metric = asMetric(formData.get("metric"));
  const days = Math.max(1, parseInt(String(formData.get("days") || "7"), 10) || 7);
  const { error } = await supabase.from("duels").insert({
    challenger_id: profile.id,
    opponent_id: opponent,
    metric,
    starts_at: new Date().toISOString(),
    ends_at: daysFromNow(days),
    status: "pending",
  });
  if (error) return { error: error.message };
  revalidatePath("/community/duels");
  return { ok: true };
}

export async function respondDuel(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const action = String(formData.get("action") || "");
  if (!id) return;
  if (action === "accept") {
    // Restart the clock from acceptance so both sides get the full window.
    const { data: d } = await supabase.from("duels").select("ends_at, starts_at").eq("id", id).single();
    await supabase.from("duels").update({ status: "active", starts_at: new Date().toISOString() }).eq("id", id).eq("opponent_id", profile.id);
    void d;
  } else if (action === "decline") {
    await supabase.from("duels").update({ status: "declined" }).eq("id", id).eq("opponent_id", profile.id);
  } else if (action === "cancel") {
    await supabase.from("duels").update({ status: "cancelled" }).eq("id", id).eq("challenger_id", profile.id);
  }
  revalidatePath("/community/duels");
}

export async function settleDuel(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.rpc("settle_duel", { did: id });
  revalidatePath("/community/duels");
}

// ---- Partner goals -----------------------------------------------------
export async function createPartnerGoal(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const title = String(formData.get("title") || "").trim();
  if (!title) return { error: "Give the goal a title." };
  const partner = String(formData.get("partner_id") || "");
  const metric = asMetric(formData.get("metric"));
  const target = Math.max(1, parseInt(String(formData.get("target") || "20"), 10) || 20);
  const days = Math.max(1, parseInt(String(formData.get("days") || "30"), 10) || 30);

  const { data, error } = await supabase
    .from("partner_goals")
    .insert({ title, metric, target, starts_at: new Date().toISOString(), ends_at: daysFromNow(days), created_by: profile.id })
    .select("id")
    .single();
  if (error) return { error: error.message };
  if (data) {
    const members = [{ goal_id: data.id, user_id: profile.id }];
    if (partner && partner !== profile.id) members.push({ goal_id: data.id, user_id: partner });
    await supabase.from("partner_goal_members").insert(members);
  }
  revalidatePath("/community/goals");
  return { ok: true };
}

// ---- Feed: posts, likes, comments, tags --------------------------------
export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const body = String(formData.get("body") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim() || null;
  let kind = asKind(formData.get("kind"));
  if (kind === "announcement" && !profile.is_admin) kind = "post"; // only admins broadcast
  const channel = String(formData.get("channel") || "feed") === "pets" ? "pets" : "feed";
  const tagged = formData.getAll("tagged_ids").map(String).filter((id) => id && id !== profile.id);

  if (!body && !imageUrl) return { error: "Write something or add a photo." };

  const { data: post, error } = await supabase
    .from("posts")
    .insert({ author_id: profile.id, kind, channel, body: body || null, image_url: imageUrl })
    .select("id")
    .single();
  if (error) return { error: error.message };

  if (post && tagged.length > 0) {
    await supabase.from("post_tags").insert(tagged.map((id) => ({ post_id: post.id, tagged_user_id: id })));
  }
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
  return { ok: true };
}

export async function deletePost(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("posts").delete().eq("id", id).eq("author_id", profile.id);
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
}

export async function toggleLike(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const postId = String(formData.get("post_id") || "");
  if (!postId) return;
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (existing) await supabase.from("post_likes").delete().eq("id", existing.id);
  else await supabase.from("post_likes").insert({ post_id: postId, user_id: profile.id });
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
}

export async function addComment(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const postId = String(formData.get("post_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!postId || !body) return;
  await supabase.from("post_comments").insert({ post_id: postId, author_id: profile.id, body });
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
}

export async function deleteComment(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("post_comments").delete().eq("id", id).eq("author_id", profile.id);
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
}

export async function toggleCommentLike(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const commentId = String(formData.get("comment_id") || "");
  if (!commentId) return;
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("id")
    .eq("comment_id", commentId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (existing) await supabase.from("comment_likes").delete().eq("id", existing.id);
  else await supabase.from("comment_likes").insert({ comment_id: commentId, user_id: profile.id });
  revalidatePath("/community");
  revalidatePath("/animal-kingdom");
}

export async function joinPartnerGoal(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("goal_id") || "");
  if (!id) return;
  await supabase.from("partner_goal_members").upsert({ goal_id: id, user_id: profile.id }, { onConflict: "goal_id,user_id" });
  revalidatePath("/community/goals");
}

export async function leavePartnerGoal(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("goal_id") || "");
  if (!id) return;
  await supabase.from("partner_goal_members").delete().eq("goal_id", id).eq("user_id", profile.id);
  revalidatePath("/community/goals");
}
