import { format } from "date-fns";
import { Avatar } from "@/components/Avatar";
import { FLOAT_CARD } from "@/components/community/PostCard";
import { respondDuel, settleDuel } from "@/app/(app)/community/actions";
import { metricLabel } from "@/lib/format";
import type { DuelData } from "@/lib/feed/types";

export function DuelFeedCard({ duel: d, myId }: { duel: DuelData; myId: string }) {
  const iAmOpponent = d.opponent?.id === myId;
  const cs = d.scores?.challenger_score ?? 0;
  const os = d.scores?.opponent_score ?? 0;
  const total = Math.max(1, cs + os);
  const ended = new Date(d.ends_at) < new Date();

  return (
    <div className={`${FLOAT_CARD} p-5`}>
      <span className="badge bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">⚔️ Duel</span>

      {d.status === "pending" && (
        <>
          <p className="mt-2 text-sm text-ink-900 dark:text-white">
            <span className="font-semibold">{d.challenger?.full_name}</span> vs <span className="font-semibold">{d.opponent?.full_name}</span>
          </p>
          <p className="text-xs muted">{metricLabel(d.metric)} · {Math.round((new Date(d.ends_at).getTime() - new Date(d.starts_at).getTime()) / 86400000)} days</p>
          <div className="mt-3 flex gap-2">
            {iAmOpponent ? (
              <>
                <form action={respondDuel}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="action" value="accept" />
                  <button className="btn-primary px-3 py-1.5 text-xs">Accept</button>
                </form>
                <form action={respondDuel}>
                  <input type="hidden" name="id" value={d.id} />
                  <input type="hidden" name="action" value="decline" />
                  <button className="btn-ghost px-3 py-1.5 text-xs text-red-600">Decline</button>
                </form>
              </>
            ) : (
              <form action={respondDuel}>
                <input type="hidden" name="id" value={d.id} />
                <input type="hidden" name="action" value="cancel" />
                <button className="btn-secondary px-3 py-1.5 text-xs">Cancel invite</button>
              </form>
            )}
          </div>
        </>
      )}

      {d.status === "active" && (
        <>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar name={d.challenger?.full_name || "?"} size="sm" />
              <span className="text-sm font-semibold text-ink-900 dark:text-white">{cs}</span>
            </div>
            <span className="text-xs muted">{metricLabel(d.metric)}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink-900 dark:text-white">{os}</span>
              <Avatar name={d.opponent?.full_name || "?"} size="sm" />
            </div>
          </div>
          <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full bg-brand-500" style={{ width: `${(cs / total) * 100}%` }} />
            <div className="h-full bg-violet-500" style={{ width: `${(os / total) * 100}%` }} />
          </div>
          <p className="mt-2 text-xs muted">
            {d.challenger?.full_name} vs {d.opponent?.full_name} · {ended ? "ended" : `ends ${format(new Date(d.ends_at), "MMM d")}`}
          </p>
          {ended && (
            <form action={settleDuel} className="mt-2">
              <input type="hidden" name="id" value={d.id} />
              <button className="btn-primary px-3 py-1.5 text-xs">Settle &amp; award winner</button>
            </form>
          )}
        </>
      )}

      {d.status === "completed" && (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ink-900 dark:text-white">
            {d.challenger?.full_name} vs {d.opponent?.full_name}
            <span className="block text-xs muted">{metricLabel(d.metric)}</span>
          </p>
          <span className={`badge ${d.winner_id === myId ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
            {!d.winner_id ? "Tie" : d.winner_id === myId ? "You won 🏆" : `${d.winner_id === d.challenger?.id ? d.challenger?.full_name : d.opponent?.full_name} won`}
          </span>
        </div>
      )}
    </div>
  );
}
