import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PageGuide } from "@/components/PageGuide";
import { AttendanceBoard } from "@/components/AttendanceBoard";

export default async function CheckInPage() {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && !profile.is_admin) redirect("/dashboard");

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: members }, { data: classes }, { data: att }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url").eq("role", "client").order("full_name"),
    supabase
      .from("classes")
      .select("id, title, starts_at")
      .gte("starts_at", `${today}T00:00:00`)
      .lte("starts_at", `${today}T23:59:59`)
      .order("starts_at"),
    supabase.from("attendance").select("member_id, class_id, status").eq("attended_on", today),
  ]);

  return (
    <>
      <PageHeader title="Check-in" subtitle="Record who showed up, plus no-shows and cancellations. A check-in credits the member's account automatically." />
      <PageGuide
        id="check-in"
        summary="The front-desk tool for recording class attendance — including members who don't use the app."
        points={[
          "Mark each person attended, no-show, or cancelled.",
          "You can check people in on their behalf from your account.",
          "A check-in automatically credits the member and feeds their streak and points.",
        ]}
      />
      <AttendanceBoard
        today={today}
        members={(members ?? []).map((m) => ({ id: m.id, full_name: m.full_name, avatar_url: m.avatar_url }))}
        classes={(classes ?? []).map((c) => ({ id: c.id, title: c.title, starts_at: c.starts_at }))}
        attendance={(att ?? []).map((a) => ({ member_id: a.member_id, class_id: a.class_id, status: a.status }))}
      />
    </>
  );
}
