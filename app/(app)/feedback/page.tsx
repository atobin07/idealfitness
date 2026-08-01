import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { FeedbackForm } from "@/components/feedback/FeedbackForm";
import { setFeedbackStatus } from "@/app/(app)/feedback/actions";

type FeedbackRow = {
  id: string; is_anonymous: boolean; audience: string; category: string | null; body: string; status: string; created_at: string;
  from: { full_name: string; avatar_url: string | null } | null;
  trainer: { full_name: string } | null;
};

const AUDIENCE_LABEL: Record<string, string> = { owner: "Owner", trainer: "Trainer", staff: "Staff" };
const STATUS_STYLE: Record<string, string> = {
  new: "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300",
  read: "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  resolved: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
};

export default async function FeedbackPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isStaff = profile.role === "trainer" || profile.is_admin;

  const { data: trainerData } = await supabase.from("profiles").select("id, full_name").eq("role", "trainer").order("full_name");
  const trainers = (trainerData ?? []) as { id: string; full_name: string }[];

  let inbox: FeedbackRow[] = [];
  if (isStaff) {
    const { data } = await supabase
      .from("feedback")
      .select("*, from:from_user_id(full_name, avatar_url), trainer:trainer_id(full_name)")
      .order("created_at", { ascending: false })
      .limit(100);
    inbox = (data ?? []) as unknown as FeedbackRow[];
  }

  return (
    <>
      <PageHeader title="Feedback" subtitle="Tell us how we're doing — the good, the tough, and the ideas." />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-1 font-semibold text-ink-900 dark:text-white">Share your feedback</h2>
          <p className="mb-4 text-sm muted">Reach the owner, a specific trainer, or the whole staff. Go anonymous if that helps you speak freely.</p>
          <FeedbackForm trainers={trainers} />
        </div>

        {isStaff && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold text-ink-900 dark:text-white">Inbox</h2>
              <span className="text-xs muted">{inbox.filter((f) => f.status === "new").length} new</span>
            </div>
            {inbox.length === 0 && <div className="card p-8 text-center muted">No feedback yet.</div>}
            <div className="space-y-3">
              {inbox.map((f) => (
                <div key={f.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {f.is_anonymous ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-sm dark:bg-white/10">🕶️</div>
                      ) : (
                        <Avatar name={f.from?.full_name || "Member"} src={f.from?.avatar_url} size="sm" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-ink-900 dark:text-white">{f.is_anonymous ? "Anonymous" : f.from?.full_name || "Member"}</p>
                        <p className="text-xs muted">
                          to {AUDIENCE_LABEL[f.audience] ?? f.audience}{f.audience === "trainer" && f.trainer ? ` · ${f.trainer.full_name}` : ""}
                          {f.category ? ` · ${f.category}` : ""} · {format(new Date(f.created_at), "MMM d")}
                        </p>
                      </div>
                    </div>
                    <span className={`badge ${STATUS_STYLE[f.status] ?? ""}`}>{f.status}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink-900 dark:text-white">{f.body}</p>
                  <div className="mt-2 flex gap-2">
                    {f.status !== "read" && (
                      <form action={setFeedbackStatus}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="status" value="read" />
                        <button className="btn-ghost px-2 py-1 text-xs">Mark read</button>
                      </form>
                    )}
                    {f.status !== "resolved" && (
                      <form action={setFeedbackStatus}>
                        <input type="hidden" name="id" value={f.id} />
                        <input type="hidden" name="status" value="resolved" />
                        <button className="btn-ghost px-2 py-1 text-xs text-emerald-600">Mark resolved</button>
                      </form>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
