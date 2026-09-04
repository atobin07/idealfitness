import type { PostRow } from "@/components/community/PostCard";

export type FeedFilter = "all" | "post" | "poll" | "challenge" | "duel" | "partner_goal" | "activity";

export const FEED_FILTERS: { value: FeedFilter; label: string; emoji: string }[] = [
  { value: "all", label: "All", emoji: "🗂️" },
  { value: "post", label: "Posts", emoji: "📝" },
  { value: "poll", label: "Polls", emoji: "📊" },
  { value: "challenge", label: "Challenges", emoji: "🏆" },
  { value: "duel", label: "Duels", emoji: "⚔️" },
  { value: "partner_goal", label: "Goals", emoji: "🤝" },
  { value: "activity", label: "Activity", emoji: "📍" },
];

export type PollData = {
  id: string;
  question: string;
  description: string | null;
  status: string;
  allow_multiple: boolean;
  options: { id: string; label: string; sort: number }[];
  votes: { option_id: string; user_id: string }[];
};

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

export type DuelData = {
  id: string;
  metric: string;
  starts_at: string;
  ends_at: string;
  status: string;
  winner_id: string | null;
  challenger: { id: string; full_name: string } | null;
  opponent: { id: string; full_name: string } | null;
  scores: { challenger_score: number; opponent_score: number } | null;
};

export type PartnerGoalData = {
  id: string;
  title: string;
  metric: string;
  target: number;
  ends_at: string;
  status: string;
  members: { user_id: string; full_name: string }[];
  progress: number;
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
  | { kind: "poll"; id: string; ts: string; poll: PollData }
  | { kind: "challenge"; id: string; ts: string; challenge: ChallengeData }
  | { kind: "duel"; id: string; ts: string; duel: DuelData }
  | { kind: "partner_goal"; id: string; ts: string; goal: PartnerGoalData }
  | { kind: "activity"; id: string; ts: string; activity: ActivityData };
