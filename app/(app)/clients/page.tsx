import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { EmailLinkForm } from "@/components/EmailLinkForm";
import { addClientByEmail, connectToTrainer } from "@/app/(app)/clients/actions";
import { WEEKDAYS } from "@/lib/format";
import { CoachDirectory } from "@/components/CoachDirectory";
import type { Profile, MemberProfile, Availability } from "@/lib/database.types";

function hhmm(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${ap}`;
}

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
          <h2 className="mb-1 font-semibold text-ink-900 dark:text-white">Add a client</h2>
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
                    <p className="truncate font-semibold text-ink-900 dark:text-white">{c.full_name || "Unnamed"}</p>
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

  // Client view — show linked trainer(s) with a full profile.
  const [{ data }, { data: allCoaches }] = await Promise.all([
    supabase
      .from("trainer_clients")
      .select("trainer:trainer_id(id, full_name, email, bio, goals, avatar_url, phone, specialties)")
      .eq("client_id", profile.id)
      .eq("status", "active"),
    supabase
      .from("profiles")
      .select("id, full_name, email, bio, avatar_url, specialties")
      .eq("role", "trainer")
      .order("full_name"),
  ]);

  const trainers = (data ?? []).map((r) => r.trainer as unknown as Profile).filter(Boolean);
  const trainerIds = trainers.map((t) => t.id);
  const coaches = (allCoaches ?? []) as unknown as Profile[];

  let profiles: MemberProfile[] = [];
  let avails: Availability[] = [];
  if (trainerIds.length > 0) {
    const [{ data: mp }, { data: av }] = await Promise.all([
      supabase.from("member_profiles").select("*").in("user_id", trainerIds),
      supabase.from("availability").select("*").in("trainer_id", trainerIds).order("weekday").order("start_time"),
    ]);
    profiles = (mp ?? []) as MemberProfile[];
    avails = (av ?? []) as Availability[];
  }

  return (
    <>
      <PageHeader title="My Trainer" subtitle="Get to know the coach in your corner." />

      {trainers.length === 0 ? (
        <div className="card mb-6 p-5">
          <h2 className="mb-1 font-semibold text-ink-900 dark:text-white">Connect with your trainer</h2>
          <p className="mb-3 text-sm text-slate-500">Enter your trainer's email to send them a connection request.</p>
          <EmailLinkForm action={connectToTrainer} placeholder="trainer@example.com" buttonLabel="Send request" />
        </div>
      ) : (
        <div className="space-y-6">
          {trainers.map((t) => {
            const mp = profiles.find((p) => p.user_id === t.id);
            const days = WEEKDAYS.map((label, wd) => ({ label, slots: avails.filter((a) => a.trainer_id === t.id && a.weekday === wd) })).filter((d) => d.slots.length > 0);
            const facts = [
              { label: "Favorite movement", value: mp?.favorite_movement, emoji: "💪" },
              { label: "Walk-out song", value: mp?.favorite_workout_song, emoji: "🎧" },
              { label: "Favorite training day", value: mp?.favorite_training_day, emoji: "📆" },
              { label: "Hometown", value: mp?.hometown, emoji: "📍" },
              { label: "Fun fact", value: mp?.fun_fact, emoji: "✨" },
            ].filter((f) => f.value);

            return (
              <div key={t.id} className="card overflow-hidden">
                {/* Hero */}
                <div className="card-brand flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
                  <Avatar name={t.full_name || "Coach"} src={t.avatar_url} size="xl" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold text-white">{t.full_name}</h2>
                      <span className="badge bg-white/20 text-white ring-1 ring-white/25">Coach</span>
                    </div>
                    {t.bio && <p className="mt-1 text-sm text-white/90">{t.bio}</p>}
                    <p className="mt-1 text-xs text-white/70">{t.email}{t.phone ? ` · ${t.phone}` : ""}</p>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
                    <Link href={`/messages?with=${t.id}`} className="btn-on-brand flex-1 text-center">Message</Link>
                    <Link href="/calendar" className="flex-1 rounded-lg bg-white/15 px-4 py-2 text-center text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/25">Book a session</Link>
                  </div>
                </div>

                <div className="grid gap-6 p-6 md:grid-cols-2">
                  <div className="space-y-5">
                    {t.specialties?.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">Areas of expertise</h3>
                        <div className="flex flex-wrap gap-1.5">
                          {t.specialties.map((s) => (
                            <span key={s} className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {mp?.intro && (
                      <div>
                        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide muted">About</h3>
                        <p className="text-sm text-ink-900 dark:text-white">{mp.intro}</p>
                      </div>
                    )}
                    {t.goals && (
                      <div>
                        <h3 className="mb-1 text-sm font-semibold uppercase tracking-wide muted">Coaching philosophy</h3>
                        <p className="text-sm text-ink-900 dark:text-white">{t.goals}</p>
                      </div>
                    )}
                    {facts.length > 0 && (
                      <div>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">Good to know</h3>
                        <dl className="space-y-1.5">
                          {facts.map((f) => (
                            <div key={f.label} className="flex items-center justify-between gap-3 text-sm">
                              <dt className="muted">{f.emoji} {f.label}</dt>
                              <dd className="text-right font-medium text-ink-900 dark:text-white">{f.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide muted">Weekly availability</h3>
                    {days.length === 0 ? (
                      <p className="text-sm muted">Availability coming soon — reach out to book.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {days.map((d) => (
                          <div key={d.label} className="flex items-start gap-2 text-sm">
                            <span className="w-24 shrink-0 font-medium text-ink-900 dark:text-white">{d.label}</span>
                            <span className="flex flex-wrap gap-1">
                              {d.slots.map((s) => (
                                <span key={s.id} className="badge bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                                  {hhmm(s.start_time)}–{hhmm(s.end_time)}
                                </span>
                              ))}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Link href={`/members/${t.id}`} className="mt-4 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">View full profile →</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {coaches.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-ink-900 dark:text-white">Find a coach</h2>
          <p className="mb-4 text-sm muted">Filter by what you want to work on and book the coach who fits best.</p>
          <CoachDirectory coaches={coaches.map((c) => ({ id: c.id, full_name: c.full_name, bio: c.bio, avatar_url: c.avatar_url, specialties: c.specialties ?? [] }))} />
        </div>
      )}
    </>
  );
}
