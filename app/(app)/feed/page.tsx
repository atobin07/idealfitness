import { requireProfile } from "@/lib/auth";
import { TabHub, type HubTab } from "@/components/TabHub";
import { UnifiedFeedSection } from "@/components/feed/UnifiedFeedSection";
import { LeaderboardSection } from "@/components/feed/LeaderboardSection";
import type { FeedFilter } from "@/lib/feed/types";

const VALID_FILTERS: FeedFilter[] = ["all", "post", "poll", "challenge", "duel", "partner_goal", "activity"];
function asFilter(v: string | undefined): FeedFilter | undefined {
  return VALID_FILTERS.includes(v as FeedFilter) ? (v as FeedFilter) : undefined;
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string }>;
}) {
  const { tab, filter } = await searchParams;
  const profile = await requireProfile();

  const tabs: HubTab[] = [
    { key: "feed", label: "Feed", content: <UnifiedFeedSection profile={profile} initialFilter={asFilter(filter)} /> },
    { key: "leaderboard", label: "Leaderboard", content: <LeaderboardSection profile={profile} /> },
  ];

  return (
    <TabHub
      tabs={tabs}
      initial={tab ?? "feed"}
      basePath="/feed"
      title="Community"
      subtitle="One feed for posts, polls, challenges, duels and partner goals — filter to find what matters."
    />
  );
}
