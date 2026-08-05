import { requireProfile } from "@/lib/auth";
import { TabHub, type HubTab } from "@/components/TabHub";
import { FeedSection } from "@/components/hub/FeedSection";
import { PollsSection } from "@/components/feed/PollsSection";
import { LeaderboardSection } from "@/components/feed/LeaderboardSection";
import { ChallengesFeedSection } from "@/components/feed/ChallengesFeedSection";
import { DuelsSection } from "@/components/feed/DuelsSection";
import { PartnerGoalsSection } from "@/components/feed/PartnerGoalsSection";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const profile = await requireProfile();

  const tabs: HubTab[] = [
    { key: "feed", label: "Feed", content: <FeedSection profile={profile} /> },
    { key: "polls", label: "Polls", content: <PollsSection profile={profile} /> },
    { key: "leaderboard", label: "Leaderboard", content: <LeaderboardSection profile={profile} /> },
    { key: "challenges", label: "Challenges", content: <ChallengesFeedSection profile={profile} /> },
    { key: "duels", label: "Duels", content: <DuelsSection profile={profile} /> },
    { key: "goals", label: "Partner goals", content: <PartnerGoalsSection profile={profile} /> },
  ];

  return (
    <TabHub
      tabs={tabs}
      initial={tab ?? "feed"}
      basePath="/feed"
      title="Community"
      subtitle="Share wins, climb the board, and take on challenges, duels and partner goals."
    />
  );
}
