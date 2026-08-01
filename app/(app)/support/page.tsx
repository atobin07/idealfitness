import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { SupportChat } from "@/components/support/SupportChat";
import { setTicketStatus } from "@/app/(app)/support/actions";

type Ticket = {
  id: string; category: string; subject: string; summary: string; details: string | null;
  urgency: string; status: string; created_at: string; user_id: string;
  user?: { full_name: string; avatar_url: string | null } | null;
};

const STATUS_STYLE: Record<string, string> = {
  open: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  in_progress: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};
const URGENCY_STYLE: Record<string, string> = {
  low: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  high: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
};
const STATUS_LABEL: Record<string, string> = { open: "Open", in_progress: "In progress", resolved: "Resolved" };

export default async function SupportPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isAdmin = profile.is_admin;

  const { data } = await supabase
    .from("support_tickets")
    .select("*, user:user_id(full_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(100);
  const tickets = (data ?? []) as unknown as Ticket[];

  return (
    <>
      <PageHeader
        title="Support"
        subtitle={isAdmin ? "Members' tickets land here — the owner is notified on every new one." : "Need a hand? Chat with our helper and we'll take care of it."}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <SupportChat />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-ink-900 dark:text-white">{isAdmin ? "All tickets" : "Your tickets"}</h2>
            {isAdmin && <span className="text-xs muted">{tickets.filter((t) => t.status === "open").length} open</span>}
          </div>

          {tickets.length === 0 && <div className="card p-8 text-center muted">No tickets yet.</div>}

          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink-900 dark:text-white">{t.subject}</span>
                      <span className={`badge ${URGENCY_STYLE[t.urgency] ?? ""}`}>{t.urgency}</span>
                    </div>
                    {isAdmin && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <Avatar name={t.user?.full_name || "Member"} src={t.user?.avatar_url} size="sm" />
                        <span className="text-xs muted">{t.user?.full_name || "Member"} · {format(new Date(t.created_at), "MMM d")}</span>
                      </div>
                    )}
                  </div>
                  <span className={`badge ${STATUS_STYLE[t.status] ?? ""}`}>{STATUS_LABEL[t.status] ?? t.status}</span>
                </div>

                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-900 dark:text-white">{t.details || t.summary}</p>

                {isAdmin && (
                  <div className="mt-2 flex gap-2">
                    {t.status !== "in_progress" && (
                      <form action={setTicketStatus}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value="in_progress" />
                        <button className="btn-ghost px-2 py-1 text-xs text-amber-600">Mark in progress</button>
                      </form>
                    )}
                    {t.status !== "resolved" && (
                      <form action={setTicketStatus}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value="resolved" />
                        <button className="btn-ghost px-2 py-1 text-xs text-emerald-600">Mark resolved</button>
                      </form>
                    )}
                    {t.status === "resolved" && (
                      <form action={setTicketStatus}>
                        <input type="hidden" name="id" value={t.id} />
                        <input type="hidden" name="status" value="open" />
                        <button className="btn-ghost px-2 py-1 text-xs">Reopen</button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
