import { redirect } from "next/navigation";

// Folded into the /feed page's Duels tab.
export default function DuelsPage() {
  redirect("/feed?tab=duels");
}
