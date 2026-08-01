import { Avatar } from "@/components/Avatar";
import { PostComposer } from "@/components/community/PostComposer";
import { CommentBox } from "@/components/community/CommentBox";
import { toggleLike, toggleCommentLike, deletePost, deleteComment } from "@/app/(app)/community/actions";
import { relativeTime } from "@/lib/format";

export type Person = { id: string; full_name: string; avatar_url: string | null };
type Tag = { tagged_user_id: string; tagged: { full_name: string } | null };
type CommentRow = {
  id: string; author_id: string; body: string; created_at: string;
  author: Person | null;
  comment_likes: { user_id: string }[];
};
export type PostRow = {
  id: string; author_id: string; kind: string; body: string | null; image_url: string | null; created_at: string;
  author: Person | null;
  post_tags: Tag[];
  post_likes: { user_id: string }[];
  post_comments: CommentRow[];
};

export const POST_SELECT =
  "*, author:author_id(id, full_name, avatar_url), post_tags(tagged_user_id, tagged:tagged_user_id(full_name)), post_likes(user_id), post_comments(id, author_id, body, created_at, author:author_id(id, full_name, avatar_url), comment_likes(user_id))";

const KIND_STYLE: Record<string, { emoji: string; label: string; ring: string; chip: string }> = {
  announcement: { emoji: "📢", label: "Announcement", ring: "border-l-4 border-l-amber-500 bg-amber-50/40 dark:bg-amber-500/5", chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200" },
  shoutout: { emoji: "📣", label: "Shoutout", ring: "border-l-4 border-l-violet-500", chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" },
  congrats: { emoji: "🎉", label: "Congrats", ring: "border-l-4 border-l-amber-500", chip: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  thank_you: { emoji: "🙏", label: "Thank you", ring: "border-l-4 border-l-emerald-500", chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  milestone: { emoji: "🏅", label: "Milestone", ring: "border-l-4 border-l-brand-500", chip: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" },
};

export function PostFeed({
  posts,
  people,
  me,
  channel = "feed",
  isAdmin = false,
  pinAnnouncements = false,
  emptyText = "No posts yet. Be the first to share something!",
  composerVariant = "full",
  composerPlaceholder,
}: {
  posts: PostRow[];
  people: Person[];
  me: { id: string; full_name: string; avatar_url: string | null };
  channel?: string;
  isAdmin?: boolean;
  pinAnnouncements?: boolean;
  emptyText?: string;
  composerVariant?: "full" | "simple";
  composerPlaceholder?: string;
}) {
  const now = Date.now();
  const isPinned = (p: PostRow) => pinAnnouncements && p.kind === "announcement" && now - new Date(p.created_at).getTime() < 21 * 86_400_000;
  const ordered = [...posts.filter(isPinned), ...posts.filter((p) => !isPinned(p))];

  return (
    <div className="space-y-4">
      <PostComposer people={people} myId={me.id} myName={me.full_name} myAvatar={me.avatar_url} isAdmin={isAdmin} channel={channel} variant={composerVariant} placeholder={composerPlaceholder} />

      {posts.length === 0 && <div className="card p-10 text-center muted">{emptyText}</div>}

      {ordered.map((p) => {
        const style = KIND_STYLE[p.kind];
        const liked = p.post_likes.some((l) => l.user_id === me.id);
        const likeCount = p.post_likes.length;
        const comments = [...p.post_comments].sort((a, b) => a.created_at.localeCompare(b.created_at));
        const tags = p.post_tags.map((t) => t.tagged?.full_name).filter(Boolean) as string[];
        const mine = p.author_id === me.id;

        return (
          <div key={p.id} className={`card overflow-hidden ${style?.ring ?? ""}`}>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <Avatar name={p.author?.full_name || "Member"} src={p.author?.avatar_url} size="md" />
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
                {(mine || isAdmin) && (
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="btn-ghost p-1 text-slate-400 hover:text-red-500" aria-label="Delete post">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </form>
                )}
              </div>

              {p.body && <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-900 dark:text-white">{p.body}</p>}
            </div>

            {p.image_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={p.image_url} alt="" className="max-h-[520px] w-full object-cover" />
            )}

            <div className="flex items-center justify-between px-4 py-2 text-xs muted">
              <span>{likeCount > 0 ? `${likeCount} like${likeCount === 1 ? "" : "s"}` : ""}</span>
              <span>{comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? "" : "s"}` : ""}</span>
            </div>

            <div className="border-t border-slate-100 px-2 py-1 dark:border-white/10">
              <form action={toggleLike}>
                <input type="hidden" name="post_id" value={p.id} />
                <button className={`flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium ${liked ? "text-brand-600 dark:text-brand-300" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-white/5"}`}>
                  <svg className="h-5 w-5" fill={liked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  {liked ? "Liked" : "Like"}
                </button>
              </form>
            </div>

            <div className="space-y-3 border-t border-slate-100 px-4 py-3 dark:border-white/10">
              {comments.map((c) => {
                const cLiked = c.comment_likes.some((l) => l.user_id === me.id);
                const cCount = c.comment_likes.length;
                const cMine = c.author_id === me.id;
                return (
                  <div key={c.id} className="flex items-start gap-2">
                    <Avatar name={c.author?.full_name || "Member"} src={c.author?.avatar_url} size="sm" />
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
                        {(cMine || isAdmin) && (
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
              <CommentBox postId={p.id} myName={me.full_name} myAvatar={me.avatar_url} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
