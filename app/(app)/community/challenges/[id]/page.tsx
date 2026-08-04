import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { PostFeed, POST_SELECT, type PostRow } from "@/components/community/PostFeed";
import { joinChallenge, leaveChallenge } from "@/app/(app)/community/actions";
import { challengeChannel } from "@/lib/channels";
import { metricLabel } from "@/lib/format";

type Row = { user_id: string; full_name: string; score: number };

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: challenge } = await supabase
    .from("challenges")
    .select("*, challenge_participants(user_id)")
    .eq("id", id)
    .maybeSingle();
  if (!challenge) notFound();

  const c = challenge as unknown as {
    id: string; title: string; description: string | null; metric: string;
    starts_at: string; ends_at: string; reward_points: number;
    challenge_participants: { user_id: string }[];
  };

  const channel = challengeChannel(id);
  const [{ data: boardRaw }, { data: postsRaw }, { data: peopleRaw }] = await Promise.all([
    supabase.rpc("challenge_leaderboard", { cid: id }),
    supabase.from("posts").select(POST_SELECT).eq("channel", channel).order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("id, full_name, avatar_url").neq("id", profile.id).order("full_name"),
  ]);

  const board = (boardRaw ?? []) as Row[];
  const posts = (postsRaw ?? []) as unknown as PostRow[];
  const people = (peopleRaw ?? []) as { id: string; full_name: string; avatar_url: string | null }[];

  const joined = c.challenge_participants.some((p) => p.user_id === profile.id);
  const ended = new Date(c.ends_at).getTime() < Date.now();
  const myRank = board.findIndex((r) => r.user_id === profile.id) + 1;
  const myScore = board.find((r) => r.user_id === profile.id)?.score ?? 0;

  return (
    <>
      <Link href="/community/challenges" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-ink-900 dark:hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        All challenges
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-[0_16px_40px_-10px_rgba(10,137,187,0.6)]">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
              🏆 {ended ? "Challenge ended" : "Live challenge"}
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-tight">{c.title}</h1>
            <p className="mt-1 text-sm text-white/85">
              {metricLabel(c.metric)} · {format(new Date(c.starts_at), "MMM d")} – {format(new Date(c.ends_at), "MMM d")} · {c.challenge_participants.length} in · {c.reward_points} pts
            </p>
            {c.description && <p className="mt-3 max-w-2xl text-sm text-white/90">{c.description}</p>}
            {joined && (
              <p className="mt-3 inline-block rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold">
                You&apos;re {myRank > 0 ? `#${myRank}` : "in"} · {myScore} {c.metric}
              </p>
            )}
          </div>
          {!ended && (
            joined ? (
              <form action={leaveChallenge}>
                <input type="hidden" name="challenge_id" value={c.id} />
                <button className="btn-on-brand">Leave challenge</button>
              </form>
            ) : (
              <form action={joinChallenge}>
                <input type="hidden" name="challenge_id" value={c.id} />
                <button className="btn-on-brand">Join challenge 🙌</button>
              </form>
            )
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* The challenge wall */}
        <div>
          <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Challenge wall</h2>
          <PostFeed
            posts={posts}
            people={people}
            me={{ id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url }}
            isAdmin={profile.is_admin}
            channel={channel}
            composerPlaceholder="Share an update, a win, or some friendly trash talk…"
            emptyText="No posts here yet — kick off the conversation!"
          />
        </div>

        {/* Leaderboard rail */}
        <aside className="self-start lg:sticky lg:top-6">
          <div className="rounded-3xl bg-white p-5 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08),0_24px_56px_-16px_rgba(15,23,42,0.34)] dark:bg-ink-800 dark:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.8)] dark:ring-1 dark:ring-white/10">
            <h2 className="mb-3 text-sm font-bold text-ink-900 dark:text-white">Leaderboard</h2>
            {board.length === 0 && <p className="text-sm muted">No participants yet — be the first in.</p>}
            <div className="space-y-1">
              {board.map((r, i) => {
                const medal = ["bg-gradient-to-br from-amber-300 to-yellow-500 text-white", "bg-gradient-to-br from-slate-300 to-slate-400 text-white", "bg-gradient-to-br from-amber-600 to-orange-700 text-white"][i] ?? "text-slate-400";
                const me = r.user_id === profile.id;
                return (
                  <div key={r.user_id} className={`flex items-center gap-2.5 rounded-xl p-1.5 ${me ? "bg-brand-50 dark:bg-brand-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5"}`}>
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${medal}`}>{i + 1}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 dark:text-white">{r.full_name}{me && " (you)"}</span>
                    <span className="text-xs font-bold text-brand-600 dark:text-brand-300">{r.score}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
