import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";

type MemberCard = {
  id: string; full_name: string; role: string; avatar_url: string | null;
  about: { intro: string | null; current_goal: string | null; favorite_movement: string | null } | null;
};

export default async function MembersPage() {
  await requireProfile();
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, about:member_profiles(intro, current_goal, favorite_movement)")
    .order("full_name", { ascending: true });

  const members = (data ?? []) as unknown as MemberCard[];

  return (
    <>
      <PageHeader title="Members" subtitle="Meet the crew. Tap anyone to see their profile." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <Link key={m.id} href={`/members/${m.id}`} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <Avatar name={m.full_name || "Member"} src={m.avatar_url} size="lg" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900 dark:text-white">{m.full_name || "Member"}</p>
                <span className={`badge ${m.role === "trainer" ? "bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300"}`}>
                  {m.role === "trainer" ? "Coach" : "Member"}
                </span>
              </div>
            </div>
            {m.about?.intro ? (
              <p className="mt-3 line-clamp-2 text-sm muted">{m.about.intro}</p>
            ) : (
              <p className="mt-3 text-sm italic muted">No profile yet.</p>
            )}
            {m.about?.current_goal && (
              <p className="mt-2 line-clamp-1 text-xs font-medium text-brand-700 dark:text-brand-300">🎯 {m.about.current_goal}</p>
            )}
            {m.about?.favorite_movement && (
              <p className="mt-1 text-xs muted">💪 Loves {m.about.favorite_movement}</p>
            )}
          </Link>
        ))}
      </div>
    </>
  );
}
