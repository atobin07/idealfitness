"use client";

import { useMemo, useState } from "react";
import { PostComposer } from "@/components/community/PostComposer";
import { PostCard, FLOAT_CARD, type Person } from "@/components/community/PostCard";
import { CreateChallengeDialog } from "@/components/community/CreateChallengeDialog";
import { ChallengeFeedCard } from "@/components/feed/cards/ChallengeFeedCard";
import { ActivityFeedCard } from "@/components/feed/cards/ActivityFeedCard";
import { FEED_FILTERS, type FeedFilter, type FeedItem } from "@/lib/feed/types";

export function UnifiedFeed({
  items,
  people,
  me,
  isAdmin,
  initialFilter = "all",
}: {
  items: FeedItem[];
  people: Person[];
  me: { id: string; full_name: string; avatar_url: string | null };
  isAdmin: boolean;
  initialFilter?: FeedFilter;
}) {
  const [filter, setFilter] = useState<FeedFilter>(initialFilter);

  function select(value: FeedFilter) {
    setFilter(value);
    // Keep the address bar in sync for refresh/share/deep-links, without a
    // Next.js navigation (no re-render, no scroll reset).
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", value === "all" ? "/feed" : `/feed?filter=${value}`);
    }
  }

  const counts = useMemo(() => {
    const c = new Map<FeedFilter, number>();
    for (const item of items) c.set(item.kind, (c.get(item.kind) ?? 0) + 1);
    return c;
  }, [items]);

  const filtered = filter === "all" ? items : items.filter((i) => i.kind === filter);

  return (
    <div className="space-y-5">
      <PostComposer people={people} myId={me.id} myName={me.full_name} myAvatar={me.avatar_url} isAdmin={isAdmin} channel="feed" />

      <div className="flex flex-wrap gap-2">
        <CreateChallengeDialog />
      </div>

      <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {FEED_FILTERS.map((f) => {
          const count = f.value === "all" ? items.length : counts.get(f.value) ?? 0;
          if (f.value !== "all" && count === 0) return null;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => select(f.value)}
              aria-pressed={active}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-white/10 dark:text-slate-300 dark:hover:bg-white/15"
              }`}
            >
              {f.emoji} {f.label}
              {count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && <div className={`${FLOAT_CARD} p-10 text-center muted`}>Nothing here yet.</div>}

      {filtered.map((item) => {
        switch (item.kind) {
          case "post":
            return <PostCard key={item.id} post={item.post} me={me} isAdmin={isAdmin} />;
          case "challenge":
            return <ChallengeFeedCard key={item.id} challenge={item.challenge} myId={me.id} />;
          case "activity":
            return <ActivityFeedCard key={item.id} activity={item.activity} myId={me.id} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
