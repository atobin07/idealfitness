"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { ChallengeMetric, PostKind } from "@/lib/database.types";
import { CHALLENGE_PREFIX, CONTEST_PREFIX } from "@/lib/channels";

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

// Feed channels: the gym-wide "feed", the "pets" channel, or a per-challenge
// space keyed "challenge:<uuid>". Anything else falls back to the main feed.
const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
function asChannel(v: unknown): string {
  const s = String(v || "feed");
  if (s === "pets") return "pets";
  if (s.startsWith(CHALLENGE_PREFIX) && UUID_RE.test(s.slice(CHALLENGE_PREFIX.length))) return s;
  if (s.startsWith(CONTEST_PREFIX) && UUID_RE.test(s.slice(CONTEST_PREFIX.length))) return s;
  return "feed";
}

export type FormState = { error?: string; ok?: boolean } | undefined;

// ---- Check-in ----------------------------------------------------------
export async function checkIn(): Promise<{ already: boolean; streak: number; points: number } | { error: string }> {
  await requireProfile();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("do_checkin");
  if (error) return { error: error.message };
  revalidatePath("/community");
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
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
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
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
  revalidatePath("/feed");
  return { ok: true };
}

export async function joinChallenge(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("challenge_id") || "");
  if (!id) return;
  await supabase.from("challenge_participants").upsert({ challenge_id: id, user_id: profile.id }, { onConflict: "challenge_id,user_id" });
  revalidatePath("/community/challenges");
  revalidatePath("/feed");
  revalidatePath("/community");
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
}

export async function leaveChallenge(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("challenge_id") || "");
  if (!id) return;
  await supabase.from("challenge_participants").delete().eq("challenge_id", id).eq("user_id", profile.id);
  revalidatePath("/community/challenges");
  revalidatePath("/feed");
  revalidatePath("/community");
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
}

// ---- Feed: posts, likes, comments, tags --------------------------------
export async function createPost(_prev: FormState, formData: FormData): Promise<FormState> {
  const profile = await requireProfile();
  const supabase = await createClient();
  const body = String(formData.get("body") || "").trim();
  const imageUrl = String(formData.get("image_url") || "").trim() || null;
  let kind = asKind(formData.get("kind"));
  if (kind === "announcement" && !profile.is_admin) kind = "post"; // only admins broadcast
  const channel = asChannel(formData.get("channel"));
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
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
  return { ok: true };
}

export async function deletePost(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("posts").delete().eq("id", id).eq("author_id", profile.id);
  revalidatePath("/community");
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
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
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
}

export async function addComment(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const postId = String(formData.get("post_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!postId || !body) return;
  await supabase.from("post_comments").insert({ post_id: postId, author_id: profile.id, body });
  revalidatePath("/community");
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
}

export async function deleteComment(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("post_comments").delete().eq("id", id).eq("author_id", profile.id);
  revalidatePath("/community");
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
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
  revalidatePath("/feed");
  revalidatePath("/dashboard");
  revalidatePath("/animal-kingdom");
  revalidatePath("/community/challenges/[id]", "page");
  revalidatePath("/contests/[id]", "page");
}
