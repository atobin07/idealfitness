"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { saveClientNotes } from "@/app/(app)/clients/actions";

const PRESETS = ["VIP", "At-risk", "Injury", "New", "Weight loss", "Strength", "Prepaid"];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

export function ClientNotes({
  clientId,
  initialNotes,
  initialTags,
}: {
  clientId: string;
  initialNotes: string;
  initialTags: string[];
}) {
  const [state, action] = useFormState(saveClientNotes, undefined);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [draft, setDraft] = useState("");

  function addTag(t: string) {
    const v = t.trim();
    if (v && !tags.some((x) => x.toLowerCase() === v.toLowerCase())) setTags([...tags, v]);
    setDraft("");
  }

  return (
    <form action={action} className="rounded-2xl bg-white p-5 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.08)] dark:bg-ink-800 dark:ring-1 dark:ring-white/10">
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="tags" value={tags.join(",")} />

      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink-900 dark:text-white">Private notes & flags</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/10 dark:text-slate-400">🔒 Only you</span>
      </div>

      {/* Tag chips */}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200/70 dark:bg-brand-500/15 dark:text-brand-200 dark:ring-brand-500/20">
            {t}
            <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} className="text-brand-400 hover:text-brand-700" aria-label={`Remove ${t}`}>×</button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-xs text-slate-400">No flags yet.</span>}
      </div>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(draft); } }}
          placeholder="Add a flag…"
          className="input h-8 w-32 py-1 text-xs"
        />
        {PRESETS.filter((p) => !tags.some((t) => t.toLowerCase() === p.toLowerCase())).map((p) => (
          <button key={p} type="button" onClick={() => addTag(p)} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-200 dark:bg-white/5 dark:text-slate-400 dark:hover:bg-white/10">
            + {p}
          </button>
        ))}
      </div>

      <textarea
        name="notes"
        rows={4}
        defaultValue={initialNotes}
        placeholder="Injuries, goals, preferences, reminders — anything you want to remember about this client."
        className="input resize-none"
      />

      <div className="mt-3 flex items-center justify-end gap-3">
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm font-medium text-emerald-600">✓ Saved</p>}
        <SaveButton />
      </div>
    </form>
  );
}
