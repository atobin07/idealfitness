import { redirect } from "next/navigation";

// The community feed now lives as a tab on the dashboard hub. Its sub-pages
// (leaderboard, challenges, duels, partner goals) remain their own routes.
export default function CommunityPage() {
  redirect("/dashboard?tab=community");
}
