import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PageGuide } from "@/components/PageGuide";
import { formatMoney } from "@/lib/money";
import {
  createInvoice,
  deleteInvoice,
  deletePackage,
  grantPackage,
  markInvoicePaid,
} from "@/app/(app)/billing/actions";
import { PackageForm } from "@/components/PackageForm";
import type { ClientPackage, Invoice, Package } from "@/lib/database.types";

function invoiceBadge(s: string) {
  return s === "paid"
    ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300"
    : s === "due"
    ? "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
    : "bg-slate-100 text-slate-500 dark:bg-white/10";
}

function CreditCard({ cp }: { cp: ClientPackage & { client?: { full_name: string } } }) {
  const remaining = cp.sessions_total - cp.sessions_used;
  const pct = Math.round((cp.sessions_used / Math.max(1, cp.sessions_total)) * 100);
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink-900 dark:text-white">{cp.name}</p>
        <span className="stat-value !text-2xl">{remaining}</span>
      </div>
      {cp.client && <p className="text-xs muted">{cp.client.full_name}</p>}
      <p className="text-sm muted">sessions remaining</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${100 - pct}%` }} />
      </div>
      <p className="mt-1 text-xs muted">{cp.sessions_used} of {cp.sessions_total} used</p>
    </div>
  );
}

export default async function BillingPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";

  if (!isTrainer) {
    const [{ data: creditsData }, { data: invData }] = await Promise.all([
      supabase.from("client_packages").select("*").eq("client_id", profile.id).order("purchased_at", { ascending: false }),
      supabase.from("invoices").select("*").eq("client_id", profile.id).order("issued_at", { ascending: false }),
    ]);
    const credits = (creditsData ?? []) as ClientPackage[];
    const invoices = (invData ?? []) as Invoice[];

    return (
      <>
        <PageHeader title="Billing" subtitle="Your session credits and invoices." />
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">Session credits</h2>
        {credits.length === 0 ? (
          <div className="card mb-6 p-6 muted">No active packages.</div>
        ) : (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {credits.map((c) => <CreditCard key={c.id} cp={c} />)}
          </div>
        )}

        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">Invoices</h2>
        <div className="card divide-rows">
          {invoices.length === 0 && <p className="p-5 text-sm muted">No invoices.</p>}
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 dark:text-slate-100">{inv.description}</p>
                <p className="text-xs muted">Issued {format(new Date(inv.issued_at), "MMM d, yyyy")}{inv.due_date ? ` · due ${format(new Date(inv.due_date + "T00:00:00"), "MMM d")}` : ""}</p>
              </div>
              <span className="font-semibold">{formatMoney(inv.amount_cents)}</span>
              <span className={`badge ${invoiceBadge(inv.status)}`}>{inv.status}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  // Trainer
  const [{ data: pkgData }, { data: invData }, { data: creditsData }, { data: clientData }] = await Promise.all([
    supabase.from("packages").select("*").eq("trainer_id", profile.id).order("created_at"),
    supabase.from("invoices").select("*, client:client_id(full_name)").eq("trainer_id", profile.id).order("issued_at", { ascending: false }),
    supabase.from("client_packages").select("*, client:client_id(full_name)").eq("trainer_id", profile.id).eq("status", "active").order("purchased_at", { ascending: false }),
    supabase.from("trainer_clients").select("client:client_id(id, full_name)").eq("trainer_id", profile.id).eq("status", "active"),
  ]);
  const packages = (pkgData ?? []) as Package[];
  const invoices = (invData ?? []) as any[];
  const credits = (creditsData ?? []) as any[];
  const clients = (clientData ?? []).map((r) => r.client as unknown as { id: string; full_name: string }).filter(Boolean);

  const revenue = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount_cents, 0);
  const outstanding = invoices.filter((i) => i.status === "due").reduce((s, i) => s + i.amount_cents, 0);

  return (
    <>
      <PageHeader title="Billing" subtitle="Packages, client credits, and invoices." />
      <PageGuide
        id="billing"
        summary="Sell packages, track session credits, and get paid."
        points={[
          "See each client's remaining session credits at a glance.",
          "Issue invoices and mark them paid when money comes in.",
          "Overdue and outstanding amounts also surface on the Follow-ups page.",
        ]}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card-brand p-5"><p className="text-sm text-white/75">Revenue (paid)</p><p className="stat-value">{formatMoney(revenue)}</p></div>
        <div className="card-brand p-5"><p className="text-sm text-white/75">Outstanding</p><p className="stat-value">{formatMoney(outstanding)}</p></div>
        <div className="card-brand p-5"><p className="text-sm text-white/75">Active packages</p><p className="stat-value">{credits.length}</p></div>
        <div className="card-brand p-5"><p className="text-sm text-white/75">Offerings</p><p className="stat-value">{packages.length}</p></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Package offerings</h2>
            <div className="mb-4 space-y-2">
              {packages.map((p) => (
                <div key={p.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-3 dark:border-white/10">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs muted">{p.sessions_count} sessions · {formatMoney(p.price_cents)}</p>
                  </div>
                  <form action={deletePackage}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-slate-400 hover:text-red-500" aria-label="Delete">×</button>
                  </form>
                </div>
              ))}
              {packages.length === 0 && <p className="text-sm muted">No packages yet.</p>}
            </div>
            <PackageForm />
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Sell a package to a client</h2>
            <form action={grantPackage} className="flex flex-wrap gap-2">
              <select name="client_id" required className="input flex-1" defaultValue="">
                <option value="" disabled>Client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
              <select name="package_id" required className="input flex-1" defaultValue="">
                <option value="" disabled>Package…</option>
                {packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button className="btn-primary">Sell & invoice</button>
            </form>
            <div className="mt-4 space-y-1.5">
              {credits.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span>{c.client?.full_name} · {c.name}</span>
                  <span className="muted">{c.sessions_total - c.sessions_used} left</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Invoices</h2>
          <form action={createInvoice} className="mb-4 space-y-2 rounded-lg border border-slate-100 p-3 dark:border-white/10">
            <div className="flex gap-2">
              <select name="client_id" required className="input" defaultValue="">
                <option value="" disabled>Client…</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
              <input name="amount" className="input w-28" placeholder="$ amount" />
            </div>
            <input name="description" required className="input" placeholder="Description" />
            <div className="flex items-center gap-2">
              <input name="due_date" type="date" className="input" />
              <button className="btn-secondary whitespace-nowrap">Create invoice</button>
            </div>
          </form>

          <div className="divide-rows -mx-5 border-t border-slate-100 dark:border-white/10">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.description}</p>
                  <p className="text-xs muted">{inv.client?.full_name}</p>
                </div>
                <span className="text-sm font-semibold">{formatMoney(inv.amount_cents)}</span>
                <span className={`badge ${invoiceBadge(inv.status)}`}>{inv.status}</span>
                {inv.status === "due" && (
                  <form action={markInvoicePaid}>
                    <input type="hidden" name="id" value={inv.id} />
                    <button className="btn-ghost px-2 py-1 text-xs text-brand-600">Mark paid</button>
                  </form>
                )}
                <form action={deleteInvoice}>
                  <input type="hidden" name="id" value={inv.id} />
                  <button className="text-slate-400 hover:text-red-500" aria-label="Delete">×</button>
                </form>
              </div>
            ))}
            {invoices.length === 0 && <p className="px-5 py-4 text-sm muted">No invoices yet.</p>}
          </div>
        </div>
      </div>
    </>
  );
}
