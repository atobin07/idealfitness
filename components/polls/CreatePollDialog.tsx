"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createPoll } from "@/app/(app)/polls/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function CreatePollDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createPoll, undefined);
  const [optionCount, setOptionCount] = useState(3);

  if (state?.ok && open) {
    setOpen(false);
    state.ok = false;
    setOptionCount(3);
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>+ New poll</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">Ask the members</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form action={formAction} className="space-y-4">
              <div>
                <label className="label" htmlFor="pl-q">Question</label>
                <input id="pl-q" name="question" required className="input" placeholder="What new class should we add?" />
              </div>
              <div>
                <label className="label" htmlFor="pl-d">Context <span className="muted">(optional)</span></label>
                <input id="pl-d" name="description" className="input" placeholder="We're planning next quarter's schedule." />
              </div>
              <div>
                <label className="label">Options</label>
                <div className="space-y-2">
                  {Array.from({ length: optionCount }).map((_, i) => (
                    <input key={i} name="option" className="input" placeholder={`Option ${i + 1}`} required={i < 2} />
                  ))}
                </div>
                {optionCount < 10 && (
                  <button type="button" onClick={() => setOptionCount((n) => n + 1)} className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
                    + Add option
                  </button>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-900 dark:text-white">
                <input type="checkbox" name="allow_multiple" className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Let members choose more than one
              </label>
              <div>
                <label className="label" htmlFor="pl-close">Auto-close date <span className="muted">(optional)</span></label>
                <input id="pl-close" name="closes_at" type="date" className="input" />
              </div>
              {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <SubmitButton className="btn-primary" pendingText="Posting…">Post poll</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
