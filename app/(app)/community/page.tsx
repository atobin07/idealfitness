import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { PostComposer } from "@/components/community/PostComposer";
import { CommentBox } from "@/components/community/CommentBox";
import { CheckInCard } from "@/components/community/CheckInCard";
import { toggleLike, toggleCommentLike, deletePost, deleteComment } from "@/app/(app)/community/actions";
import { relativeTime } from "@/lib/format";

type Tag = { tagged_user_id: string; tagged: { full_name: string } | null };
type CommentRow = {
  id: string; author_id: string; body: string; created_at: string;
  author: { id: string; full_name: string } | null;
  comment_likes: { user_id: string }[];
};
type PostRow = {
  id: string; author_id: string; kind: string; body: string | null; image_url: string | null; created_at: string;
  author: { id: string; full_name: string } | null;
  post_tags: Tag[];
  post_likes: { user_id: string }[];
  post_comments: CommentRow[];
};

const KIND_STYLE: Record<string, { emoji: string; label: string; ring: string; chip: string }> = {
  shoutout: { emoji: "📣", label: "Shoutout", ring: "border-l-4 border-l-violet-500", chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  congrats: { emoji: "🎉", label: "Congrats", ring: "border-l-4 border-l-amber-500", chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  thank_you: { emoji: "🙏", label: "Thank you", ring: "border-l-4 border-l-emerald-500", chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  milestone: { emoji: "🏅", label: "Milestone", ring: "border-l-4 border-l-brand-500", chip: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" },
};

export default async function FeedPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: postsRaw }, { data: peopleRaw }, { data: myStats }, { data: board }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "*, author:author_id(id, full_name), post_tags(tagged_user_id, tagged:tagged_user_id(full_name)), post_likes(user_id), post_comments(id, author_id, body, created_at, author:author_id(id, full_name), comment_likes(user_id))"
      )
      .order("created_at", { ascending: false })
      .limit(40),
    supabase.from("profiles").select("id, full_name").neq("id", profile.id).order("full_name"),
    supabase.from("member_stats").select("total_points, level, current_streak, last_checkin_date").eq("user_id", profile.id).maybeSingle(),
    supabase.from("member_stats").select("user_id, total_points, profile:user_id(full_name)").order("total_points", { ascending: false }).limit(5),
  ]);

  const posts = (postsRaw ?? []) as unknown as PostRow[];
  const people = (peopleRaw ?? []) as { id: string; full_name: string }[];
  const stats = myStats ?? { total_points: 0, level: 1, current_streak: 0, last_checkin_date: null };
  const leaders = (board ?? []) as unknown as { user_id: string; total_points: number; profile: { full_name: string } | null }[];
  const checkedInToday = stats.last_checkin_date === new Date().toISOString().slice(0, 10);

  return (
    <>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Community</h1>
      <p className="mb-4 text-sm text-slate-500">Your gym feed — share wins, hype each other up, and stay connected outside the gym.</p>
      <CommunityTabs />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Feed column */}
        <div className="space-y-4">
          <PostComposer people={people} myId={profile.id} myName={profile.full_name} />

          {posts.length === 0 && <div className="card p-10 text-center muted">No posts yet. Be the first to share something!</div>}

          {posts.map((p) => {
            const style = KIND_STYLE[p.kind];
            const liked = p.post_likes.some((l) => l.user_id === profile.id);
            const likeCount = p.post_likes.length;
            const comments = [...p.post_comments].sort((a, b) => a.created_at.localeCompare(b.created_at));
            const tags = p.post_tags.map((t) => t.tagged?.full_name).filter(Boolean) as string[];
            const mine = p.author_id === profile.id;

            return (
              <div key={p.id} className={`card overflow-hidden ${style?.ring ?? ""}`}>
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <Avatar name={p.author?.full_name || "Member"} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2">
                        <span className="font-semibold text-ink-900 dark:text-white">{p.author?.full_name || "Member"}</span>
                        {style && <span className={`badge ${style.chip}`}>{style.emoji} {style.label}</span>}
                        {tags.length > 0 && (
                          <span className="text-sm muted">
                            {style ? "to" : "with"} <span className="font-medium text-ink-900 dark:text-white">{tags.join(", ")}</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs muted">{relativeTime(p.created_at)}</p>
                    </div>
                    {mine && (
                      <form action={deletePost}>
                        <input type="hidden" name="id" value={p.id} />
                        <button className="btn-ghost p-1 text-slate-400 hover:text-red-500" aria-label="Delete post">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Body */}
                  {p.body && <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900 dark:text-white">{p.body}</p>}
                </div>

                {/* Image */}
                {p.image_url && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={p.image_url} alt="" className="max-h-[520px] w-full object-cover" />
                )}

                {/* Like / comment counts */}
                <div className="flex items-center justify-between px-4 py-2 text-xs muted">
                  <span>{likeCount > 0 ? `${likeCount} like${likeCount === 1 ? "" : "s"}` : ""}</span>
                  <span>{comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : ""}</span>
                </div>

                {/* Like button */}
                <div className="border-t border-slate-100 px-2 py-1 dark:border-white/10">
                  <form action={toggleLike}>
                    <input type="hidden" name="post_id" value={p.id} />
                    <button className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium ${liked ? "text-brand-600 dark:text-brand-300" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"}`}>
                      <svg className="h-5 w-5" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      {liked ? "Liked" : "Like"}
                    </button>
                  </form>
                </div>

                {/* Comments */}
                <div className="space-y-3 border-t border-slate-100 px-4 py-3 dark:border-white/10">
                  {comments.map((c) => {
                    const cLiked = c.comment_likes.some((l) => l.user_id === profile.id);
                    const cCount = c.comment_likes.length;
                    const cMine = c.author_id === profile.id;
                    return (
                      <div key={c.id} className="flex items-start gap-2">
                        <Avatar name={c.author?.full_name || "Member"} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="inline-block rounded-2xl bg-slate-100 px-3 py-2 dark:bg-white/10">
                            <p className="text-sm font-semibold text-ink-900 dark:text-white">{c.author?.full_name || "Member"}</p>
                            <p className="text-sm text-ink-900 dark:text-white">{c.body}</p>
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 pl-1 text-xs muted">
                            <form action={toggleCommentLike}>
                              <input type="hidden" name="comment_id" value={c.id} />
                              <button className={`font-medium ${cLiked ? "text-brand-600 dark:text-brand-300" : "hover:text-ink-900 dark:hover:text-white"}`}>
                                Like{cCount > 0 ? ` · ${cCount}` : ""}
                              </button>
                            </form>
                            <span>{relativeTime(c.created_at)}</span>
                            {cMine && (
                              <form action={deleteComment}>
                                <input type="hidden" name="id" value={c.id} />
                                <button className="hover:text-red-500">Delete</button>
                              </form>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <CommentBox postId={p.id} myName={profile.full_name} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right rail */}
        <aside className="hidden space-y-4 lg:block">
          <CheckInCard checkedInToday={checkedInToday} streak={stats.current_streak} />
          <div className="card p-4">
            <p className="text-xs uppercase tracking-wide muted">Your points</p>
            <p className="text-2xl font-bold text-ink-900 dark:text-white">{stats.total_points.toLocaleString()}</p>
            <p className="text-xs muted">Level {stats.level} · {stats.current_streak}🔥 streak</p>
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
                  <Avatar name={r.profile?.full_name || "Member"} size="sm" />
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
