import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";

type MemberCard = { id: string; full_name: string; role: string; avatar_url: string | null };

/** Compact "meet the crew" widget for the dashboard overview. */
export async function MembersOverview() {
  const supabase = await createClient();
  const [{ data }, { count }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, role, avatar_url").order("full_name", { ascending: true }).limit(8),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);
  const members = (data ?? []) as MemberCard[];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Members</h2>
        <Link href="/members" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          {count ? `All ${count} →` : "All →"}
        </Link>
      </div>
      <div className="card p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {members.map((m) => (
            <Link key={m.id} href={`/members/${m.id}`} className="flex flex-col items-center gap-1.5 rounded-xl p-2 text-center transition hover:bg-slate-50 dark:hover:bg-white/5">
              <Avatar name={m.full_name || "Member"} src={m.avatar_url} size="md" />
              <span className="w-full truncate text-xs font-medium text-ink-900 dark:text-white">{(m.full_name || "Member").split(" ")[0]}</span>
              {m.role === "trainer" && <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">Coach</span>}
            </Link>
          ))}
          {members.length === 0 && <p className="col-span-full p-2 text-sm muted">No members yet.</p>}
        </div>
      </div>
    </div>
  );
}
