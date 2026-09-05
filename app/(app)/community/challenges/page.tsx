import { redirect } from "next/navigation";

// Folded into the /feed page's unified feed, filtered to challenges.
// Individual challenge walls remain their own pages at /community/challenges/[id].
export default function ChallengesPage() {
  redirect("/feed?filter=challenge");
}
