import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { NewTopicDialog } from "@/components/topic/NewTopicDialog";
import { TopicResponseBox } from "@/components/topic/TopicResponseBox";
import { toggleResponseLike, deleteResponse, concludeDiscussion } from "@/app/(app)/topic/actions";
import { relativeTime } from "@/lib/format";
import type { Profile } from "@/lib/database.types";

type Person = { id: string; full_name: string; avatar_url: string | null };
type ResponseRow = {
  id: string; user_id: string; body: string; created_at: string;
  user: Person | null;
  discussion_response_likes: { user_id: string }[];
};

export async function TopicSection({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const isAdmin = profile.is_admin;

  const { data: active } = await supabase
    .from("discussions")
    .select("*, creator:created_by(full_name)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let responses: ResponseRow[] = [];
  if (active) {
    const { data } = await supabase
      .from("discussion_responses")
      .select("*, user:user_id(id, full_name, avatar_url), discussion_response_likes(user_id)")
      .eq("discussion_id", (active as { id: string }).id);
    responses = ((data ?? []) as unknown as ResponseRow[]).sort(
      (a, b) =>
        b.discussion_response_likes.length - a.discussion_response_likes.length ||
        a.created_at.localeCompare(b.created_at)
    );
  }

  const { data: archivedRaw } = await supabase
    .from("discussions")
    .select("*, creator:created_by(full_name)")
    .eq("status", "archived")
    .order("archived_at", { ascending: false })
    .limit(20);
  const archived = (archivedRaw ?? []) as unknown as { id: string; prompt: string; conclusion: string | null; archived_at: string | null; creator: { full_name: string } | null }[];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">The gym&apos;s ongoing debate. Weigh in, hype your side, and we&apos;ll crown a verdict.</p>
        {isAdmin && <NewTopicDialog hasActive={!!active} />}
      </div>

      {!active && (
        <div className="card p-10 text-center muted">
          No topic running right now. {isAdmin ? "Start one to get the debate going!" : "Check back soon — a coach will kick one off."}
        </div>
      )}

      {active && (
        <div className="space-y-5">
          {/* The prompt */}
          <div className="card-brand p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">This week&apos;s debate</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{(active as any).prompt}</h2>
            {(active as any).details && <p className="mt-2 text-sm text-white/85">{(active as any).details}</p>}
            <p className="mt-3 text-xs text-white/60">Posted by {(active as any).creator?.full_name ?? "Coach"} · {responses.length} weighing in</p>
          </div>

          {/* Weigh in */}
          <div className="card p-4">
            <TopicResponseBox discussionId={(active as any).id} myName={profile.full_name} myAvatar={profile.avatar_url} />
          </div>

          {/* Responses */}
          <div className="space-y-3">
            {responses.length === 0 && <div className="card p-8 text-center muted">No takes yet — be the first to make your case!</div>}
            {responses.map((r) => {
              const liked = r.discussion_response_likes.some((l) => l.user_id === profile.id);
              const count = r.discussion_response_likes.length;
              const mine = r.user_id === profile.id;
              return (
                <div key={r.id} className="card flex items-start gap-3 p-4">
                  <Avatar name={r.user?.full_name || "Member"} src={r.user?.avatar_url} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink-900 dark:text-white">{r.user?.full_name || "Member"}</span>
                      <span className="text-xs muted">{relativeTime(r.created_at)}</span>
                    </div>
                    <p className="mt-0.5 whitespace-pre-wrap text-[15px] text-ink-900 dark:text-white">{r.body}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <form action={toggleResponseLike}>
                        <input type="hidden" name="response_id" value={r.id} />
                        <button className={`flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium ${liked ? "border-brand-300 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300" : "border-slate-200 text-slate-600 hover:text-brand-600 dark:border-white/10 dark:text-slate-300"}`}>
                          👍 {count > 0 ? count : ""}
                        </button>
                      </form>
                      {mine && (
                        <form action={deleteResponse}>
                          <input type="hidden" name="id" value={r.id} />
                          <button className="muted hover:text-red-500">Delete</button>
                        </form>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Admin: conclude */}
          {isAdmin && (
            <div className="card border-amber-200 p-5 dark:border-amber-500/30">
              <h3 className="font-semibold text-ink-900 dark:text-white">Wrap it up 🏁</h3>
              <p className="mb-3 text-sm muted">Call the verdict, archive this topic, then start a fresh one.</p>
              <form action={concludeDiscussion} className="space-y-3">
                <input type="hidden" name="id" value={(active as any).id} />
                <textarea name="conclusion" required rows={2} className="input" placeholder="The verdict is… 🏆" />
                <button className="btn-primary">Conclude &amp; archive</button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Archive */}
      {archived.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide muted">Settled debates 🏆</h2>
          <div className="space-y-3">
            {archived.map((d) => (
              <div key={d.id} className="card p-5">
                <p className="font-semibold text-ink-900 dark:text-white">{d.prompt}</p>
                {d.conclusion && (
                  <p className="mt-1 text-sm text-ink-900 dark:text-white">
                    <span className="font-medium text-brand-700 dark:text-brand-300">Verdict:</span> {d.conclusion}
                  </p>
                )}
                <p className="mt-1 text-xs muted">Settled {d.archived_at ? format(new Date(d.archived_at), "MMM d, yyyy") : ""}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
