import { createClient } from "@/lib/supabase/server";
import { CreatePollDialog } from "@/components/polls/CreatePollDialog";
import { PollCard } from "@/components/polls/PollCard";
import type { Profile } from "@/lib/database.types";

type Row = {
  id: string; question: string; description: string | null; status: string; allow_multiple: boolean; closes_at: string | null; created_at: string;
  poll_options: { id: string; label: string; sort: number }[];
  poll_votes: { option_id: string; user_id: string }[];
};

// A poll is effectively closed once its auto-close date passes.
function effectiveStatus(p: Row, now: number): string {
  if (p.status !== "open") return p.status;
  if (p.closes_at && new Date(p.closes_at).getTime() < now) return "closed";
  return "open";
}

export async function PollsSection({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("polls")
    .select("*, poll_options(id, label, sort), poll_votes(option_id, user_id)")
    .order("created_at", { ascending: false });

  const now = Date.now();
  const polls = ((data ?? []) as unknown as Row[]).map((p) => ({ ...p, _status: effectiveStatus(p, now) }));
  polls.sort((a, b) => Number(b._status === "open") - Number(a._status === "open"));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm muted">Your voice shapes the gym — vote on what matters to you.</p>
        {profile.is_admin && <CreatePollDialog />}
      </div>

      {polls.length === 0 && (
        <div className="card p-10 text-center muted">
          {profile.is_admin ? "No polls yet — ask the members a question!" : "No polls right now. Check back soon!"}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {polls.map((p) => (
          <PollCard
            key={p.id}
            poll={{ id: p.id, question: p.question, description: p.description, status: p._status, allow_multiple: p.allow_multiple }}
            options={[...p.poll_options].sort((a, b) => a.sort - b.sort)}
            votes={p.poll_votes}
            myId={profile.id}
            canManage={profile.is_admin}
          />
        ))}
      </div>
    </>
  );
}
