import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { relativeTime } from "@/lib/format";
import type { Profile } from "@/lib/database.types";

type Person = { id: string; full_name: string; avatar_url: string | null };
type Row = {
  sender_id: string; recipient_id: string; body: string | null; created_at: string; read_at: string | null;
  sender: Person | null; recipient: Person | null;
};

/** Compact "recent conversations" widget for the dashboard overview. */
export async function MessagesOverview({ profile }: { profile: Profile }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("sender_id, recipient_id, body, created_at, read_at, sender:sender_id(id, full_name, avatar_url), recipient:recipient_id(id, full_name, avatar_url)")
    .or(`sender_id.eq.${profile.id},recipient_id.eq.${profile.id}`)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as unknown as Row[];

  // Collapse to the latest message per conversation partner, tallying unread.
  const convos = new Map<string, { other: Person; body: string; at: string; unread: number }>();
  for (const m of rows) {
    const iAmSender = m.sender_id === profile.id;
    const other = (iAmSender ? m.recipient : m.sender) as Person | null;
    if (!other?.id || other.id === profile.id) continue;
    const isUnread = m.recipient_id === profile.id && !m.read_at;
    const existing = convos.get(other.id);
    if (existing) {
      if (isUnread) existing.unread += 1;
    } else {
      convos.set(other.id, { other, body: m.body ?? "", at: m.created_at, unread: isUnread ? 1 : 0 });
    }
  }
  const list = [...convos.values()].slice(0, 4);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-900 dark:text-white">Messages</h2>
        <Link href="/messages" className="text-sm font-medium text-brand-600 hover:text-brand-700">Open →</Link>
      </div>
      <div className="card divide-rows">
        {list.length === 0 && <p className="p-5 text-sm muted">No conversations yet.</p>}
        {list.map((c) => (
          <Link key={c.other.id} href={`/messages?with=${c.other.id}`} className="flex items-center gap-3 p-3.5 transition hover:bg-slate-50/70 dark:hover:bg-white/5">
            <Avatar name={c.other.full_name || "Member"} src={c.other.avatar_url} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className={`truncate text-sm ${c.unread ? "font-bold text-ink-900 dark:text-white" : "font-medium text-ink-900 dark:text-white"}`}>{c.other.full_name || "Member"}</p>
                <span className="shrink-0 text-xs muted">{relativeTime(c.at)}</span>
              </div>
              <p className={`truncate text-xs ${c.unread ? "font-semibold text-ink-700 dark:text-slate-200" : "muted"}`}>{c.body || "—"}</p>
            </div>
            {c.unread > 0 && <span className="badge bg-brand-500 text-white">{c.unread}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}
