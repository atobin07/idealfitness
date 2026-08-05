import { votePoll, setPollStatus, deletePoll } from "@/app/(app)/polls/actions";

type Option = { id: string; label: string };
type Vote = { option_id: string; user_id: string };
type PollLite = { id: string; question: string; description: string | null; status: string; allow_multiple: boolean };

export function PollCard({
  poll,
  options,
  votes,
  myId,
  canManage = false,
  compact = false,
}: {
  poll: PollLite;
  options: Option[];
  votes: Vote[];
  myId: string;
  canManage?: boolean;
  compact?: boolean;
}) {
  const counts = new Map<string, number>();
  options.forEach((o) => counts.set(o.id, 0));
  votes.forEach((v) => counts.set(v.option_id, (counts.get(v.option_id) ?? 0) + 1));
  const total = votes.length;
  const myOptions = new Set(votes.filter((v) => v.user_id === myId).map((v) => v.option_id));
  const iVoted = myOptions.size > 0;
  const open = poll.status === "open";

  return (
    <div className={`rounded-2xl bg-white p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10 ${compact ? "ring-1 ring-brand-100 dark:ring-brand-500/20" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">📊 Poll</span>
            {!open && <span className="badge bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">Closed</span>}
            {poll.allow_multiple && open && <span className="text-[11px] font-medium muted">choose any</span>}
          </div>
          <h3 className="mt-2 font-semibold text-ink-900 dark:text-white">{poll.question}</h3>
          {poll.description && <p className="mt-0.5 text-sm muted">{poll.description}</p>}
        </div>
        {canManage && (
          <div className="flex shrink-0 items-center gap-1">
            <form action={setPollStatus}>
              <input type="hidden" name="id" value={poll.id} />
              <input type="hidden" name="status" value={open ? "closed" : "open"} />
              <button className="btn-ghost px-2 py-1 text-xs text-slate-500">{open ? "Close" : "Reopen"}</button>
            </form>
            <form action={deletePoll}>
              <input type="hidden" name="id" value={poll.id} />
              <button className="btn-ghost px-2 py-1 text-xs text-slate-400 hover:text-red-500">Delete</button>
            </form>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {options.map((o) => {
          const count = counts.get(o.id) ?? 0;
          const pct = total ? Math.round((count / total) * 100) : 0;
          const mine = myOptions.has(o.id);
          // Reveal results once you've voted (or the poll closed); before that,
          // keep it a clean ballot so early results don't bias answers.
          const reveal = iVoted || !open;
          const inner = (
            <div className={`relative w-full overflow-hidden rounded-xl border px-3 py-2 text-left transition ${mine ? "border-brand-300 dark:border-brand-500/40" : "border-slate-200 dark:border-white/10"} ${open ? "hover:border-brand-300" : ""}`}>
              {reveal && <span className={`absolute inset-y-0 left-0 ${mine ? "bg-brand-100 dark:bg-brand-500/20" : "bg-slate-100 dark:bg-white/5"}`} style={{ width: `${pct}%` }} />}
              <div className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 text-sm font-medium text-ink-900 dark:text-white">
                  {mine && <span className="text-brand-600 dark:text-brand-300">✓</span>}
                  {o.label}
                </span>
                {reveal && <span className="text-xs font-semibold text-ink-700 dark:text-slate-300">{pct}% · {count}</span>}
              </div>
            </div>
          );
          return open ? (
            <form key={o.id} action={votePoll}>
              <input type="hidden" name="poll_id" value={poll.id} />
              <input type="hidden" name="option_id" value={o.id} />
              <button className="block w-full">{inner}</button>
            </form>
          ) : (
            <div key={o.id}>{inner}</div>
          );
        })}
      </div>

      <p className="mt-3 text-xs muted">
        {total} {total === 1 ? "vote" : "votes"}
        {open ? (iVoted ? " · tap to change your answer" : " · your feedback matters — vote above") : " · voting closed"}
      </p>
    </div>
  );
}
