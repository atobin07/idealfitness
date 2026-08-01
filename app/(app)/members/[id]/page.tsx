import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import type { MemberProfile } from "@/lib/database.types";

const BADGE_EMOJI: Record<string, string> = { flag: "🚩", calendar: "📅", fire: "🔥", dumbbell: "🏋️", bolt: "⚡", star: "⭐", trophy: "🏆" };

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireProfile();
  const supabase = await createClient();

  const [{ data: profile }, { data: mpRaw }, { data: stats }, { data: badges }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, avatar_url, bio, goals").eq("id", id).maybeSingle(),
    supabase.from("member_profiles").select("*").eq("user_id", id).maybeSingle(),
    supabase.from("member_stats").select("total_points, level, current_streak, longest_streak").eq("user_id", id).maybeSingle(),
    supabase.from("member_badges").select("badge:badge_id(id, name, icon)").eq("user_id", id),
  ]);

  if (!profile) notFound();
  const mp = (mpRaw ?? null) as MemberProfile | null;
  const isMe = id === me.id;

  const facts: { label: string; value: string | null | undefined; emoji: string }[] = [
    { label: "Hometown", value: mp?.hometown, emoji: "📍" },
    { label: "What they do", value: mp?.occupation, emoji: "💼" },
    { label: "Favorite color", value: mp?.favorite_color, emoji: "🎨" },
    { label: "Favorite food", value: mp?.favorite_food, emoji: "🍽️" },
    { label: "Music", value: mp?.favorite_music, emoji: "🎵" },
    { label: "Favorite decade", value: mp?.favorite_decade, emoji: "📼" },
    { label: "Movie / show", value: mp?.favorite_movie, emoji: "🎬" },
    { label: "Hobbies", value: mp?.hobbies, emoji: "🎯" },
    { label: "Dream vacation", value: mp?.dream_vacation, emoji: "✈️" },
    { label: "Pets", value: mp?.pets, emoji: "🐾" },
    { label: "Early bird / night owl", value: mp?.early_bird_or_night_owl, emoji: "🌅" },
    { label: "Coffee or tea", value: mp?.coffee_or_tea, emoji: "☕" },
    { label: "Fun fact", value: mp?.fun_fact, emoji: "✨" },
  ].filter((f) => f.value);

  const gym: { label: string; value: string | null | undefined; emoji: string }[] = [
    { label: "Workout song", value: mp?.favorite_workout_song, emoji: "🎧" },
    { label: "Favorite movement", value: mp?.favorite_movement, emoji: "💪" },
    { label: "Favorite training day", value: mp?.favorite_training_day, emoji: "📆" },
  ].filter((f) => f.value);

  const earned = (badges ?? []) as unknown as { badge: { id: string; name: string; icon: string } | null }[];

  return (
    <>
      <Link href="/members" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        All members
      </Link>

      {/* Header */}
      <div className="card-brand p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={profile.full_name || "Member"} src={profile.avatar_url} size="xl" />
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.full_name || "Member"}</h1>
              <p className="text-sm text-white/75 capitalize">{profile.role === "trainer" ? "Coach" : "Member"}</p>
              {stats && (
                <p className="mt-1 text-sm text-white/90">
                  {stats.total_points.toLocaleString()} pts · Level {stats.level} · {stats.current_streak}🔥 streak
                </p>
              )}
            </div>
          </div>
          {isMe && <Link href="/settings" className="btn-on-brand">Edit my profile</Link>}
        </div>
      </div>

      {mp?.current_goal && (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-5 dark:border-brand-500/30 dark:bg-brand-500/10">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700 dark:text-brand-300">Currently working on</p>
            <p className="text-lg font-semibold text-ink-900 dark:text-white">{mp.current_goal}</p>
          </div>
        </div>
      )}

      {mp?.intro && (
        <div className="mt-6 card p-6">
          <h2 className="mb-2 font-semibold text-ink-900 dark:text-white">About</h2>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900 dark:text-white">{mp.intro}</p>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {facts.length > 0 && (
          <div className="card p-6">
            <h2 className="mb-4 font-semibold text-ink-900 dark:text-white">Get to know {profile.full_name?.split(" ")[0] || "them"}</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {facts.map((f) => (
                <div key={f.label}>
                  <dt className="text-xs uppercase tracking-wide muted">{f.emoji} {f.label}</dt>
                  <dd className="text-sm font-medium text-ink-900 dark:text-white">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="space-y-6">
          {gym.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-4 font-semibold text-ink-900 dark:text-white">In the gym</h2>
              <dl className="space-y-3">
                {gym.map((f) => (
                  <div key={f.label} className="flex items-center justify-between gap-3">
                    <dt className="text-sm muted">{f.emoji} {f.label}</dt>
                    <dd className="text-right text-sm font-medium text-ink-900 dark:text-white">{f.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {earned.length > 0 && (
            <div className="card p-6">
              <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Badges</h2>
              <div className="flex flex-wrap gap-2">
                {earned.map((b, i) => b.badge && (
                  <span key={i} className="badge gap-1 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                    {BADGE_EMOJI[b.badge.icon] ?? "⭐"} {b.badge.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {facts.length === 0 && gym.length === 0 && !mp?.intro && !mp?.current_goal && (
        <div className="mt-6 card p-10 text-center muted">
          {isMe ? (
            <>You haven&apos;t filled out your profile yet. <Link href="/settings" className="font-medium text-brand-600">Add your details →</Link></>
          ) : (
            "This member hasn't filled out their profile yet."
          )}
        </div>
      )}
    </>
  );
}
