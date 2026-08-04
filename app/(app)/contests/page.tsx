import Link from "next/link";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PageGuide } from "@/components/PageGuide";
import { Avatar } from "@/components/Avatar";
import { CreateContestDialog } from "@/components/CreateContestDialog";
import { joinContest, leaveContest, setContestStatus, deleteContest } from "@/app/(app)/contests/actions";

type Entry = { user_id: string; profile: { full_name: string; avatar_url: string | null } | null };
type Contest = {
  id: string; title: string; description: string | null; prize: string | null;
  starts_at: string | null; ends_at: string | null; status: string;
  contest_entries: Entry[];
};

export default async function ContestsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isAdmin = profile.is_admin;

  const { data } = await supabase
    .from("contests")
    .select("*, contest_entries(user_id, profile:user_id(full_name, avatar_url))")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });
  const contests = (data ?? []) as unknown as Contest[];

  return (
    <>
      <PageHeader
        title="Contests"
        subtitle="Gym-wide contests with real prizes. Opt in and go for it."
        action={isAdmin ? <CreateContestDialog /> : undefined}
      />
      <PageGuide
        id="contests"
        summary={isAdmin
          ? "Run gym-wide contests to drive engagement, attendance and buzz."
          : "Fun gym-wide contests with prizes — join any that catch your eye."}
        points={isAdmin
          ? [
              "Tap “Start a contest”, describe how to win, and set the prize.",
              "Members opt in themselves — you'll see who's in.",
              "End or remove a contest anytime once it's over.",
            ]
          : [
              "Read what each contest is and what you can win.",
              "Tap “Count me in” to join — leave anytime before it ends.",
              "See who else is competing.",
            ]}
      />

      {contests.length === 0 && (
        <div className="rounded-2xl bg-white p-10 text-center text-sm text-slate-400 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
          {isAdmin ? "No contests yet — start one to get the gym buzzing!" : "No contests running right now. Check back soon!"}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {contests.map((c) => {
          const entries = c.contest_entries ?? [];
          const joined = entries.some((e) => e.user_id === profile.id);
          const ended = c.status === "ended";
          return (
            <div
              key={c.id}
              className={`relative overflow-hidden rounded-2xl bg-white shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08),0_24px_56px_-16px_rgba(15,23,42,0.28)] dark:bg-ink-800 dark:shadow-none dark:ring-1 dark:ring-white/10 ${ended ? "opacity-70" : ""}`}
            >
              {/* Header band */}
              <div className="relative bg-gradient-to-br from-brand-400 to-brand-600 p-5 text-white">
                <div className="pointer-events-none absolute -right-6 -top-8 h-28 w-28 rounded-full bg-white/10 blur-xl" />
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
                      🏆 {ended ? "Contest ended" : "Contest"}
                    </span>
                    <Link href={`/contests/${c.id}`} className="mt-2 block text-lg font-bold leading-tight hover:underline">{c.title}</Link>
                    {(c.starts_at || c.ends_at) && (
                      <p className="mt-0.5 text-xs text-white/80">
                        {c.starts_at ? format(new Date(c.starts_at + "T00:00:00"), "MMM d") : "Now"}
                        {" – "}
                        {c.ends_at ? format(new Date(c.ends_at + "T00:00:00"), "MMM d") : "open-ended"}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5">
                {c.description && <p className="whitespace-pre-wrap text-sm text-ink-700 dark:text-slate-300">{c.description}</p>}

                {c.prize && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-100 dark:bg-amber-500/10 dark:ring-amber-500/20">
                    <span className="text-lg">🎁</span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-300">Prize</p>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{c.prize}</p>
                    </div>
                  </div>
                )}

                {/* Participants */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {entries.slice(0, 6).map((e) => (
                      <div key={e.user_id} className="ring-2 ring-white dark:ring-ink-800 rounded-full">
                        <Avatar name={e.profile?.full_name || "Member"} src={e.profile?.avatar_url} size="sm" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {entries.length === 0 ? "Be the first to join" : `${entries.length} ${entries.length === 1 ? "person" : "people"} in`}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  {!ended && (
                    joined ? (
                      <form action={leaveContest}>
                        <input type="hidden" name="contest_id" value={c.id} />
                        <button className="btn-secondary">✓ You're in · Leave</button>
                      </form>
                    ) : (
                      <form action={joinContest}>
                        <input type="hidden" name="contest_id" value={c.id} />
                        <button className="btn-primary">Count me in 🙌</button>
                      </form>
                    )
                  )}
                  {ended && <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-500 dark:bg-white/10">This contest has ended</span>}

                  <Link href={`/contests/${c.id}`} className="btn-ghost px-2 py-1.5 text-sm font-semibold text-brand-700 dark:text-brand-300">
                    Open →
                  </Link>

                  {isAdmin && (
                    <div className="ml-auto flex items-center gap-1">
                      {!ended && (
                        <form action={setContestStatus}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="status" value="ended" />
                          <button className="btn-ghost px-2 py-1 text-xs text-slate-500">End</button>
                        </form>
                      )}
                      <form action={deleteContest}>
                        <input type="hidden" name="id" value={c.id} />
                        <button className="btn-ghost px-2 py-1 text-xs text-slate-400 hover:text-red-500">Delete</button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
