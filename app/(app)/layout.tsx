import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import type { Notification } from "@/lib/database.types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ count: unread }, { data: notifications }] = await Promise.all([
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", profile.id)
      .is("read_at", null),
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <AppShell
      role={profile.role}
      name={profile.full_name || "You"}
      userId={profile.id}
      unread={unread ?? 0}
      isAdmin={profile.is_admin}
      notifications={(notifications ?? []) as Notification[]}
    >
      {children}
    </AppShell>
  );
}
