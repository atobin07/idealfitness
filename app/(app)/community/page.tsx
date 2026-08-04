import { redirect } from "next/navigation";

// The community feed now lives on the dedicated /feed page.
export default function CommunityPage() {
  redirect("/feed");
}
