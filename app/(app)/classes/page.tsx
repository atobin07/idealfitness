import { redirect } from "next/navigation";

// Classes now lead the main dashboard page.
export default function ClassesPage() {
  redirect("/dashboard");
}
