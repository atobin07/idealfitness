import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { GymSettingsForm } from "@/components/GymSettingsForm";
import type { GymSettings } from "@/lib/database.types";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data } = await supabase.from("gym_settings").select("*").eq("id", true).maybeSingle();
  const settings = data as GymSettings | null;

  return (
    <>
      <Link href="/admin" className="mb-4 inline-block text-sm muted hover:underline">← Admin console</Link>
      <PageHeader title="Gym settings" subtitle="Your gym's identity and booking rules." />
      <div className="card max-w-3xl p-6">
        {settings ? (
          <GymSettingsForm settings={settings} />
        ) : (
          <p className="muted">Gym settings not found.</p>
        )}
      </div>
    </>
  );
}
