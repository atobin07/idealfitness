"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createContest } from "@/app/(app)/contests/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function CreateContestDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createContest, undefined);

  if (state?.ok && open) {
    setOpen(false);
    state.ok = false;
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>+ Start a contest</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">Start a gym-wide contest</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form action={formAction} className="space-y-4">
              <div>
                <label className="label" htmlFor="ct-title">Contest name</label>
                <input id="ct-title" name="title" required className="input" placeholder="Summer Shred Challenge" />
              </div>
              <div>
                <label className="label" htmlFor="ct-desc">What is it? How do you win?</label>
                <textarea id="ct-desc" name="description" rows={3} className="input" placeholder="Log the most check-ins this month. Bring a friend for bonus entries…" />
              </div>
              <div>
                <label className="label" htmlFor="ct-prize">🏆 Prize / reward</label>
                <input id="ct-prize" name="prize" className="input" placeholder="1 free month + a gym hoodie" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="ct-start">Starts</label>
                  <input id="ct-start" name="starts_at" type="date" className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="ct-end">Ends</label>
                  <input id="ct-end" name="ends_at" type="date" className="input" />
                </div>
              </div>
              {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <SubmitButton className="btn-primary" pendingText="Starting…">Launch contest</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
