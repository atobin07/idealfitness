import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { CreateDuelDialog } from "@/components/community/CreateDuelDialog";
import { respondDuel, settleDuel } from "@/app/(app)/community/actions";
import { metricLabel } from "@/lib/format";

export default async function DuelsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: duelsRaw }, { data: peopleRaw }] = await Promise.all([
    supabase
      .from("duels")
      .select("*, challenger:challenger_id(id, full_name), opponent:opponent_id(id, full_name)")
      .or(`challenger_id.eq.${profile.id},opponent_id.eq.${profile.id}`)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name").neq("id", profile.id).order("full_name"),
  ]);

  const duels = (duelsRaw ?? []) as unknown as {
    id: string; metric: string; starts_at: string; ends_at: string; status: string; winner_id: string | null;
    challenger: { id: string; full_name: string } | null;
    opponent: { id: string; full_name: string } | null;
  }[];
  const people = (peopleRaw ?? []) as { id: string; full_name: string }[];

  const scores = await Promise.all(
    duels.map((d) =>
      d.status === "active" || d.status === "completed"
        ? supabase.rpc("duel_scores", { did: d.id }).then((r) => (r.data?.[0] ?? null) as { challenger_score: number; opponent_score: number } | null)
        : Promise.resolve(null)
    )
  );

  const active = duels.filter((d) => d.status === "active");
  const pending = duels.filter((d) => d.status === "pending");
  const done = duels.filter((d) => d.status === "completed");

  return (
    <>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Community</h1>
        <CreateDuelDialog people={people} />
      </div>
      <p className="mb-4 text-sm text-slate-500">Go head-to-head. Winner takes 50 points and the bragging rights.</p>
      <CommunityTabs />

      {duels.length === 0 && <div className="card p-10 text-center muted">No duels yet. Challenge a member!</div>}

      <div className="space-y-6">
        {pending.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">Invitations</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {pending.map((d) => {
                const iAmOpponent = d.opponent?.id === profile.id;
                return (
                  <div key={d.id} className="card p-4">
                    <p className="text-sm text-ink-900 dark:text-white">
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
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {active.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">Live duels</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {active.map((d) => {
                const i = duels.indexOf(d);
                const s = scores[i];
                const cs = s?.challenger_score ?? 0;
                const os = s?.opponent_score ?? 0;
                const ended = new Date(d.ends_at) < new Date();
                const total = Math.max(1, cs + os);
                return (
                  <div key={d.id} className="card p-4">
                    <div className="flex items-center justify-between">
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
                        <button className="btn-primary px-3 py-1.5 text-xs">Settle & award winner</button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">Finished</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {done.map((d) => {
                const won = d.winner_id === profile.id;
                const tie = !d.winner_id;
                const winnerName = d.winner_id === d.challenger?.id ? d.challenger?.full_name : d.opponent?.full_name;
                return (
                  <div key={d.id} className="card flex items-center justify-between p-4">
                    <p className="text-sm text-ink-900 dark:text-white">
                      {d.challenger?.full_name} vs {d.opponent?.full_name}
                      <span className="block text-xs muted">{metricLabel(d.metric)}</span>
                    </p>
                    <span className={`badge ${won ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                      {tie ? "Tie" : won ? "You won 🏆" : `${winnerName} won`}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
