import { format } from "date-fns";
import { Avatar } from "@/components/Avatar";
import { FLOAT_CARD } from "@/components/community/PostCard";
import { leavePartnerGoal } from "@/app/(app)/community/actions";
import { metricLabel } from "@/lib/format";
import type { PartnerGoalData } from "@/lib/feed/types";

export function PartnerGoalFeedCard({ goal: g, myId }: { goal: PartnerGoalData; myId: string }) {
  const pct = Math.min(100, Math.round((g.progress / Math.max(1, g.target)) * 100));
  const complete = g.progress >= g.target;

  return (
    <div className={`${FLOAT_CARD} p-5`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">🤝 Partner goal</span>
          <h3 className="mt-1 font-semibold text-ink-900 dark:text-white">{g.title}</h3>
          <p className="text-xs muted">{metricLabel(g.metric)} · by {format(new Date(g.ends_at), "MMM d")}</p>
        </div>
        {complete && <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Done ✅</span>}
      </div>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="font-semibold text-ink-900 dark:text-white">{g.progress} / {g.target}</span>
          <span className="muted">{pct}%</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <div className={`h-full rounded-full ${complete ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/10">
        <div className="flex items-center -space-x-2">
          {g.members.map((m) => (
            <div key={m.user_id} className="ring-2 ring-white dark:ring-ink-800 rounded-full">
              <Avatar name={m.full_name} size="sm" />
            </div>
          ))}
          <span className="ml-4 text-xs muted">{g.members.map((m) => m.full_name).join(", ")}</span>
        </div>
        {g.members.some((m) => m.user_id === myId) && (
          <form action={leavePartnerGoal}>
            <input type="hidden" name="goal_id" value={g.id} />
            <button className="btn-ghost px-2 py-1 text-xs text-red-600">Leave</button>
          </form>
        )}
      </div>
    </div>
  );
}
