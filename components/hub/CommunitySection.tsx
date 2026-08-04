import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { CheckInCard } from "@/components/community/CheckInCard";
import { PostFeed, POST_SELECT, type PostRow } from "@/components/community/PostFeed";
import type { Profile } from "@/lib/database.types";

export async function CommunitySection({ profile }: { profile: Profile }) {
  const supabase = await createClient();

  const [{ data: postsRaw }, { data: peopleRaw }, { data: myStats }, { data: board }] = await Promise.all([
    supabase.from("posts").select(POST_SELECT).eq("channel", "feed").order("created_at", { ascending: false }).limit(40),
    supabase.from("profiles").select("id, full_name").neq("id", profile.id).order("full_name"),
    supabase.from("member_stats").select("total_points, level, current_streak, last_checkin_date").eq("user_id", profile.id).maybeSingle(),
    supabase.from("member_stats").select("user_id, total_points, profile:user_id(full_name, avatar_url)").order("total_points", { ascending: false }).limit(5),
  ]);

  const posts = (postsRaw ?? []) as unknown as PostRow[];
  const people = (peopleRaw ?? []) as { id: string; full_name: string; avatar_url: string | null }[];
  const stats = myStats ?? { total_points: 0, level: 1, current_streak: 0, last_checkin_date: null };
  const leaders = (board ?? []) as unknown as { user_id: string; total_points: number; profile: { full_name: string; avatar_url: string | null } | null }[];
  const checkedInToday = stats.last_checkin_date === new Date().toISOString().slice(0, 10);

  return (
    <>
      <p className="mb-4 text-sm muted">Your gym feed — share wins, hype each other up, and stay connected outside the gym.</p>
      <CommunityTabs />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Feed column */}
        <PostFeed
          posts={posts}
          people={people}
          me={{ id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url }}
          isAdmin={profile.is_admin}
          channel="feed"
          pinAnnouncements
        />

        {/* Right rail */}
        <aside className="hidden space-y-4 self-start lg:sticky lg:top-6 lg:block">
          <CheckInCard checkedInToday={checkedInToday} streak={stats.current_streak} />
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 p-5 text-white shadow-[0_16px_40px_-10px_rgba(10,137,187,0.6)]">
            <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/70">Your points</p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">{stats.total_points.toLocaleString()}</p>
            <p className="mt-0.5 text-xs font-medium text-white/80">Level {stats.level} · {stats.current_streak}🔥 streak</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08),0_24px_56px_-16px_rgba(15,23,42,0.34)] dark:bg-ink-800 dark:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.8)] dark:ring-1 dark:ring-white/10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-ink-900 dark:text-white">Top members</h2>
              <Link href="/community/leaderboard" className="text-xs font-semibold text-brand-600 hover:text-brand-700">Full board →</Link>
            </div>
            <div className="space-y-1">
              {leaders.map((r, i) => {
                const medal = ["bg-gradient-to-br from-amber-300 to-yellow-500 text-white shadow-sm", "bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm", "bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-sm"][i] ?? "text-slate-400";
                return (
                <div key={r.user_id} className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${medal}`}>{i + 1}</span>
                  <Avatar name={r.profile?.full_name || "Member"} src={r.profile?.avatar_url} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-900 dark:text-white">{r.profile?.full_name || "Member"}</span>
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-300">{r.total_points.toLocaleString()}</span>
                </div>
                );
              })}
              {leaders.length === 0 && <p className="text-sm muted">No members ranked yet.</p>}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
