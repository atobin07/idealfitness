import { redirect } from "next/navigation";

// Classes now live as a tab on the dashboard hub.
export default function ClassesPage() {
  redirect("/dashboard?tab=classes");
}
