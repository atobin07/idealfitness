import { redirect } from "next/navigation";

// Hot Topic now lives as a tab on the dashboard hub.
export default function TopicPage() {
  redirect("/dashboard?tab=topic");
}
