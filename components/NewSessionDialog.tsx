"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { createSession } from "@/app/(app)/calendar/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { UserRole } from "@/lib/database.types";

type Person = { id: string; full_name: string };

export function NewSessionDialog({
  role,
  people,
  defaultDate,
}: {
  role: UserRole;
  people: Person[];
  defaultDate: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createSession, undefined);

  // Close and reset on success.
  if (state?.ok && open) {
    setOpen(false);
    state.ok = false;
  }

  const counterpartLabel = role === "trainer" ? "Client" : "Trainer";

  return (
    <>
      <button className="btn-primary" onClick={() => setOpen(true)}>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Book session
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-xl dark:bg-ink-800 sm:rounded-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-900 dark:text-white">Book a session</h2>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10" aria-label="Close">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {people.length === 0 ? (
              <p className="rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-700">
                {role === "trainer"
                  ? "You have no clients yet. Add a client from the Clients page first."
                  : "You aren't linked to a trainer yet. Ask your trainer to add you, or connect from the My Trainer page."}
              </p>
            ) : (
              <form action={formAction} className="space-y-4">
                <div>
                  <label className="label" htmlFor="counterpart_id">{counterpartLabel}</label>
                  <select id="counterpart_id" name="counterpart_id" required className="input" defaultValue="">
                    <option value="" disabled>
                      Select a {counterpartLabel.toLowerCase()}…
                    </option>
                    {people.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label" htmlFor="title">Session title</label>
                  <input id="title" name="title" className="input" placeholder="Strength & conditioning" defaultValue="Training session" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="date">Date</label>
                    <input id="date" name="date" type="date" required className="input" defaultValue={defaultDate} />
                  </div>
                  <div>
                    <label className="label" htmlFor="time">Start time</label>
                    <input id="time" name="time" type="time" required className="input" defaultValue="09:00" step={900} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                    <label className="label" htmlFor="location">Location</label>
                    <input id="location" name="location" className="input" placeholder="Optional" />
                  </div>
                </div>

                {state?.error && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
                    Cancel
                  </button>
                  <SubmitButton className="btn-primary" pendingText="Booking…">
                    Book session
                  </SubmitButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
