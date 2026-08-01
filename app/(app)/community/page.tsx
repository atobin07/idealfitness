import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { CheckInCard } from "@/components/community/CheckInCard";
import { PostFeed, POST_SELECT, type PostRow } from "@/components/community/PostFeed";

export default async function FeedPage() {
  const profile = await requireProfile();
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
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Community</h1>
      <p className="mb-4 text-sm text-slate-500">Your gym feed — share wins, hype each other up, and stay connected outside the gym.</p>
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
        <aside className="hidden space-y-4 lg:block">
          <CheckInCard checkedInToday={checkedInToday} streak={stats.current_streak} />
          <div className="card-brand p-4">
            <p className="text-xs uppercase tracking-wide text-white/70">Your points</p>
            <p className="text-2xl font-bold text-white">{stats.total_points.toLocaleString()}</p>
            <p className="text-xs text-white/70">Level {stats.level} · {stats.current_streak}🔥 streak</p>
          </div>
          <div className="card p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink-900 dark:text-white">Top members</h2>
              <Link href="/community/leaderboard" className="text-xs font-medium text-brand-600 hover:text-brand-700">Full board →</Link>
            </div>
            <div className="space-y-1">
              {leaders.map((r, i) => (
                <div key={r.user_id} className="flex items-center gap-2">
                  <span className="w-4 text-center text-xs font-bold text-brand-600 dark:text-brand-300">{i + 1}</span>
                  <Avatar name={r.profile?.full_name || "Member"} src={r.profile?.avatar_url} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-sm text-ink-900 dark:text-white">{r.profile?.full_name || "Member"}</span>
                  <span className="text-xs font-semibold muted">{r.total_points.toLocaleString()}</span>
                </div>
              ))}
              {leaders.length === 0 && <p className="text-sm muted">No members ranked yet.</p>}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
