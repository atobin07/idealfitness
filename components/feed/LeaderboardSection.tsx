import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import type { Profile } from "@/lib/database.types";

const BADGE_EMOJI: Record<string, string> = {
  flag: "🚩", calendar: "📅", fire: "🔥", dumbbell: "🏋️", bolt: "⚡", star: "⭐", trophy: "🏆",
};

function levelProgress(points: number) {
  const into = points % 500;
  return Math.round((into / 500) * 100);
}

export async function LeaderboardSection({ profile }: { profile: Profile }) {
  const supabase = await createClient();

  const [{ data: myStats }, { data: badges }, { data: myBadges }, { data: board }] = await Promise.all([
    supabase.from("member_stats").select("*").eq("user_id", profile.id).maybeSingle(),
    supabase.from("badges").select("*").order("sort"),
    supabase.from("member_badges").select("badge_id").eq("user_id", profile.id),
    supabase.from("member_stats").select("user_id, total_points, level, current_streak, profile:user_id(full_name)").order("total_points", { ascending: false }),
  ]);

  const stats = myStats ?? { total_points: 0, level: 1, current_streak: 0, longest_streak: 0, last_checkin_date: null, checkins_count: 0 };
  const earned = new Set((myBadges ?? []).map((b) => b.badge_id));
  const leaderboard = (board ?? []) as unknown as { user_id: string; total_points: number; level: number; current_streak: number; profile: { full_name: string } | null }[];
  const myRank = leaderboard.findIndex((r) => r.user_id === profile.id) + 1;

  const tiles = [
    { label: "Points", value: stats.total_points.toLocaleString(), hint: `Level ${stats.level}` },
    { label: "Current streak", value: `${stats.current_streak}🔥`, hint: `Best ${stats.longest_streak}` },
    { label: "Check-ins", value: stats.checkins_count, hint: "all time" },
    { label: "Badges", value: `${earned.size}/${(badges ?? []).length}`, hint: "earned" },
    { label: "Rank", value: myRank > 0 ? `#${myRank}` : "—", hint: "by points" },
  ];

  return (
    <div className="space-y-6">
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
    </div>
  );
}
