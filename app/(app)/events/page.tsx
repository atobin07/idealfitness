import { redirect } from "next/navigation";

// Events now live as a tab on the dashboard hub.
export default function EventsPage() {
  redirect("/dashboard?tab=events");
}
