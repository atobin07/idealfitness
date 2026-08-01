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

      <div className="card grid h-[70vh] grid-cols-1 overflow-hidden md:grid-cols-[280px_1fr]">
        {/* Contacts */}
        <div className={`${active ? "hidden md:block" : "block"} border-r border-slate-200 dark:border-white/10`}>
          <div className="max-h-full overflow-y-auto">
            {contacts.length === 0 && (
              <p className="p-5 text-sm text-slate-500">
                No contacts yet. Connect with a {profile.role === "trainer" ? "client" : "trainer"} first.
              </p>
            )}
            {contacts.map((c) => (
              <Link
                key={c.id}
                href={`/messages?with=${c.id}`}
                className={`flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 ${
                  c.id === activeId ? "bg-brand-50" : ""
                }`}
              >
                <Avatar name={c.full_name || "?"} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink-900 dark:text-white">{c.full_name || "Unnamed"}</p>
                  <p className="truncate text-xs text-slate-500">{c.email}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Thread */}
        <div className="flex min-h-0 flex-col">
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-slate-500">
              Select a conversation to start messaging.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
                <Link href="/messages" className="md:hidden">
                  <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
                <Avatar name={active.full_name || "?"} size="sm" />
                <p className="font-semibold text-ink-900 dark:text-white">{active.full_name}</p>
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
