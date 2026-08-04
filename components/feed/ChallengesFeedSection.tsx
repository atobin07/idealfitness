import Link from "next/link";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { CreateChallengeDialog } from "@/components/community/CreateChallengeDialog";
import { metricLabel } from "@/lib/format";
import type { Profile } from "@/lib/database.types";

type Row = { user_id: string; full_name: string; score: number };

export async function ChallengesFeedSection({ profile }: { profile: Profile }) {
  const supabase = await createClient();

  const { data: challenges } = await supabase
    .from("challenges")
    .select("*, challenge_participants(user_id)")
    .gte("ends_at", new Date().toISOString())
    .order("ends_at", { ascending: true });

  const list = (challenges ?? []) as unknown as {
    id: string; title: string; description: string | null; metric: string;
    starts_at: string; ends_at: string; reward_points: number;
    challenge_participants: { user_id: string }[];
  }[];

  const boards = await Promise.all(
    list.map((c) => supabase.rpc("challenge_leaderboard", { cid: c.id }).then((r) => (r.data ?? []) as Row[]))
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">Gym-wide competitions. Join one, climb the board, and talk it up on the wall.</p>
        <CreateChallengeDialog />
      </div>

      {list.length === 0 && <div className="card p-10 text-center muted">No active challenges. Start one!</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((c, i) => {
          const board = boards[i];
          const myRow = board.find((r) => r.user_id === profile.id);
          const myRank = board.findIndex((r) => r.user_id === profile.id) + 1;
          const joined = c.challenge_participants.some((p) => p.user_id === profile.id);
          return (
            <div key={c.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/community/challenges/${c.id}`} className="font-semibold text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300">{c.title}</Link>
                  <p className="text-xs muted">
                    {metricLabel(c.metric)} · ends {format(new Date(c.ends_at), "MMM d")} · {c.challenge_participants.length} in · {c.reward_points} pts
                  </p>
                </div>
                {joined && <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">Joined</span>}
              </div>

              {c.description && <p className="mt-2 text-sm muted">{c.description}</p>}

              {joined && (
                <p className="mt-2 text-sm font-medium text-brand-700 dark:text-brand-300">
                  You&apos;re {myRank > 0 ? `#${myRank}` : "in"} with {myRow?.score ?? 0} {c.metric}
                </p>
              )}

              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide muted">Top members</p>
                {board.length === 0 && <p className="text-sm muted">No participants yet.</p>}
                <div className="space-y-0.5">
                  {board.slice(0, 3).map((r, idx) => (
                    <div key={r.user_id} className="flex items-center justify-between text-sm">
                      <span className="text-ink-900 dark:text-white">
                        <span className="mr-2 font-bold text-brand-600 dark:text-brand-300">{idx + 1}</span>
                        {r.full_name}{r.user_id === profile.id && " (you)"}
                      </span>
                      <span className="font-semibold text-ink-900 dark:text-white">{r.score}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={`/community/challenges/${c.id}`}
                className="mt-3 flex items-center justify-center gap-1 rounded-xl bg-slate-100 py-2 text-sm font-semibold text-brand-700 transition hover:bg-slate-200 dark:bg-white/5 dark:text-brand-300 dark:hover:bg-white/10"
              >
                Open challenge wall 💬
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
}
