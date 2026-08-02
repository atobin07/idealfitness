import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PageGuide } from "@/components/PageGuide";
import { Avatar } from "@/components/Avatar";
import { formatMoney } from "@/lib/money";

const LAPSE_DAYS = 14;
const LOW_CREDITS = 2;

function daysAgo(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + (dateStr.length === 10 ? "T00:00:00" : ""));
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

export default async function FollowUpsPage() {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && !profile.is_admin) notFound();
  const supabase = await createClient();

  const today = new Date();
  const cutoff = new Date(today.getTime() - LAPSE_DAYS * 86_400_000).toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);

  // Active clients of this trainer.
  const { data: links } = await supabase
    .from("trainer_clients")
    .select("client:client_id(id, full_name, email)")
    .eq("trainer_id", profile.id)
    .eq("status", "active");
  const clients = (links ?? [])
    .map((l) => (l as any).client as { id: string; full_name: string; email: string | null })
    .filter(Boolean);
  const clientIds = clients.map((c) => c.id);

  // Last activity: most recent check-in and most recent completed session.
  const [{ data: statsRows }, { data: doneSessions }, { data: lowPkgs }, { data: dueInvoices }] =
    await Promise.all([
      clientIds.length
        ? supabase.from("member_stats").select("user_id, last_checkin_date").in("user_id", clientIds)
        : Promise.resolve({ data: [] as any[] }),
      clientIds.length
        ? supabase
            .from("sessions")
            .select("client_id, starts_at")
            .eq("trainer_id", profile.id)
            .eq("status", "completed")
            .in("client_id", clientIds)
            .order("starts_at", { ascending: false })
        : Promise.resolve({ data: [] as any[] }),
      supabase
        .from("client_packages")
        .select("client_id, name, sessions_total, sessions_used, client:client_id(full_name)")
        .eq("trainer_id", profile.id)
        .eq("status", "active"),
      supabase
        .from("invoices")
        .select("id, client_id, description, amount_cents, due_date, client:client_id(full_name)")
        .eq("trainer_id", profile.id)
        .eq("status", "due")
        .order("due_date", { ascending: true }),
    ]);

  const lastCheckin = new Map<string, string | null>();
  for (const s of statsRows ?? []) lastCheckin.set((s as any).user_id, (s as any).last_checkin_date);
  const lastSession = new Map<string, string>();
  for (const s of doneSessions ?? []) {
    const cid = (s as any).client_id;
    if (!lastSession.has(cid)) lastSession.set(cid, (s as any).starts_at); // first = most recent (desc)
  }

  // Lapsed: last activity (check-in OR completed session) older than the cutoff.
  const lapsed = clients
    .map((c) => {
      const ci = lastCheckin.get(c.id) ?? null;
      const ss = lastSession.get(c.id) ?? null;
      const lastDate = [ci, ss].filter(Boolean).sort().pop() ?? null; // latest of the two
      return { ...c, lastDate, days: daysAgo(lastDate) };
    })
    .filter((c) => c.lastDate === null || c.lastDate.slice(0, 10) < cutoff)
    .sort((a, b) => (a.days === null ? Infinity : a.days) > (b.days === null ? Infinity : b.days) ? -1 : 1);

  const lowCredits = (lowPkgs ?? [])
    .map((p: any) => ({
      client_id: p.client_id,
      name: p.name as string,
      remaining: (p.sessions_total ?? 0) - (p.sessions_used ?? 0),
      clientName: p.client?.full_name as string,
    }))
    .filter((p) => p.remaining <= LOW_CREDITS)
    .sort((a, b) => a.remaining - b.remaining);

  const overdue = (dueInvoices ?? []).map((i: any) => ({
    id: i.id,
    client_id: i.client_id,
    description: i.description as string | null,
    amount: i.amount_cents as number,
    due_date: i.due_date as string | null,
    clientName: i.client?.full_name as string,
    isOverdue: !!i.due_date && i.due_date < todayStr,
  }));

  const totalDue = overdue.reduce((s, i) => s + i.amount, 0);

  return (
    <>
      <PageHeader title="Follow-ups" subtitle="Who needs your attention today — retention and sales at a glance." />
      <PageGuide
        id="follow-ups"
        summary="Your daily worklist for keeping members and catching revenue before it slips away."
        points={[
          "Message members who haven't been in for 14+ days before you lose them.",
          "Spot clients low on session credits and offer a renewal — easy upsell.",
          "See who owes money and chase overdue invoices.",
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lapsed members */}
        <Section
          title="Haven't been in"
          count={lapsed.length}
          accent="from-rose-400 to-red-500"
          empty="Everyone's been active recently. 🎉"
        >
          {lapsed.map((c) => (
            <Row key={c.id} name={c.full_name} sub={c.days === null ? "No visits on record" : `${c.days} days ago`} avatar={c.full_name}>
              <Link href={`/messages?with=${c.id}`} className="btn-primary px-3 py-1.5 text-xs">Message</Link>
            </Row>
          ))}
        </Section>

        {/* Low on credits */}
        <Section
          title="Low on sessions"
          count={lowCredits.length}
          accent="from-amber-400 to-orange-500"
          empty="No one's about to run out. 👍"
        >
          {lowCredits.map((p, i) => (
            <Row key={`${p.client_id}-${i}`} name={p.clientName || "Client"} sub={`${p.remaining} left · ${p.name}`} avatar={p.clientName || "?"}>
              <Link href={`/messages?with=${p.client_id}`} className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-200 dark:bg-amber-500/20 dark:text-amber-200">Offer renewal</Link>
            </Row>
          ))}
        </Section>

        {/* Overdue invoices */}
        <Section
          title="Money owed"
          count={overdue.length}
          accent="from-brand-400 to-brand-600"
          empty="All invoices are settled. 💸"
          footer={overdue.length > 0 ? `${formatMoney(totalDue)} outstanding` : undefined}
        >
          {overdue.map((i) => (
            <Row
              key={i.id}
              name={i.clientName || "Client"}
              sub={`${formatMoney(i.amount)}${i.due_date ? ` · due ${i.due_date}` : ""}`}
              avatar={i.clientName || "?"}
              flag={i.isOverdue ? "Overdue" : undefined}
            >
              <Link href="/billing" className="btn-secondary px-3 py-1.5 text-xs">View</Link>
            </Row>
          ))}
        </Section>
      </div>
    </>
  );
}

