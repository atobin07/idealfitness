"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createDiscussion } from "@/app/(app)/topic/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function NewTopicDialog({ hasActive }: { hasActive: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createDiscussion, undefined);

  if (state?.ok && open) {
    setOpen(false);
    state.ok = false;
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>+ New topic</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">Start a new topic</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            {hasActive && (
              <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Heads up: there&apos;s already an active topic. Consider wrapping it up with a conclusion first so the crew isn&apos;t split.
              </p>
            )}
            <form action={formAction} className="space-y-4">
              <div>
                <label className="label" htmlFor="prompt">The question</label>
                <input id="prompt" name="prompt" required className="input" placeholder="What's the best state? 🗺️" />
              </div>
              <div>
                <label className="label" htmlFor="details">Details (optional)</label>
                <textarea id="details" name="details" rows={3} className="input" placeholder="Set the stage, add some rules, stir the pot…" />
              </div>
              {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <SubmitButton className="btn-primary" pendingText="Posting…">Post topic</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
