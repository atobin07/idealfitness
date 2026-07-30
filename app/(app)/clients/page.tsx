import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { EmailLinkForm } from "@/components/EmailLinkForm";
import { addClientByEmail, connectToTrainer } from "@/app/(app)/clients/actions";
import type { Profile } from "@/lib/database.types";

export default async function ClientsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  if (profile.role === "trainer") {
    const { data } = await supabase
      .from("trainer_clients")
      .select("status, client:client_id(id, full_name, email, goals)")
      .eq("trainer_id", profile.id)
      .order("created_at", { ascending: true });

    const clients = (data ?? [])
      .map((r) => ({ status: r.status, ...(r.client as unknown as Profile) }))
      .filter((c) => c.id);

    return (
      <>
        <PageHeader title="Clients" subtitle={`${clients.length} on your roster.`} />

        <div className="card mb-6 p-5">
          <h2 className="mb-1 font-semibold text-ink-900">Add a client</h2>
          <p className="mb-3 text-sm text-slate-500">
            Enter the email they signed up with to add them to your roster.
          </p>
          <EmailLinkForm action={addClientByEmail} placeholder="client@example.com" buttonLabel="Add client" />
        </div>

        {clients.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">
            No clients yet. Add one above to get started.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <Link key={c.id} href={`/clients/${c.id}`} className="card p-5 transition hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Avatar name={c.full_name || "Client"} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink-900">{c.full_name || "Unnamed"}</p>
                    <p className="truncate text-sm text-slate-500">{c.email}</p>
                  </div>
                </div>
                {c.goals && <p className="mt-3 line-clamp-2 text-sm text-slate-600">{c.goals}</p>}
              </Link>
            ))}
          </div>
        )}
      </>
    );
  }

  // Client view — show linked trainer(s).
  const { data } = await supabase
    .from("trainer_clients")
    .select("trainer:trainer_id(id, full_name, email, bio)")
    .eq("client_id", profile.id)
    .eq("status", "active");

  const trainers = (data ?? [])
    .map((r) => r.trainer as unknown as Profile)
    .filter(Boolean);

  return (
    <>
      <PageHeader title="My Trainer" subtitle="Your coaching connections." />

      {trainers.length === 0 ? (
        <div className="card mb-6 p-5">
          <h2 className="mb-1 font-semibold text-ink-900">Connect with your trainer</h2>
          <p className="mb-3 text-sm text-slate-500">
            Enter your trainer's email to send them a connection request.
          </p>
          <EmailLinkForm action={connectToTrainer} placeholder="trainer@example.com" buttonLabel="Send request" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {trainers.map((t) => (
            <div key={t.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar name={t.full_name || "Trainer"} size="lg" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-ink-900">{t.full_name}</p>
                  <p className="truncate text-sm text-slate-500">{t.email}</p>
                </div>
              </div>
              {t.bio && <p className="mt-3 text-sm text-slate-600">{t.bio}</p>}
              <div className="mt-4 flex gap-2">
                <Link href="/messages" className="btn-secondary flex-1">Message</Link>
                <Link href="/calendar" className="btn-primary flex-1">Book session</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
