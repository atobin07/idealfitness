import { notFound } from "next/navigation";
import { format, subMonths, startOfMonth } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PageGuide } from "@/components/PageGuide";
import { BarChart } from "@/components/BarChart";
import { formatMoney } from "@/lib/money";
import { statusLabel } from "@/lib/format";

function Stat({ label, value }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card-brand p-5">
      <p className="text-sm text-white/75">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}

export default async function AnalyticsPage() {
  const profile = await requireProfile();
  if (profile.role !== "trainer") notFound();
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const [
    { count: activeClients },
    { data: sessions },
    { data: invoices },
    { count: upcoming },
    { data: credits },
    { count: classCount },
  ] = await Promise.all([
    supabase.from("trainer_clients").select("id", { count: "exact", head: true }).eq("trainer_id", profile.id).eq("status", "active"),
    supabase.from("sessions").select("status, starts_at").eq("trainer_id", profile.id),
    supabase.from("invoices").select("amount_cents, status, paid_at").eq("trainer_id", profile.id),
    supabase.from("sessions").select("id", { count: "exact", head: true }).eq("trainer_id", profile.id).eq("status", "scheduled").gte("starts_at", nowIso),
    supabase.from("client_packages").select("sessions_total, sessions_used").eq("trainer_id", profile.id).eq("status", "active"),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("trainer_id", profile.id).gte("starts_at", nowIso),
  ]);

  const sess = (sessions ?? []) as { status: string; starts_at: string }[];
  const inv = (invoices ?? []) as { amount_cents: number; status: string; paid_at: string | null }[];

  const byStatus = ["scheduled", "completed", "cancelled", "no_show"].map((s) => ({
    label: statusLabel(s),
    value: sess.filter((x) => x.status === s).length,
  }));

  const past = sess.filter((s) => s.status !== "scheduled");
  const noShows = sess.filter((s) => s.status === "no_show").length;
  const noShowRate = past.length > 0 ? Math.round((noShows / past.length) * 100) : 0;

  const revenue = inv.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount_cents, 0);
  const outstanding = inv.filter((i) => i.status === "due").reduce((s, i) => s + i.amount_cents, 0);
  const creditsOutstanding = (credits ?? []).reduce((s, c) => s + (c.sessions_total - c.sessions_used), 0);

  // Revenue over the last 6 months (paid invoices)
  const months: { label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = startOfMonth(subMonths(new Date(), i));
    const next = startOfMonth(subMonths(new Date(), i - 1));
    const total = inv
      .filter((x) => x.status === "paid" && x.paid_at && new Date(x.paid_at) >= m && new Date(x.paid_at) < next)
      .reduce((s, x) => s + x.amount_cents, 0);
    months.push({ label: format(m, "MMM"), value: total / 100 });
  }

  return (
    <>
      <PageHeader title="Analytics" subtitle="Your gym at a glance." />
      <PageGuide
        id="analytics"
        summary="The business numbers that tell you how the gym is really doing."
        points={[
          "Track revenue, active clients and attendance trends over time.",
          "Spot growth or drop-off early so you can act.",
          "Handy for monthly reviews and goal-setting.",
        ]}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Revenue (paid)" value={formatMoney(revenue)} tone="text-brand-600 dark:text-brand-400" />
        <Stat label="Outstanding" value={formatMoney(outstanding)} />
        <Stat label="Active clients" value={String(activeClients ?? 0)} />
        <Stat label="Upcoming sessions" value={String(upcoming ?? 0)} />
        <Stat label="Sessions completed" value={String(sess.filter((s) => s.status === "completed").length)} />
        <Stat label="No-show rate" value={`${noShowRate}%`} />
        <Stat label="Credits outstanding" value={String(creditsOutstanding)} />
        <Stat label="Upcoming classes" value={String(classCount ?? 0)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-ink-900 dark:text-white">Revenue · last 6 months</h2>
          <BarChart bars={months} format={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-ink-900 dark:text-white">Sessions by status</h2>
          <BarChart bars={byStatus} />
        </div>
      </div>
    </>
  );
}
