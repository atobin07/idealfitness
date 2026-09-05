import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { POST_SELECT, type PostRow } from "@/components/community/PostCard";
import { UnifiedFeed } from "@/components/feed/UnifiedFeed";
import type { Profile } from "@/lib/database.types";
import type { FeedFilter, FeedItem } from "@/lib/feed/types";

type ChallengeRow = {
  id: string; title: string; description: string | null; metric: string;
  starts_at: string; ends_at: string; reward_points: number; created_at: string;
  challenge_participants: { user_id: string }[];
};
type ActivityRow = {
  id: string; user_id: string; type: string; title: string; body: string | null; created_at: string;
  profile: { full_name: string } | null;
};

export async function UnifiedFeedSection({ profile, initialFilter }: { profile: Profile; initialFilter?: FeedFilter }) {
  const supabase = await createClient();

  const [
    { data: postsRaw },
    { data: peopleRaw },
    { data: board },
    { data: challengesRaw },
    { data: activityRaw },
  ] = await Promise.all([
    supabase.from("posts").select(POST_SELECT).eq("channel", "feed").order("created_at", { ascending: false }).limit(60),
    supabase.from("profiles").select("id, full_name, avatar_url").neq("id", profile.id).order("full_name"),
    supabase.from("member_stats").select("user_id, total_points, profile:user_id(full_name, avatar_url)").order("total_points", { ascending: false }).limit(5),
    supabase.from("challenges").select("*, challenge_participants(user_id)").gte("ends_at", new Date().toISOString()).order("created_at", { ascending: false }),
    supabase.from("activity_events").select("*, profile:user_id(full_name)").order("created_at", { ascending: false }).limit(25),
  ]);

  const posts = (postsRaw ?? []) as unknown as PostRow[];
  const people = (peopleRaw ?? []) as { id: string; full_name: string; avatar_url: string | null }[];
  const leaders = (board ?? []) as unknown as { user_id: string; total_points: number; profile: { full_name: string; avatar_url: string | null } | null }[];
  const challenges = (challengesRaw ?? []) as unknown as ChallengeRow[];
  const activity = (activityRaw ?? []) as unknown as ActivityRow[];

  const [boards, kudos] = await Promise.all([
    Promise.all(
      challenges.map((c) =>
        supabase.rpc("challenge_leaderboard", { cid: c.id }).then((r) => (r.data ?? []) as { user_id: string; full_name: string; score: number }[])
      )
    ),
    (async () => {
      const ids = activity.map((a) => a.id);
      const m = new Map<string, { count: number; mine: boolean }>();
      if (ids.length === 0) return m;
      const { data } = await supabase.from("kudos").select("activity_id, user_id").in("activity_id", ids);
      for (const row of data ?? []) {
        const cur = m.get(row.activity_id) ?? { count: 0, mine: false };
        cur.count += 1;
        if (row.user_id === profile.id) cur.mine = true;
        m.set(row.activity_id, cur);
      }
      return m;
    })(),
  ]);

  const items: FeedItem[] = [
    ...posts.map((p): FeedItem => ({ kind: "post", id: p.id, ts: p.created_at, post: p })),
    ...challenges.map((c, i): FeedItem => ({
      kind: "challenge",
      id: c.id,
      ts: c.created_at,
      challenge: {
        id: c.id,
        title: c.title,
        description: c.description,
        metric: c.metric,
        starts_at: c.starts_at,
        ends_at: c.ends_at,
        reward_points: c.reward_points,
        participantCount: c.challenge_participants.length,
        joined: c.challenge_participants.some((p) => p.user_id === profile.id),
        board: boards[i],
      },
    })),
    ...activity.map((a): FeedItem => ({
      kind: "activity",
      id: a.id,
      ts: a.created_at,
      activity: {
        id: a.id,
        user_id: a.user_id,
        type: a.type,
        title: a.title,
        body: a.body,
        created_at: a.created_at,
        full_name: a.profile?.full_name ?? null,
        kudosCount: kudos.get(a.id)?.count ?? 0,
        kudosMine: kudos.get(a.id)?.mine ?? false,
      },
    })),
  ];
  items.sort((a, b) => b.ts.localeCompare(a.ts));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <UnifiedFeed
        items={items}
        people={people}
        me={{ id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url }}
        isAdmin={profile.is_admin}
        initialFilter={initialFilter}
      />

      {/* Right rail */}
      <aside className="hidden space-y-4 self-start lg:sticky lg:top-6 lg:block">
        <div className="rounded-3xl bg-white p-5 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08),0_24px_56px_-16px_rgba(15,23,42,0.34)] dark:bg-ink-800 dark:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.8)] dark:ring-1 dark:ring-white/10">
          <h2 className="mb-3 text-sm font-bold text-ink-900 dark:text-white">Top members</h2>
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
  );
}
