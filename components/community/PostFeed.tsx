import { PostComposer } from "@/components/community/PostComposer";
import { PostCard, FLOAT_CARD, type PostRow } from "@/components/community/PostCard";

export type { Person, PostRow } from "@/components/community/PostCard";
export { POST_SELECT } from "@/components/community/PostCard";

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
  people: { id: string; full_name: string; avatar_url: string | null }[];
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
    <div className="space-y-5">
      <PostComposer people={people} myId={me.id} myName={me.full_name} myAvatar={me.avatar_url} isAdmin={isAdmin} channel={channel} variant={composerVariant} placeholder={composerPlaceholder} />

      {posts.length === 0 && <div className={`${FLOAT_CARD} p-10 text-center muted`}>{emptyText}</div>}

      {ordered.map((p) => (
        <PostCard key={p.id} post={p} me={me} isAdmin={isAdmin} />
      ))}
    </div>
  );
}
