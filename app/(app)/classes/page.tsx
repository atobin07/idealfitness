import { redirect } from "next/navigation";

// Class booking now lives on the calendar.
export default function ClassesPage() {
  redirect("/calendar");
}
