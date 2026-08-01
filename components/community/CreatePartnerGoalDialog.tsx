"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createPartnerGoal } from "@/app/(app)/community/actions";
import { SubmitButton } from "@/components/SubmitButton";

type Person = { id: string; full_name: string };

export function CreatePartnerGoalDialog({ people }: { people: Person[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createPartnerGoal, undefined);

  if (state?.ok && open) {
    setOpen(false);
    state.ok = false;
  }

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>+ New partner goal</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">Set a shared goal</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost p-1" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form action={formAction} className="space-y-4">
              <div>
                <label className="label" htmlFor="g-title">Goal</label>
                <input id="g-title" name="title" required className="input" placeholder="50 combined check-ins" />
              </div>
              <div>
                <label className="label" htmlFor="g-partner">Partner</label>
                <select id="g-partner" name="partner_id" className="input" defaultValue="">
                  <option value="">Just me for now</option>
                  {people.map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label" htmlFor="g-metric">Counting</label>
                  <select id="g-metric" name="metric" className="input" defaultValue="checkins">
                    <option value="checkins">Check-ins</option>
                    <option value="sessions">Sessions</option>
                    <option value="classes">Classes</option>
                    <option value="workouts">Workouts</option>
                    <option value="points">Points</option>
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="g-target">Target</label>
                  <input id="g-target" name="target" type="number" min={1} className="input" defaultValue="50" />
                </div>
                <div>
                  <label className="label" htmlFor="g-days">By</label>
                  <select id="g-days" name="days" className="input" defaultValue="30">
                    <option value="14">2 weeks</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                  </select>
                </div>
              </div>
              {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
                <SubmitButton className="btn-primary" pendingText="Creating…">Create goal</SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
