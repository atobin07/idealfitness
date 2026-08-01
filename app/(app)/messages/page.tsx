import Link from "next/link";
import { format } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { MessageComposer } from "@/components/MessageComposer";
import { MessageThread, type ChatMessage } from "@/components/MessageThread";
import { markConversationRead } from "@/app/(app)/messages/actions";
import type { Profile } from "@/lib/database.types";

type Contact = { id: string; full_name: string; email: string | null };

async function loadContacts(profileId: string, role: string): Promise<Contact[]> {
  const supabase = await createClient();
  const map = new Map<string, Contact>();

  // Linked people via trainer_clients.
  const col = role === "trainer" ? "client_id" : "trainer_id";
  const sel =
    role === "trainer"
      ? "client:client_id(id, full_name, email)"
      : "trainer:trainer_id(id, full_name, email)";
  const filter = role === "trainer" ? "trainer_id" : "client_id";
  const { data: links } = await supabase
    .from("trainer_clients")
    .select(sel)
    .eq(filter, profileId);
  for (const row of links ?? []) {
    const p = (role === "trainer" ? (row as any).client : (row as any).trainer) as Contact;
    if (p?.id) map.set(p.id, p);
  }

  // Anyone we've exchanged messages with.
  const { data: msgs } = await supabase
    .from("messages")
    .select("sender_id, recipient_id, sender:sender_id(id, full_name, email), recipient:recipient_id(id, full_name, email)")
    .or(`sender_id.eq.${profileId},recipient_id.eq.${profileId}`)
    .order("created_at", { ascending: false })
    .limit(100);
  for (const m of msgs ?? []) {
    const other =
      (m as any).sender_id === profileId ? (m as any).recipient : (m as any).sender;
    if (other?.id && other.id !== profileId) map.set(other.id, other);
  }

  void col;
  return [...map.values()];
}

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ with?: string }>;
}) {
  const { with: withId } = await searchParams;
  const profile = await requireProfile();
  const supabase = await createClient();

  const contacts = await loadContacts(profile.id, profile.role);
  const activeId = withId && contacts.some((c) => c.id === withId) ? withId : contacts[0]?.id;
  const active = contacts.find((c) => c.id === activeId);

  let thread: ChatMessage[] = [];
  if (activeId) {
    const { data } = await supabase
      .from("messages")
      .select("*, message_reactions(emoji, user_id)")
      .or(
        `and(sender_id.eq.${profile.id},recipient_id.eq.${activeId}),and(sender_id.eq.${activeId},recipient_id.eq.${profile.id})`
      )
      .order("created_at", { ascending: true })
      .limit(200);
    thread = (data ?? []) as unknown as ChatMessage[];
    await markConversationRead(activeId);
  }

  return (
    <>
      <PageHeader title="Messages" subtitle="Direct messages with your trainers and clients." />

      <div className="grid h-[72vh] grid-cols-1 overflow-hidden rounded-2xl bg-white shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08),0_24px_56px_-16px_rgba(15,23,42,0.30)] dark:bg-ink-800 dark:shadow-[0_18px_50px_-20px_rgba(0,0,0,0.8)] dark:ring-1 dark:ring-white/10 md:grid-cols-[300px_1fr]">
        {/* Contacts */}
        <div className={`${active ? "hidden md:flex" : "flex"} min-h-0 flex-col bg-slate-50/70 dark:bg-white/[0.02]`}>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {contacts.length === 0 && (
              <p className="p-5 text-sm text-slate-500">
                No contacts yet. Connect with a {profile.role === "trainer" ? "client" : "trainer"} first.
              </p>
            )}
            {contacts.map((c) => {
              const isActive = c.id === activeId;
              return (
                <Link
                  key={c.id}
                  href={`/messages?with=${c.id}`}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    isActive
                      ? "bg-white shadow-sm ring-1 ring-slate-900/5 dark:bg-white/10 dark:ring-white/10"
                      : "hover:bg-white/70 dark:hover:bg-white/5"
                  }`}
                >
                  <Avatar name={c.full_name || "?"} size="sm" />
                  <div className="min-w-0">
                    <p className={`truncate text-sm font-semibold ${isActive ? "text-brand-700 dark:text-brand-200" : "text-ink-900 dark:text-white"}`}>{c.full_name || "Unnamed"}</p>
                    <p className="truncate text-xs text-slate-400">{c.email}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-0 flex-col bg-white dark:bg-ink-800">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white shadow-lg shadow-brand-600/30">
                <svg className="h-9 w-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.83l-5 1.66 1.66-4A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <div>
                <p className="text-lg font-bold text-ink-900 dark:text-white">Your messages</p>
                <p className="mt-1 max-w-xs text-sm text-slate-500">Choose a {profile.role === "trainer" ? "client" : "trainer"} on the left to start the conversation.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-4 py-3 shadow-[0_1px_0_rgba(15,23,42,0.05)] dark:shadow-[0_1px_0_rgba(255,255,255,0.06)]">
                <Link href="/messages" className="md:hidden">
                  <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <Avatar name={active.full_name || "?"} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900 dark:text-white">{active.full_name}</p>
                  <p className="truncate text-xs text-slate-400">{active.email}</p>
                </div>
              </div>

              <MessageThread initial={thread} myId={profile.id} otherId={active.id} />

              <MessageComposer
                recipientId={active.id}
                myId={profile.id}
                members={contacts.map((c) => ({ id: c.id, full_name: c.full_name }))}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
