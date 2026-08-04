import { redirect } from "next/navigation";

// Folded into the /feed page's Challenges tab. Individual challenge walls
// remain their own pages at /community/challenges/[id].
export default function ChallengesPage() {
  redirect("/feed?tab=challenges");
}
