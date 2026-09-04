import { FLOAT_CARD } from "@/components/community/PostCard";
import { giveKudos } from "@/app/(app)/community/actions";
import { relativeTime } from "@/lib/format";
import type { ActivityData } from "@/lib/feed/types";

const ACTIVITY_EMOJI: Record<string, string> = {
  checkin: "📍", session: "💪", workout: "🏋️", badge: "🏅", duel: "⚔️", challenge: "🏆", event: "📅",
};

export function ActivityFeedCard({ activity: a, myId }: { activity: ActivityData; myId: string }) {
  return (
    <div className={`${FLOAT_CARD} flex items-start gap-3 p-5`}>
      <span className="mt-0.5 text-xl">{ACTIVITY_EMOJI[a.type] ?? "•"}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-900 dark:text-white">
          <span className="font-semibold">{a.full_name || "A member"}</span> · {a.title}
        </p>
        {a.body && <p className="text-sm muted">{a.body}</p>}
        <p className="text-xs muted">{relativeTime(a.created_at)}</p>
      </div>
      {a.user_id !== myId && (
        <form action={giveKudos}>
          <input type="hidden" name="activity_id" value={a.id} />
          <button className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${a.kudosMine ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300" : "border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-300"}`}>
            👏 {a.kudosCount > 0 ? a.kudosCount : ""}
          </button>
        </form>
      )}
      {a.user_id === myId && a.kudosCount > 0 && (
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs muted dark:border-white/10">👏 {a.kudosCount}</span>
      )}
    </div>
  );
}
