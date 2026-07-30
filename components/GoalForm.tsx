"use client";

import { useState, useRef } from "react";
import { useFormState } from "react-dom";
import { createGoal } from "@/app/(app)/progress/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function GoalForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(createGoal, undefined);
  const ref = useRef<HTMLFormElement>(null);
  if (state?.ok && open) {
    ref.current?.reset();
    setOpen(false);
    state.ok = false;
  }

  if (!open) {
    return (
      <button className="btn-secondary w-full" onClick={() => setOpen(true)}>
        + Add a goal
      </button>
    );
  }

  return (
    <form ref={ref} action={formAction} className="card space-y-3 p-4">
      <input name="title" required className="input" placeholder="Goal (e.g. Run a sub-30 5k)" />
      <div className="grid grid-cols-2 gap-2">
        <input name="metric" className="input" placeholder="Metric (5k time)" />
        <input name="unit" className="input" placeholder="Unit (min)" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <input name="start_value" type="number" step="any" className="input" placeholder="Start" />
        <input name="current_value" type="number" step="any" className="input" placeholder="Current" />
        <input name="target_value" type="number" step="any" className="input" placeholder="Target" />
      </div>
      <input name="target_date" type="date" className="input" />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
        <SubmitButton className="btn-primary" pendingText="Adding…">Add goal</SubmitButton>
      </div>
    </form>
  );
}
