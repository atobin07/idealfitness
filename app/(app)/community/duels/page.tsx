import { redirect } from "next/navigation";

// Folded into the /feed page's unified feed, filtered to duels.
export default function DuelsPage() {
  redirect("/feed?filter=duel");
}
