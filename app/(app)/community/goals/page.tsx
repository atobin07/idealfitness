import { redirect } from "next/navigation";

// Folded into the /feed page's Partner goals tab.
export default function PartnerGoalsPage() {
  redirect("/feed?tab=goals");
}
