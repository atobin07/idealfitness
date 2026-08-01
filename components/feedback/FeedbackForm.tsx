"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { submitFeedback } from "@/app/(app)/feedback/actions";
import { SubmitButton } from "@/components/SubmitButton";

type Trainer = { id: string; full_name: string };

export function FeedbackForm({ trainers }: { trainers: Trainer[] }) {
  const [state, formAction] = useFormState(submitFeedback, undefined);
  const [audience, setAudience] = useState("owner");
  const [anon, setAnon] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label">Who&apos;s this for?</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { v: "owner", l: "Owner" },
            { v: "trainer", l: "A trainer" },
            { v: "staff", l: "Staff (general)" },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setAudience(o.v)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium ${audience === o.v ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300" : "border-slate-200 text-slate-600 dark:border-white/10 dark:text-slate-300"}`}
            >
              {o.l}
            </button>
          ))}
        </div>
        <input type="hidden" name="audience" value={audience} />
      </div>

      {audience === "trainer" && (
        <div>
          <label className="label" htmlFor="trainer_id">Which trainer?</label>
          <select id="trainer_id" name="trainer_id" className="input" defaultValue="">
            <option value="" disabled>Pick a trainer…</option>
            {trainers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="label" htmlFor="category">Topic (optional)</label>
        <select id="category" name="category" className="input" defaultValue="">
          <option value="">General</option>
          <option value="Coaching">Coaching</option>
          <option value="Classes">Classes</option>
          <option value="Facility">Facility</option>
          <option value="Scheduling">Scheduling</option>
          <option value="Billing">Billing</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="body">Your feedback</label>
        <textarea id="body" name="body" required rows={5} className="input" placeholder="Be honest — this is how we get better. The good, the bad, and the ideas." />
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10">
        <input type="checkbox" name="anonymous" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" />
        <span className="text-sm">
          <span className="font-medium text-ink-900 dark:text-white">Send anonymously</span>
          <span className="block text-xs muted">
            {anon ? "Your name won't be attached — not even we can see who sent it." : "Your name will be shared so we can follow up."}
          </span>
        </span>
      </label>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">Thank you — your feedback is in. 🙏</p>}

      <SubmitButton className="btn-primary w-full" pendingText="Sending…">Send feedback</SubmitButton>
    </form>
  );
}
