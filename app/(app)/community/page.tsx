import { redirect } from "next/navigation";

// The community feed now lives on the main dashboard page. Its sub-pages
// (leaderboard, challenges, duels, partner goals) remain their own routes.
export default function CommunityPage() {
  redirect("/dashboard");
}
