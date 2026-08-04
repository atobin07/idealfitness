import { redirect } from "next/navigation";

// Folded into the /feed page's Leaderboard tab.
export default function LeaderboardPage() {
  redirect("/feed?tab=leaderboard");
}
