import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { BroadcastForm } from "@/components/BroadcastForm";

export default async function BroadcastPage() {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && !profile.is_admin) notFound();
  const supabase = await createClient();

  const nowIso = new Date().toISOString();
  const in14 = new Date(Date.now() + 14 * 86_400_000).toISOString();

  const [{ count: clientCount }, { data: classRaw }] = await Promise.all([
    supabase.from("trainer_clients").select("id", { count: "exact", head: true }).eq("trainer_id", profile.id).eq("status", "active"),
    supabase
      .from("classes")
      .select("id, title, starts_at, class_bookings(status)")
      .gte("starts_at", nowIso)
      .lt("starts_at", in14)
      .order("starts_at", { ascending: true }),
  ]);

  const classes = (classRaw ?? []).map((c: any) => ({
    id: c.id as string,
    label: `${c.title} · ${format(new Date(c.starts_at), "EEE MMM d, h:mm a")}`,
    booked: (c.class_bookings ?? []).filter((b: any) => b.status === "booked").length,
  }));

  return (
    <>
      <PageHeader title="Broadcast" subtitle="Message everyone at once — cancellations, promos, reminders." />
      <div className="max-w-2xl">
        <BroadcastForm clientCount={clientCount ?? 0} classes={classes} />
      </div>
    </>
  );
}
