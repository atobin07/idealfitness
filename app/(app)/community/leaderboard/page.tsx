import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { CheckInCard } from "@/components/community/CheckInCard";
import { giveKudos } from "@/app/(app)/community/actions";
import { relativeTime } from "@/lib/format";

const BADGE_EMOJI: Record<string, string> = {
  flag: "🚩", calendar: "📅", fire: "🔥", dumbbell: "🏋️", bolt: "⚡", star: "⭐", trophy: "🏆",
};

const ACTIVITY_EMOJI: Record<string, string> = {
  checkin: "📍", session: "💪", workout: "🏋️", badge: "🏅", duel: "⚔️", challenge: "🏆", event: "📅",
};

function levelProgress(points: number) {
  const into = points % 500;
  return Math.round((into / 500) * 100);
}

export default async function CommunityPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: myStats }, { data: badges }, { data: myBadges }, { data: board }, { data: feedRaw }] = await Promise.all([
    supabase.from("member_stats").select("*").eq("user_id", profile.id).maybeSingle(),
    supabase.from("badges").select("*").order("sort"),
    supabase.from("member_badges").select("badge_id").eq("user_id", profile.id),
    supabase.from("member_stats").select("user_id, total_points, level, current_streak, profile:user_id(full_name)").order("total_points", { ascending: false }),
    supabase.from("activity_events").select("*, profile:user_id(full_name)").order("created_at", { ascending: false }).limit(25),
  ]);

  const stats = myStats ?? { total_points: 0, level: 1, current_streak: 0, longest_streak: 0, last_checkin_date: null, checkins_count: 0 };
  const earned = new Set((myBadges ?? []).map((b) => b.badge_id));
  const leaderboard = (board ?? []) as unknown as { user_id: string; total_points: number; level: number; current_streak: number; profile: { full_name: string } | null }[];
  const myRank = leaderboard.findIndex((r) => r.user_id === profile.id) + 1;
  const checkedInToday = stats.last_checkin_date === new Date().toISOString().slice(0, 10);

  const feed = (feedRaw ?? []) as unknown as { id: string; user_id: string; type: string; title: string; body: string | null; created_at: string; profile: { full_name: string } | null }[];
  const feedIds = feed.map((f) => f.id);
  let kudosCount = new Map<string, number>();
  const myKudos = new Set<string>();
  if (feedIds.length > 0) {
    const { data: k } = await supabase.from("kudos").select("activity_id, user_id").in("activity_id", feedIds);
    for (const row of k ?? []) {
      kudosCount.set(row.activity_id, (kudosCount.get(row.activity_id) ?? 0) + 1);
      if (row.user_id === profile.id) myKudos.add(row.activity_id);
    }
  }

  const tiles = [
    { label: "Points", value: stats.total_points.toLocaleString(), hint: `Level ${stats.level}` },
    { label: "Current streak", value: `${stats.current_streak}🔥`, hint: `Best ${stats.longest_streak}` },
    { label: "Check-ins", value: stats.checkins_count, hint: "all time" },
    { label: "Badges", value: `${earned.size}/${(badges ?? []).length}`, hint: "earned" },
    { label: "Rank", value: myRank > 0 ? `#${myRank}` : "—", hint: "by points" },
  ];

  return (
    <>
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Community</h1>
      </div>
      <p className="mb-4 text-sm text-slate-500">Check in, earn points, climb the board, and pull your crew into the gym.</p>
      <CommunityTabs />

      <div className="space-y-6">
        <CheckInCard checkedInToday={checkedInToday} streak={stats.current_streak} />

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tiles.map((t) => (
            <div key={t.label} className="card-brand p-4">
              <p className="text-xs uppercase tracking-wide text-white/70">{t.label}</p>
              <p className="mt-1 text-2xl font-bold text-white">{t.value}</p>
              <p className="text-xs text-white/70">{t.hint}</p>
            </div>
          ))}
        </div>

        {/* Level progress */}
        <div className="card p-5">
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink-900 dark:text-white">Level {stats.level}</span>
            <span className="muted">{500 - (stats.total_points % 500)} pts to level {stats.level + 1}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${levelProgress(stats.total_points)}%` }} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Leaderboard */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900 dark:text-white">Leaderboard</h2>
              <span className="text-xs muted">by points</span>
            </div>
            {leaderboard.length === 0 && <p className="text-sm muted">No members ranked yet.</p>}
            <div className="space-y-1">
              {leaderboard.slice(0, 10).map((r, i) => {
                const me = r.user_id === profile.id;
                return (
                  <div key={r.user_id} className={`flex items-center gap-3 rounded-lg px-2 py-1.5 ${me ? "bg-brand-50 dark:bg-brand-500/10" : ""}`}>
                    <span className={`w-6 text-center text-sm font-bold ${i < 3 ? "text-brand-600 dark:text-brand-300" : "muted"}`}>{i + 1}</span>
                    <Avatar name={r.profile?.full_name || "Member"} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900 dark:text-white">{r.profile?.full_name || "Member"}{me && " (you)"}</p>
                      <p className="text-xs muted">Level {r.level} · {r.current_streak}🔥</p>
                    </div>
                    <span className="text-sm font-semibold text-ink-900 dark:text-white">{r.total_points.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Badges */}
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Badges</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {(badges ?? []).map((b) => {
                const got = earned.has(b.id);
                return (
                  <div key={b.id} title={`${b.name} — ${b.description}`} className={`flex flex-col items-center rounded-xl border p-3 text-center ${got ? "border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10" : "border-slate-200 bg-slate-50 opacity-50 dark:border-white/10 dark:bg-white/5"}`}>
                    <span className={`text-2xl ${got ? "" : "grayscale"}`}>{BADGE_EMOJI[b.icon] ?? "⭐"}</span>
                    <span className="mt-1 text-[11px] font-medium leading-tight text-ink-900 dark:text-white">{b.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity feed */}
        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Activity feed</h2>
          {feed.length === 0 && <p className="text-sm muted">No activity yet. Check in to get things started.</p>}
          <div className="divide-rows">
            {feed.map((a) => {
              const mine = myKudos.has(a.id);
              const count = kudosCount.get(a.id) ?? 0;
              return (
                <div key={a.id} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 text-xl">{ACTIVITY_EMOJI[a.type] ?? "•"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-900 dark:text-white">
                      <span className="font-semibold">{a.profile?.full_name || "A member"}</span> · {a.title}
                    </p>
                    {a.body && <p className="text-sm muted">{a.body}</p>}
                    <p className="text-xs muted">{relativeTime(a.created_at)}</p>
                  </div>
                  {a.user_id !== profile.id && (
                    <form action={giveKudos}>
                      <input type="hidden" name="activity_id" value={a.id} />
                      <button className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium ${mine ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300" : "border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600 dark:border-white/10 dark:text-slate-300"}`}>
                        👏 {count > 0 ? count : ""}
                      </button>
                    </form>
                  )}
                  {a.user_id === profile.id && count > 0 && (
                    <span className="rounded-full border border-slate-200 px-3 py-1 text-xs muted dark:border-white/10">👏 {count}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
