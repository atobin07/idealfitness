import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PageGuide } from "@/components/PageGuide";
import { formatMoney } from "@/lib/money";
import type { GymSettings } from "@/lib/database.types";

function Stat({ label, value }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="card-brand p-5">
      <p className="text-sm text-white/75">{label}</p>
      <p className="stat-value mt-1">{value}</p>
    </div>
  );
}

function Tile({ href, title, desc, icon }: { href: string; title: string; desc: string; icon: string }) {
  return (
    <Link href={href} className="card flex items-start gap-4 p-5 transition hover:shadow-md hover:ring-1 hover:ring-brand-200 dark:hover:ring-brand-500/30">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
          <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-ink-900 dark:text-white">{title}</p>
        <p className="text-sm muted">{desc}</p>
      </div>
    </Link>
  );
}

export default async function AdminOverviewPage() {
  await requireAdmin();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    { data: gym },
    { count: clients },
    { count: trainers },
    { data: invoices },
    { count: upcomingSessions },
    { count: completedThisMonth },
    { count: activePackages },
    { count: upcomingClasses },
  ] = await Promise.all([
    supabase.from("gym_settings").select("*").eq("id", true).maybeSingle(),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "client"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "trainer"),
    supabase.from("invoices").select("amount_cents, status"),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "scheduled").gte("starts_at", nowIso),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("status", "completed").gte("starts_at", monthStart.toISOString()),
    supabase.from("client_packages").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("classes").select("id", { count: "exact", head: true }).gte("starts_at", nowIso),
  ]);

  const inv = (invoices ?? []) as { amount_cents: number; status: string }[];
  const revenue = inv.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount_cents, 0);
  const outstanding = inv.filter((i) => i.status === "due").reduce((s, i) => s + i.amount_cents, 0);
  const settings = gym as GymSettings | null;

  return (
    <>
      <PageHeader
        title="Admin console"
        subtitle={`${settings?.name ?? "Your gym"} — gym-wide management and controls.`}
      />
      <PageGuide
        id="admin"
        summary="The owner's control center — the big-picture view across the whole gym."
        points={[
          "Jump to roster, roles and gym-wide settings.",
          "Oversee everything across all coaches and members.",
          "Owner/admin only — members never see this.",
        ]}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Members" value={clients ?? 0} />
        <Stat label="Coaches" value={trainers ?? 0} />
        <Stat label="Revenue (paid)" value={formatMoney(revenue)} tone="text-brand-600 dark:text-brand-400" />
        <Stat label="Outstanding" value={formatMoney(outstanding)} />
        <Stat label="Upcoming sessions" value={upcomingSessions ?? 0} />
        <Stat label="Completed this month" value={completedThisMonth ?? 0} />
        <Stat label="Active packages" value={activePackages ?? 0} />
        <Stat label="Upcoming classes" value={upcomingClasses ?? 0} />
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold text-ink-900 dark:text-white">Manage</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile href="/admin/people" title="People & roster" desc="Members, coaches, roles, and client assignments." icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a3 3 0 10-2.5-1.35" />
        <Tile href="/admin/settings" title="Gym settings" desc="Name, branding, contact, booking rules." icon="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <Tile href="/analytics" title="Analytics" desc="Revenue trends, sessions, and attendance." icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        <Tile href="/billing" title="Billing & packages" desc="Pricing, invoices, and client credits." icon="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        <Tile href="/dashboard" title="Classes" desc="Schedule and manage group sessions." icon="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z" />
        <Tile href="/announcements" title="Announcements" desc="Post gym-wide news to everyone." icon="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4 4 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </div>
    </>
  );
}
