import { redirect } from "next/navigation";

// Folded into the /feed page's unified feed, filtered to partner goals.
export default function PartnerGoalsPage() {
  redirect("/feed?filter=partner_goal");
}
