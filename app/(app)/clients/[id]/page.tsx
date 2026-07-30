import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { AddProgressForm } from "@/components/AddProgressForm";
import { removeClient } from "@/app/(app)/clients/actions";
import { dayLabel, timeRange, statusBadge, statusLabel } from "@/lib/format";
import type { ClientProgress, Profile, Session } from "@/lib/database.types";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.role !== "trainer") notFound();

  // Confirm the link belongs to this trainer.
  const { data: link } = await supabase
    .from("trainer_clients")
    .select("id")
    .eq("trainer_id", profile.id)
    .eq("client_id", id)
    .maybeSingle();
  if (!link) notFound();

  const [{ data: client }, { data: sessions }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", id).single(),
    supabase
      .from("sessions")
      .select("*")
      .eq("trainer_id", profile.id)
      .eq("client_id", id)
      .order("starts_at", { ascending: false })
      .limit(20),
    supabase
      .from("client_progress")
      .select("*")
      .eq("client_id", id)
      .order("recorded_at", { ascending: false })
      .limit(20),
  ]);

  if (!client) notFound();

  const c = client as Profile;
  const sessionList = (sessions ?? []) as Session[];
  const progressList = (progress ?? []) as ClientProgress[];
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <>
      <Link href="/clients" className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-ink-900 dark:text-white">
        ← Back to clients
      </Link>

      <PageHeader
        title={c.full_name || "Client"}
        subtitle={c.email ?? undefined}
        action={
          <div className="flex gap-2">
            <Link href="/messages" className="btn-secondary">Message</Link>
            <form action={removeClient}>
              <input type="hidden" name="client_id" value={c.id} />
              <button className="btn-danger">Remove</button>
            </form>
          </div>
        }
      />

      <div className="mb-6 flex items-center gap-4">
        <Avatar name={c.full_name || "Client"} size="lg" />
        <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-slate-400">Phone</p>
            <p className="text-sm font-medium text-ink-900 dark:text-white">{c.phone || "—"}</p>
          </div>
          <div className="col-span-1 sm:col-span-3">
            <p className="text-xs uppercase text-slate-400">Goals</p>
            <p className="text-sm font-medium text-ink-900 dark:text-white">{c.goals || "—"}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Session history</h2>
          <div className="card divide-y divide-slate-100 dark:divide-white/10">
            {sessionList.length === 0 && (
              <p className="p-5 text-sm text-slate-500">No sessions with this client yet.</p>
            )}
            {sessionList.map((s) => (
              <div key={s.id} className="flex items-center gap-3 p-4">
                <div className="w-28 shrink-0 text-sm">
                  <p className="font-medium text-ink-900 dark:text-white">{dayLabel(new Date(s.starts_at))}</p>
                  <p className="text-slate-500">{timeRange(s.starts_at, s.ends_at)}</p>
                </div>
                <p className="min-w-0 flex-1 truncate text-sm text-slate-600">{s.title}</p>
                <span className={`badge ${statusBadge(s.status)}`}>{statusLabel(s.status)}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">Progress</h2>
          <div className="card mb-4 p-5">
            <AddProgressForm clientId={c.id} today={today} />
          </div>
          <div className="card divide-y divide-slate-100 dark:divide-white/10">
            {progressList.length === 0 && (
              <p className="p-5 text-sm text-slate-500">No progress entries yet.</p>
            )}
            {progressList.map((p) => (
              <div key={p.id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink-900 dark:text-white">
                    {format(new Date(p.recorded_at + "T00:00:00"), "MMM d, yyyy")}
                  </p>
                  <div className="flex gap-3 text-sm text-slate-600">
                    {p.weight_kg != null && <span>{p.weight_kg} kg</span>}
                    {p.body_fat_pct != null && <span>{p.body_fat_pct}% bf</span>}
                  </div>
                </div>
                {p.notes && <p className="mt-1 text-sm text-slate-600">{p.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
