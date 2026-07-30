"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/database.types";

export function MessageThread({
  initial,
  myId,
  otherId,
}: {
  initial: Message[];
  myId: string;
  otherId: string;
}) {
  const [thread, setThread] = useState<Message[]>(initial);
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
          const m = payload.new as Message;
          if (m.sender_id === otherId) setThread((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, otherId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.length]);

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      {thread.length === 0 && <p className="m-auto text-sm text-slate-400">No messages yet. Say hello 👋</p>}
      {thread.map((m) => {
        const mine = m.sender_id === myId;
        return (
          <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                mine
                  ? "rounded-br-sm bg-brand-600 text-white"
                  : "rounded-bl-sm bg-slate-100 text-ink-900 dark:bg-white/10 dark:text-slate-100"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className={`mt-1 text-[10px] ${mine ? "text-brand-100" : "text-slate-400"}`}>
                {format(new Date(m.created_at), "MMM d, h:mm a")}
              </p>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
