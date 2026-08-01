"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toggleReaction } from "@/app/(app)/messages/actions";
import { fontClass } from "@/lib/messageFonts";

type Reaction = { emoji: string; user_id: string };
export type ChatMessage = {
  id: string; sender_id: string; recipient_id: string; body: string | null; created_at: string; read_at: string | null;
  attachment_url: string | null; attachment_type: string | null; attachment_name: string | null; font: string;
  message_reactions?: Reaction[];
};

const QUICK = ["👍", "❤️", "😂", "🔥", "🙌"];

function renderBody(text: string) {
  return text.split(/(@\w+)/g).map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-semibold text-brand-600 dark:text-brand-300">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function MessageThread({ initial, myId, otherId }: { initial: ChatMessage[]; myId: string; otherId: string }) {
  const [thread, setThread] = useState<ChatMessage[]>(initial);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => setThread(initial), [initial]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`thread:${myId}:${otherId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `recipient_id=eq.${myId}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          if (m.sender_id === otherId) setThread((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [myId, otherId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [thread.length]);

  const lastMine = [...thread].reverse().find((m) => m.sender_id === myId);

  return (
    <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
      {thread.length === 0 && (
        <div className="m-auto flex max-w-xs flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl dark:bg-brand-500/15">👋</div>
          <div>
            <p className="font-semibold text-ink-900 dark:text-white">No messages yet</p>
            <p className="text-sm text-slate-500">Say hello and start the conversation.</p>
          </div>
        </div>
      )}
      {thread.map((m) => {
        const mine = m.sender_id === myId;
        const reactions = m.message_reactions ?? [];
        const grouped = reactions.reduce<Record<string, number>>((a, r) => ((a[r.emoji] = (a[r.emoji] ?? 0) + 1), a), {});
        const isImage = m.attachment_type === "image" || m.attachment_type === "gif";
        return (
          <div key={m.id} className={`group flex flex-col ${mine ? "items-end" : "items-start"}`}>
            <div className={`flex items-center gap-1 ${mine ? "flex-row-reverse" : ""}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${mine ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-slate-100 text-ink-900 dark:bg-white/10 dark:text-slate-100"}`}>
                {m.attachment_url && isImage && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={m.attachment_url} alt="" className="mb-1 max-h-64 rounded-lg" />
                )}
                {m.attachment_url && !isImage && (
                  <a href={m.attachment_url} target="_blank" rel="noreferrer" className={`mb-1 flex items-center gap-2 rounded-lg px-2 py-1.5 ${mine ? "bg-white/15" : "bg-white dark:bg-white/10"}`}>
                    <span className="text-lg">📎</span>
                    <span className="truncate text-xs underline">{m.attachment_name || "Download"}</span>
                  </a>
                )}
                {m.body && <p className={`whitespace-pre-wrap ${fontClass(m.font)}`}>{renderBody(m.body)}</p>}
                <p className={`mt-1 text-[10px] ${mine ? "text-brand-100" : "text-slate-400"}`}>{format(new Date(m.created_at), "MMM d, h:mm a")}</p>
              </div>

              {/* Quick-react toolbar */}
              <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                {QUICK.map((e) => (
                  <form key={e} action={toggleReaction}>
                    <input type="hidden" name="message_id" value={m.id} />
                    <input type="hidden" name="emoji" value={e} />
                    <button className="rounded-full p-0.5 text-sm hover:scale-125" aria-label={`React ${e}`}>{e}</button>
                  </form>
                ))}
              </div>
            </div>

            {/* Reaction chips */}
            {Object.keys(grouped).length > 0 && (
              <div className={`mt-0.5 flex flex-wrap gap-1 ${mine ? "justify-end" : ""}`}>
                {Object.entries(grouped).map(([emoji, count]) => {
                  const iReacted = reactions.some((r) => r.emoji === emoji && r.user_id === myId);
                  return (
                    <form key={emoji} action={toggleReaction}>
                      <input type="hidden" name="message_id" value={m.id} />
                      <input type="hidden" name="emoji" value={emoji} />
                      <button className={`flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-xs ${iReacted ? "border-brand-300 bg-brand-50 dark:border-brand-500/40 dark:bg-brand-500/15" : "border-slate-200 bg-white dark:border-white/10 dark:bg-white/5"}`}>
                        <span>{emoji}</span><span className="text-[10px] muted">{count}</span>
                      </button>
                    </form>
                  );
                })}
              </div>
            )}

            {mine && m.id === lastMine?.id && (
              <p className="mt-0.5 text-[10px] text-slate-400">{m.read_at ? "Seen" : "Sent"}</p>
            )}
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
