import Link from "next/link";
import { format } from "date-fns";
import { FLOAT_CARD } from "@/components/community/PostCard";
import { metricLabel } from "@/lib/format";
import type { ChallengeData } from "@/lib/feed/types";

export function ChallengeFeedCard({ challenge: c, myId }: { challenge: ChallengeData; myId: string }) {
  const myRow = c.board.find((r) => r.user_id === myId);
  const myRank = c.board.findIndex((r) => r.user_id === myId) + 1;

  return (
    <div className={`${FLOAT_CARD} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">🏆 Challenge</span>
          <Link href={`/community/challenges/${c.id}`} className="mt-1 block font-semibold text-ink-900 hover:text-brand-700 dark:text-white dark:hover:text-brand-300">{c.title}</Link>
          <p className="text-xs muted">
            {metricLabel(c.metric)} · ends {format(new Date(c.ends_at), "MMM d")} · {c.participantCount} in · {c.reward_points} pts
          </p>
        </div>
        {c.joined && <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">Joined</span>}
      </div>

      {c.description && <p className="mt-2 text-sm muted">{c.description}</p>}

      {c.joined && (
        <p className="mt-2 text-sm font-medium text-brand-700 dark:text-brand-300">
          You&apos;re {myRank > 0 ? `#${myRank}` : "in"} with {myRow?.score ?? 0} {c.metric}
        </p>
      )}

      <div className="mt-3 border-t border-slate-100 pt-3 dark:border-white/10">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide muted">Top members</p>
        {c.board.length === 0 && <p className="text-sm muted">No participants yet.</p>}
        <div className="space-y-0.5">
          {c.board.slice(0, 3).map((r, idx) => (
            <div key={r.user_id} className="flex items-center justify-between text-sm">
              <span className="text-ink-900 dark:text-white">
                <span className="mr-2 font-bold text-brand-600 dark:text-brand-300">{idx + 1}</span>
                {r.full_name}{r.user_id === myId && " (you)"}
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
}