function Section({
  title,
  count,
  accent,
  empty,
  footer,
  children,
}: {
  title: string;
  count: number;
  accent: string;
  empty: string;
  footer?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08),0_24px_56px_-16px_rgba(15,23,42,0.28)] dark:bg-ink-800 dark:shadow-none dark:ring-1 dark:ring-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${accent}`} />
          <h2 className="text-sm font-bold text-ink-900 dark:text-white">{title}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{count}</span>
      </div>
      <div className="space-y-1 px-2 pb-2">
        {count === 0 ? <p className="px-3 py-6 text-center text-sm text-slate-400">{empty}</p> : children}
      </div>
      {footer && <p className="bg-slate-50/70 px-4 py-2 text-xs font-semibold text-slate-500 dark:bg-white/[0.02]">{footer}</p>}
    </section>
  );
}

function Row({
  name,
  sub,
  avatar,
  flag,
  children,
}: {
  name: string;
  sub: string;
  avatar: string;
  flag?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
      <Avatar name={avatar} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-semibold text-ink-900 dark:text-white">
          {name}
          {flag && <span className="rounded-full bg-rose-100 px-1.5 py-px text-[10px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">{flag}</span>}
        </p>
        <p className="truncate text-xs text-slate-400">{sub}</p>
      </div>
      {children}
    </div>
  );
}
