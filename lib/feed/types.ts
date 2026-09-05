import type { PostRow } from "@/components/community/PostCard";

export type FeedFilter = "all" | "post" | "challenge" | "activity";

export const FEED_FILTERS: { value: FeedFilter; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "🗂️" },
  { value: "post", label: "Posts", emoji: "📝" },
  { value: "challenge", label: "Challenges", emoji: "🏆" },
  { value: "activity", label: "Activity", emoji: "📍" },
];

export type ChallengeData = {
  id: string;
  title: string;
  description: string | null;
  metric: string;
  starts_at: string;
  ends_at: string;
  reward_points: number;
  participantCount: number;
  joined: boolean;
  board: { user_id: string; full_name: string; score: number }[];
};

export type ActivityData = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  created_at: string;
  full_name: string | null;
  kudosCount: number;
  kudosMine: boolean;
};

export type FeedItem =
  | { kind: "post"; id: string; ts: string; post: PostRow }
  | { kind: "challenge"; id: string; ts: string; challenge: ChallengeData }
  | { kind: "activity"; id: string; ts: string; activity: ActivityData };
