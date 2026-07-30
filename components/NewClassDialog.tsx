"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createClass } from "@/app/(app)/classes/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function NewClassDialog({ defaultDate }: { defaultDate: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createClass, undefined);

  if (state?.ok && open) {
    setOpen(false);
    state.ok = false;
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        New class
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Create a class</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form action={formAction} className="space-y-4">
              <div>
                <label className="label" htmlFor="title">Title</label>
                <input id="title" name="title" required className="input" placeholder="HIIT Bootcamp" />
              </div>
              <div>
                <label className="label" htmlFor="description">Description</label>
                <textarea id="description" name="description" rows={2} className="input" placeholder="What to expect…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="date">Date</label>
                  <input id="date" name="date" type="date" required className="input" defaultValue={defaultDate} />
                </div>
                <div>
                  <label className="label" htmlFor="time">Start</label>
                  <input id="time" name="time" type="time" required className="input" defaultValue="18:00" step={900} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label" htmlFor="duration">Duration</label>
                  <select id="duration" name="duration" className="input" defaultValue="60">
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                    <option value="90">90 min</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="capacity">Capacity</label>
                  <input id="capacity" name="capacity" type="number" min={1} className="input" defaultValue="12" />
                </div>
                <div>
                  <label className="label" htmlFor="location">Location</label>
                  <input id="location" name="location" className="input" placeholder="Studio A" />
                </div>
              </div>
              {state?.error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <SubmitButton className="btn-primary" pendingText="Creating…">Create class</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
