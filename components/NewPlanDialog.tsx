"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createPlan } from "@/app/(app)/workouts/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function NewPlanDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createPlan, undefined);

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New program
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl">
            <h2 className="mb-4 text-lg font-bold">New workout program</h2>
            <form action={formAction} className="space-y-4">
              <div>
                <label className="label" htmlFor="name">Program name</label>
                <input id="name" name="name" required className="input" placeholder="Foundational Strength" />
              </div>
              <div>
                <label className="label" htmlFor="description">Description</label>
                <textarea id="description" name="description" rows={2} className="input" placeholder="Goal & overview…" />
              </div>
              <div>
                <label className="label" htmlFor="weeks">Length (weeks)</label>
                <input id="weeks" name="weeks" type="number" min={1} max={52} className="input" defaultValue="4" />
              </div>
              {state?.error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <SubmitButton className="btn-primary" pendingText="Creating…">Create & build</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
