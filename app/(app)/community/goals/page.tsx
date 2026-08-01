import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { CommunityTabs } from "@/components/community/CommunityTabs";
import { CreatePartnerGoalDialog } from "@/components/community/CreatePartnerGoalDialog";
import { leavePartnerGoal } from "@/app/(app)/community/actions";
import { metricLabel } from "@/lib/format";

export default async function PartnerGoalsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: goalsRaw }, { data: peopleRaw }] = await Promise.all([
    supabase
      .from("partner_goals")
      .select("*, partner_goal_members(user_id, profile:user_id(full_name))")
      .order("ends_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name").neq("id", profile.id).order("full_name"),
  ]);

  const goals = (goalsRaw ?? []) as unknown as {
    id: string; title: string; metric: string; target: number; ends_at: string; status: string;
    partner_goal_members: { user_id: string; profile: { full_name: string } | null }[];
  }[];
  const people = (peopleRaw ?? []) as { id: string; full_name: string }[];

  const progress = await Promise.all(
    goals.map((g) => supabase.rpc("partner_goal_progress", { gid: g.id }).then((r) => (r.data ?? 0) as number))
  );

  return (
    <>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink-900 dark:text-white">Community</h1>
        <CreatePartnerGoalDialog people={people} />
      </div>
      <p className="mb-4 text-sm text-slate-500">Team up with a gym buddy and hit a shared target together.</p>
      <CommunityTabs />

      {goals.length === 0 && <div className="card p-10 text-center muted">No partner goals yet. Set one with a buddy!</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        {goals.map((g, i) => {
          const done = progress[i];
          const pct = Math.min(100, Math.round((done / Math.max(1, g.target)) * 100));
          const complete = done >= g.target;
          return (
            <div key={g.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink-900 dark:text-white">{g.title}</h3>
                  <p className="text-xs muted">{metricLabel(g.metric)} · by {format(new Date(g.ends_at), "MMM d")}</p>
                </div>
                {complete && <span className="badge bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">Done ✅</span>}
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-ink-900 dark:text-white">{done} / {g.target}</span>
                  <span className="muted">{pct}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className={`h-full rounded-full ${complete ? "bg-emerald-500" : "bg-brand-500"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-white/10">
                <div className="flex items-center -space-x-2">
                  {g.partner_goal_members.map((m) => (
                    <div key={m.user_id} className="ring-2 ring-white dark:ring-ink-800 rounded-full">
                      <Avatar name={m.profile?.full_name || "Member"} size="sm" />
                    </div>
                  ))}
                  <span className="ml-4 text-xs muted">{g.partner_goal_members.map((m) => m.profile?.full_name).filter(Boolean).join(", ")}</span>
                </div>
                {g.partner_goal_members.some((m) => m.user_id === profile.id) && (
                  <form action={leavePartnerGoal}>
                    <input type="hidden" name="goal_id" value={g.id} />
                    <button className="btn-ghost px-2 py-1 text-xs text-red-600">Leave</button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
