import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import type { SearchItem } from "@/components/GlobalSearch";
import type { Notification } from "@/lib/database.types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";

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

  // Build the command-palette search index.
  const pages: SearchItem[] = [
    { label: "Dashboard", href: "/dashboard", group: "Page" },
    { label: "Calendar", href: "/calendar", group: "Page" },
    { label: "Classes", href: "/classes", group: "Page" },
    { label: "Workouts", href: "/workouts", group: "Page" },
    { label: "Progress & goals", href: "/progress", group: "Page" },
    { label: "Messages", href: "/messages", group: "Page" },
    { label: "Billing", href: "/billing", group: "Page" },
    { label: "Announcements", href: "/announcements", group: "Page" },
    { label: "Settings", href: "/settings", group: "Page" },
    ...(isTrainer
      ? [
          { label: "Exercise library", href: "/exercises", group: "Page" as const },
          { label: "Analytics", href: "/analytics", group: "Page" as const },
        ]
      : []),
    ...(profile.is_admin
      ? [
          { label: "Admin console", href: "/admin", group: "Admin" as const },
          { label: "People & roster", href: "/admin/people", group: "Admin" as const },
          { label: "Gym settings", href: "/admin/settings", group: "Admin" as const },
        ]
      : []),
  ];

  const searchItems: SearchItem[] = [...pages];

  if (isTrainer) {
    const { data: links } = await supabase
      .from("trainer_clients")
      .select("client:client_id(id, full_name, email)")
      .eq("trainer_id", profile.id);
    for (const l of links ?? []) {
      const c = l.client as unknown as { id: string; full_name: string; email: string | null };
      if (c?.id)
        searchItems.push({ label: c.full_name || "Client", sublabel: c.email ?? undefined, href: `/clients/${c.id}`, group: "Client" });
    }
  }

  const { data: classes } = await supabase
    .from("classes")
    .select("id, title, starts_at")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at")
    .limit(10);
  for (const c of classes ?? []) {
    searchItems.push({ label: c.title, href: "/classes", group: "Class" });
  }

  return (
    <AppShell
      role={profile.role}
      name={profile.full_name || "You"}
      userId={profile.id}
      unread={unread ?? 0}
      isAdmin={profile.is_admin}
      notifications={(notifications ?? []) as Notification[]}
      searchItems={searchItems}
    >
      {children}
    </AppShell>
  );
}
