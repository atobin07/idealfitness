"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/app/(app)/support/actions";

type Msg = { from: "bot" | "me"; text: string };
type Phase = "category" | "describe" | "urgency" | "confirm" | "sent";

const CATEGORIES = ["Billing & payments", "Scheduling & classes", "Facility & equipment", "App & tech", "Coaching", "Something else"];
const URGENCY: { value: string; label: string }[] = [
  { value: "low", label: "🟢 Low — whenever" },
  { value: "medium", label: "🟡 Medium — this week" },
  { value: "high", label: "🔴 High — need help now" },
];

export function SupportChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "Hey! I'm the iDEAL Fitness helper 🤖 What can we help you with today?" },
  ]);
  const [phase, setPhase] = useState<Phase>("category");
  const [category, setCategory] = useState("");
  const [details, setDetails] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, phase]);

  const say = (m: Msg) => setMessages((prev) => [...prev, m]);

  function pickCategory(c: string) {
    setCategory(c);
    say({ from: "me", text: c });
    say({ from: "bot", text: `Got it — ${c.toLowerCase()}. Tell me what's going on, with as much detail as you'd like.` });
    setPhase("describe");
  }

  function submitDetails() {
    const text = draft.trim();
    if (!text) return;
    setDetails(text);
    say({ from: "me", text });
    setDraft("");
    say({ from: "bot", text: "Thanks! How urgent is this?" });
    setPhase("urgency");
  }

  function pickUrgency(u: { value: string; label: string }) {
    setUrgency(u.value);
    say({ from: "me", text: u.label });
    setPhase("confirm");
    say({ from: "bot", text: "Here's the summary I'll send to the team. Look good?" });
  }

  const summary = `${category} (${urgency} priority): ${details}`;

  async function send() {
    setBusy(true);
    const fd = new FormData();
    fd.set("category", category);
    fd.set("subject", `${category}`);
    fd.set("summary", summary.slice(0, 300));
    fd.set("details", details);
    fd.set("urgency", urgency);
    const res = await createTicket(fd);
    setBusy(false);
    if (res.error) { say({ from: "bot", text: `Hmm, something went wrong: ${res.error}` }); return; }
    setPhase("sent");
    say({ from: "bot", text: "✅ Sent! The owner's been notified and someone will follow up soon. You can track it below. Anything else?" });
    router.refresh();
  }

  function restart() {
    setMessages([{ from: "bot", text: "No problem — what else can we help with?" }]);
    setCategory(""); setDetails(""); setUrgency("medium"); setDraft("");
    setPhase("category");
  }

  return (
    <div className="card flex h-[560px] flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 dark:border-white/10">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">🤖</span>
        <div>
          <p className="text-sm font-semibold text-ink-900 dark:text-white">Support helper</p>
          <p className="text-xs muted">Answers a few questions, then files a ticket for you</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${m.from === "me" ? "rounded-br-sm bg-brand-600 text-white" : "rounded-bl-sm bg-slate-100 text-ink-900 dark:bg-white/10 dark:text-slate-100"}`}>
              {m.text}
            </div>
          </div>
        ))}

        {phase === "confirm" && (
          <div className="rounded-xl border border-brand-200 bg-brand-50 p-3 text-sm dark:border-brand-500/30 dark:bg-brand-500/10">
            <p className="font-semibold text-ink-900 dark:text-white">{category} · <span className="uppercase">{urgency}</span> priority</p>
            <p className="mt-1 text-ink-900 dark:text-white">{details}</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Controls */}
      <div className="border-t border-slate-200 p-3 dark:border-white/10">
        {phase === "category" && (
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => pickCategory(c)} className="btn-secondary text-sm">{c}</button>
            ))}
          </div>
        )}
        {phase === "describe" && (
          <div className="flex items-end gap-2">
            <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={1} placeholder="Describe the issue…" className="input max-h-28 min-h-[42px] flex-1 resize-none"
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitDetails(); } }} />
            <button onClick={submitDetails} disabled={!draft.trim()} className="btn-primary h-[42px]">Send</button>
          </div>
        )}
        {phase === "urgency" && (
          <div className="flex flex-wrap gap-2">
            {URGENCY.map((u) => (
              <button key={u.value} onClick={() => pickUrgency(u)} className="btn-secondary text-sm">{u.label}</button>
            ))}
          </div>
        )}
        {phase === "confirm" && (
          <div className="flex gap-2">
            <button onClick={restart} className="btn-secondary">Start over</button>
            <button onClick={send} disabled={busy} className="btn-primary flex-1">{busy ? "Sending…" : "Send to the team"}</button>
          </div>
        )}
        {phase === "sent" && (
          <button onClick={restart} className="btn-secondary w-full">Start a new ticket</button>
        )}
      </div>
    </div>
  );
}
