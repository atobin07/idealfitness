import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import {
  assignClientToTrainer,
  setUserAdmin,
  setUserRole,
  unassignLink,
} from "@/app/(app)/admin/actions";
import type { Profile } from "@/lib/database.types";

type Link = { id: string; trainer_id: string; client_id: string };

export default async function AdminPeoplePage() {
  const me = await requireAdmin();
  const supabase = await createClient();

  const [{ data: profs }, { data: links }] = await Promise.all([
    supabase.from("profiles").select("*").order("role").order("full_name"),
    supabase.from("trainer_clients").select("id, trainer_id, client_id"),
  ]);

  const people = (profs ?? []) as Profile[];
  const allLinks = (links ?? []) as Link[];
  const trainers = people.filter((p) => p.role === "trainer");
  const clients = people.filter((p) => p.role === "client");
  const nameOf = (id: string) => people.find((p) => p.id === id)?.full_name ?? "—";

  return (
    <>
      <PageHeader title="People & roster" subtitle={`${clients.length} members · ${trainers.length} coaches`} />

      {/* Coaches */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide muted">Coaches & staff</h2>
      <div className="card mb-8 divide-rows">
        {trainers.length === 0 && <p className="p-5 text-sm muted">No coaches yet.</p>}
        {trainers.map((t) => {
          const clientCount = allLinks.filter((l) => l.trainer_id === t.id).length;
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar name={t.full_name || "Coach"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 dark:text-white">
                  {t.full_name || "Unnamed"}
                  {t.is_admin && <span className="badge ml-2 bg-brand-100 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">Admin</span>}
                </p>
                <p className="text-xs muted">{t.email} · {clientCount} clients</p>
              </div>
              <form action={setUserAdmin}>
                <input type="hidden" name="user_id" value={t.id} />
                <input type="hidden" name="value" value={(!t.is_admin).toString()} />
                <button className="btn-ghost px-2 py-1 text-xs" disabled={t.id === me.id && t.is_admin}>
                  {t.is_admin ? "Revoke admin" : "Make admin"}
                </button>
              </form>
              <form action={setUserRole}>
                <input type="hidden" name="user_id" value={t.id} />
                <input type="hidden" name="role" value="client" />
                <button className="btn-ghost px-2 py-1 text-xs text-slate-400">Demote to member</button>
              </form>
            </div>
          );
        })}
      </div>

      {/* Members */}
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide muted">Members</h2>
      <div className="card divide-rows">
        {clients.length === 0 && <p className="p-5 text-sm muted">No members yet.</p>}
        {clients.map((c) => {
          const myLinks = allLinks.filter((l) => l.client_id === c.id);
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-3 p-4">
              <Avatar name={c.full_name || "Member"} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900 dark:text-white">{c.full_name || "Unnamed"}</p>
                <p className="text-xs muted">
                  {c.email}
                  {myLinks.length > 0 && <> · coached by {myLinks.map((l) => nameOf(l.trainer_id)).join(", ")}</>}
                </p>
              </div>

              {/* Assign to a coach */}
              <form action={assignClientToTrainer} className="flex items-center gap-1">
                <input type="hidden" name="client_id" value={c.id} />
                <select name="trainer_id" required defaultValue="" className="input h-8 py-1 text-xs">
                  <option value="" disabled>Assign coach…</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name}</option>
                  ))}
                </select>
                <button className="btn-secondary px-2 py-1 text-xs">Assign</button>
              </form>

              {myLinks.map((l) => (
                <form key={l.id} action={unassignLink}>
                  <input type="hidden" name="id" value={l.id} />
                  <button className="btn-ghost px-2 py-1 text-xs text-slate-400" title={`Remove ${nameOf(l.trainer_id)}`}>
                    ✕ {nameOf(l.trainer_id)}
                  </button>
                </form>
              ))}

              <form action={setUserRole}>
                <input type="hidden" name="user_id" value={c.id} />
                <input type="hidden" name="role" value="trainer" />
                <button className="btn-ghost px-2 py-1 text-xs text-brand-600">Promote to coach</button>
              </form>
            </div>
          );
        })}
      </div>
    </>
  );
}
