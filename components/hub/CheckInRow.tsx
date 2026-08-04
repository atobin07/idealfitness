import { createClient } from "@/lib/supabase/server";
import { CheckInCard } from "@/components/community/CheckInCard";
import { dayLabel } from "@/lib/format";
import type { Profile } from "@/lib/database.types";

/** "Checking up" row: daily check-in, your points/streak, and your next class. */
export async function CheckInRow({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [{ data: myStats }, { data: nextClass }] = await Promise.all([
    supabase
      .from("member_stats")
      .select("total_points, level, current_streak, last_checkin_date")
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase.from("classes").select("title, starts_at").gte("starts_at", nowIso).order("starts_at").limit(1).maybeSingle(),
  ]);

  const stats = myStats ?? { total_points: 0, level: 1, current_streak: 0, last_checkin_date: null };
  const checkedInToday = stats.last_checkin_date === new Date().toISOString().slice(0, 10);
  const isTrainer = profile.role === "trainer";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <CheckInCard checkedInToday={checkedInToday} streak={stats.current_streak} />

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 p-5 text-white shadow-[0_16px_40px_-10px_rgba(10,137,187,0.6)]">
        <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Your points</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight">{stats.total_points.toLocaleString()}</p>
        <p className="mt-0.5 text-xs font-medium text-white/80">Level {stats.level} · {stats.current_streak}🔥 streak</p>
      </div>

      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-[0_16px_40px_-10px_rgba(10,137,187,0.6)]">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Next class</p>
        {nextClass ? (
          <>
            <p className="mt-1 text-lg font-bold leading-tight">{nextClass.title}</p>
            <p className="text-sm text-white/80">{dayLabel(new Date(nextClass.starts_at))}</p>
          </>
        ) : (
          <p className="mt-1 text-sm text-white/80">No classes on the schedule yet.</p>
        )}
        <a href="#classes" className="mt-3 inline-block rounded-lg bg-white/20 px-3 py-1.5 text-sm font-medium hover:bg-white/30">
          {isTrainer ? "Manage classes" : "See the schedule"}
        </a>
      </div>
    </div>
  );
}
