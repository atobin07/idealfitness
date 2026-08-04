import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { PostFeed, POST_SELECT, type PostRow } from "@/components/community/PostFeed";
import { contestChannel } from "@/lib/channels";
import {
  joinContest, leaveContest, setContestStatus,
  recordScore, deleteScore, addRuleKeeper, removeRuleKeeper, toggleCheer,
} from "@/app/(app)/contests/actions";

type Person = { id: string; full_name: string; avatar_url: string | null };
type Entry = { user_id: string; profile: Person | null };
type Keeper = { user_id: string; profile: Person | null };
type Score = { id: string; participant_id: string; value: number; note: string | null; recorded_at: string };
type Cheer = { to_user: string; from_user: string; kind: string };

const CHEERS: { kind: string; emoji: string; label: string }[] = [
  { kind: "congrats", emoji: "👏", label: "Congrats" },
  { kind: "fistbump", emoji: "🤜", label: "Fist bump" },
  { kind: "cheer", emoji: "💪", label: "Keep it up" },
];

export default async function ContestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: contest } = await supabase
    .from("contests")
    .select("*, contest_entries(user_id, profile:user_id(id, full_name, avatar_url)), contest_rule_keepers(user_id, profile:user_id(id, full_name, avatar_url))")
    .eq("id", id)
    .maybeSingle();
  if (!contest) notFound();

  const c = contest as unknown as {
    id: string; title: string; description: string | null; prize: string | null; rules: string | null;
    metric: string | null; unit: string | null; scoring: string; status: string;
    starts_at: string | null; ends_at: string | null; created_by: string | null;
    contest_entries: Entry[]; contest_rule_keepers: Keeper[];
  };

  const channel = contestChannel(id);
  const [{ data: scoresRaw }, { data: cheersRaw }, { data: postsRaw }, { data: peopleRaw }] = await Promise.all([
    supabase.from("contest_scores").select("id, participant_id, value, note, recorded_at").eq("contest_id", id).order("created_at", { ascending: false }),
    supabase.from("contest_cheers").select("to_user, from_user, kind").eq("contest_id", id),
    supabase.from("posts").select(POST_SELECT).eq("channel", channel).order("created_at", { ascending: false }).limit(50),
    supabase.from("profiles").select("id, full_name, avatar_url").neq("id", profile.id).order("full_name"),
  ]);

  const scores = (scoresRaw ?? []) as Score[];
  const cheers = (cheersRaw ?? []) as Cheer[];
  const posts = (postsRaw ?? []) as unknown as PostRow[];
  const people = (peopleRaw ?? []) as Person[];

  const participants = c.contest_entries ?? [];
  const keepers = c.contest_rule_keepers ?? [];
  const joined = participants.some((e) => e.user_id === profile.id);
  const ended = c.status === "ended";
  const highWins = c.scoring !== "low";
  const isKeeper = profile.is_admin || c.created_by === profile.id || keepers.some((k) => k.user_id === profile.id);
  const keeperIds = new Set(keepers.map((k) => k.user_id));

  // Best score per participant (direction-aware).
  const bestByUser = new Map<string, number>();
  for (const s of scores) {
    const cur = bestByUser.get(s.participant_id);
    if (cur == null || (highWins ? s.value > cur : s.value < cur)) bestByUser.set(s.participant_id, s.value);
  }

  const unit = c.unit ? ` ${c.unit}` : "";
  const fmt = (v: number) => `${v}${unit}`;

  // Leaderboard: scored participants ranked, then unscored.
  const ranked = participants
    .filter((p) => bestByUser.has(p.user_id))
    .sort((a, b) => (highWins ? bestByUser.get(b.user_id)! - bestByUser.get(a.user_id)! : bestByUser.get(a.user_id)! - bestByUser.get(b.user_id)!));
  const unscored = participants.filter((p) => !bestByUser.has(p.user_id));

  // Cheers per recipient: counts + whether I gave it.
  const cheerFor = (userId: string, kind: string) => {
    const all = cheers.filter((x) => x.to_user === userId && x.kind === kind);
    return { count: all.length, mine: all.some((x) => x.from_user === profile.id) };
  };

  function CheerBar({ userId }: { userId: string }) {
    if (userId === profile.id) return null;
    return (
      <div className="flex flex-wrap gap-1.5">
        {CHEERS.map((ch) => {
          const { count, mine } = cheerFor(userId, ch.kind);
          return (
            <form key={ch.kind} action={toggleCheer}>
              <input type="hidden" name="contest_id" value={c.id} />
              <input type="hidden" name="to_user" value={userId} />
              <input type="hidden" name="kind" value={ch.kind} />
              <button
                title={ch.label}
                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition ${
                  mine
                    ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300"
                    : "border-slate-200 text-slate-500 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-300"
                }`}
              >
                {ch.emoji}{count > 0 ? ` ${count}` : ""}
              </button>
            </form>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <Link href="/contests" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-ink-900 dark:hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        All contests
      </Link>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-[0_16px_40px_-10px_rgba(10,137,187,0.6)]">
        <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide">
              🏆 {ended ? "Contest ended" : "Live contest"}
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-tight">{c.title}</h1>
            <p className="mt-1 text-sm text-white/85">
              {c.metric ? `${c.metric} · ` : ""}{highWins ? "Highest" : "Lowest"} {c.unit || "score"} wins
              {(c.starts_at || c.ends_at) ? ` · ${c.starts_at ? format(new Date(c.starts_at + "T00:00:00"), "MMM d") : "Now"} – ${c.ends_at ? format(new Date(c.ends_at + "T00:00:00"), "MMM d") : "open-ended"}` : ""}
              {` · ${participants.length} in`}
            </p>
            {c.description && <p className="mt-3 max-w-2xl text-sm text-white/90">{c.description}</p>}
          </div>
          <div className="flex flex-col items-stretch gap-2">
            {!ended && (
              joined ? (
                <form action={leaveContest}>
                  <input type="hidden" name="contest_id" value={c.id} />
                  <button className="btn-on-brand w-full">Leave contest</button>
                </form>
              ) : (
                <form action={joinContest}>
                  <input type="hidden" name="contest_id" value={c.id} />
                  <button className="btn-on-brand w-full">Enter contest 🙌</button>
                </form>
              )
            )}
            {isKeeper && !ended && (
              <form action={setContestStatus}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="status" value="ended" />
                <button className="rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium ring-1 ring-white/25 hover:bg-white/25">End contest</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {c.prize && (
        <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/20">
          <span className="text-xl">🎁</span>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">Prize</p>
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{c.prize}</p>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: leaderboard + wall */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Leaderboard</h2>

            {isKeeper && (
              <form action={recordScore} className="mb-3 flex flex-wrap items-end gap-2 rounded-2xl bg-white p-3 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
                <input type="hidden" name="contest_id" value={c.id} />
                <div className="min-w-[8rem] flex-1">
                  <label className="label text-xs">Participant</label>
                  <select name="participant_id" required className="input h-9 py-1">
                    {participants.length === 0 && <option value="">No one has entered yet</option>}
                    {participants.map((p) => (
                      <option key={p.user_id} value={p.user_id}>{p.profile?.full_name || "Member"}</option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="label text-xs">Score{c.unit ? ` (${c.unit})` : ""}</label>
                  <input name="value" type="number" step="any" required className="input h-9 py-1" placeholder="0" />
                </div>
                <div className="min-w-[7rem] flex-1">
                  <label className="label text-xs">Note</label>
                  <input name="note" className="input h-9 py-1" placeholder="optional" />
                </div>
                <button className="btn-primary h-9 px-3 py-1 text-sm">Record</button>
              </form>
            )}

            <div className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
              {ranked.length === 0 && unscored.length === 0 && (
                <p className="p-6 text-center text-sm muted">No participants yet — enter the contest to get on the board.</p>
              )}
              {ranked.map((p, i) => {
                const me = p.user_id === profile.id;
                return (
                  <div key={p.user_id} className={`flex flex-wrap items-center gap-3 border-b border-slate-50 p-3 last:border-0 dark:border-white/5 ${me ? "bg-brand-50/60 dark:bg-brand-500/10" : ""}`}>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${["bg-gradient-to-br from-amber-300 to-yellow-500 text-white", "bg-gradient-to-br from-slate-300 to-slate-400 text-white", "bg-gradient-to-br from-amber-600 to-orange-700 text-white"][i] ?? "text-slate-400"}`}>{i + 1}</span>
                    <Avatar name={p.profile?.full_name || "Member"} src={p.profile?.avatar_url} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">{p.profile?.full_name || "Member"}{me && " (you)"}</p>
                      <p className="text-xs font-bold text-brand-600 dark:text-brand-300">{fmt(bestByUser.get(p.user_id)!)}</p>
                    </div>
                    <CheerBar userId={p.user_id} />
                  </div>
                );
              })}
              {unscored.map((p) => (
                <div key={p.user_id} className="flex items-center gap-3 border-b border-slate-50 p-3 last:border-0 dark:border-white/5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center text-sm text-slate-300">–</span>
                  <Avatar name={p.profile?.full_name || "Member"} src={p.profile?.avatar_url} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink-900 dark:text-white">{p.profile?.full_name || "Member"}</p>
                    <p className="text-xs muted">No score yet</p>
                  </div>
                  <CheerBar userId={p.user_id} />
                </div>
              ))}
            </div>

            {/* Score log (keepers can correct entries) */}
            {isKeeper && scores.length > 0 && (
              <details className="mt-3 rounded-2xl bg-white p-4 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
                <summary className="cursor-pointer text-sm font-semibold text-ink-900 dark:text-white">Score log ({scores.length})</summary>
                <div className="mt-2 space-y-1">
                  {scores.map((s) => {
                    const who = participants.find((p) => p.user_id === s.participant_id)?.profile?.full_name || "Member";
                    return (
                      <div key={s.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="min-w-0 flex-1 truncate text-ink-900 dark:text-white">{who} · <span className="font-semibold">{fmt(s.value)}</span>{s.note ? <span className="muted"> · {s.note}</span> : ""}</span>
                        <span className="text-xs muted">{format(new Date(s.recorded_at + "T00:00:00"), "MMM d")}</span>
                        <form action={deleteScore}>
                          <input type="hidden" name="id" value={s.id} />
                          <button className="text-slate-300 hover:text-red-500" title="Delete score">✕</button>
                        </form>
                      </div>
                    );
                  })}
                </div>
              </details>
            )}
          </section>

          {/* The wall */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Contest wall</h2>
            <PostFeed
              posts={posts}
              people={people}
              me={{ id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url }}
              isAdmin={profile.is_admin}
              channel={channel}
              composerPlaceholder="Cheer people on, share your attempt, talk strategy…"
              emptyText="No posts yet — be the first to hype the contest!"
            />
          </section>
        </div>

        {/* Right rail: rules + keepers */}
        <aside className="space-y-4 self-start lg:sticky lg:top-6">
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
            <h2 className="mb-2 text-sm font-bold text-ink-900 dark:text-white">Rules &amp; scoring</h2>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between gap-2"><dt className="muted">Scored on</dt><dd className="font-medium text-ink-900 dark:text-white">{c.metric || "—"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="muted">Unit</dt><dd className="font-medium text-ink-900 dark:text-white">{c.unit || "—"}</dd></div>
              <div className="flex justify-between gap-2"><dt className="muted">Winner</dt><dd className="font-medium text-ink-900 dark:text-white">{highWins ? "Highest score" : "Lowest score"}</dd></div>
            </dl>
            {c.rules ? (
              <p className="mt-3 whitespace-pre-wrap border-t border-slate-100 pt-3 text-sm text-ink-700 dark:border-white/10 dark:text-slate-300">{c.rules}</p>
            ) : (
              <p className="mt-3 border-t border-slate-100 pt-3 text-sm muted dark:border-white/10">No written rules yet.</p>
            )}
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
            <h2 className="mb-2 text-sm font-bold text-ink-900 dark:text-white">Rule keepers</h2>
            <p className="mb-3 text-xs muted">They record scores and settle the board.</p>
            <div className="space-y-2">
              {keepers.length === 0 && <p className="text-sm muted">No rule keepers assigned.</p>}
              {keepers.map((k) => (
                <div key={k.user_id} className="flex items-center gap-2">
                  <Avatar name={k.profile?.full_name || "Keeper"} src={k.profile?.avatar_url} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 dark:text-white">{k.profile?.full_name || "Keeper"}{k.user_id === c.created_by && " · host"}</span>
                  {isKeeper && k.user_id !== c.created_by && (
                    <form action={removeRuleKeeper}>
                      <input type="hidden" name="contest_id" value={c.id} />
                      <input type="hidden" name="user_id" value={k.user_id} />
                      <button className="text-slate-300 hover:text-red-500" title="Remove">✕</button>
                    </form>
                  )}
                </div>
              ))}
            </div>
            {isKeeper && (
              <form action={addRuleKeeper} className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 dark:border-white/10">
                <input type="hidden" name="contest_id" value={c.id} />
                <select name="user_id" required className="input h-9 flex-1 py-1">
                  <option value="">Add a rule keeper…</option>
                  {people.filter((pp) => !keeperIds.has(pp.id)).map((pp) => (
                    <option key={pp.id} value={pp.id}>{pp.full_name}</option>
                  ))}
                </select>
                <button className="btn-secondary h-9 px-3 py-1 text-sm">Add</button>
              </form>
            )}
          </div>

          {/* Participants */}
          <div className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
            <h2 className="mb-3 text-sm font-bold text-ink-900 dark:text-white">In the contest ({participants.length})</h2>
            <div className="flex flex-wrap gap-1.5">
              {participants.length === 0 && <p className="text-sm muted">No one yet — be the first!</p>}
              {participants.map((p) => (
                <div key={p.user_id} className="flex items-center gap-1.5 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2.5 dark:bg-white/10">
                  <Avatar name={p.profile?.full_name || "Member"} src={p.profile?.avatar_url} size="sm" />
                  <span className="text-xs font-medium text-ink-900 dark:text-white">{(p.profile?.full_name || "Member").split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
