"use client";

import { useRef } from "react";
import { useFormState } from "react-dom";
import { createExercise } from "@/app/(app)/exercises/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function NewExerciseForm() {
  const [state, formAction] = useFormState(createExercise, undefined);
  const ref = useRef<HTMLFormElement>(null);
  if (state?.ok) {
    ref.current?.reset();
    state.ok = false;
  }

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Name</label>
          <input id="name" name="name" required className="input" placeholder="Back Squat" />
        </div>
        <div>
          <label className="label" htmlFor="category">Category</label>
          <input id="category" name="category" className="input" placeholder="Strength" />
        </div>
        <div>
          <label className="label" htmlFor="muscle_group">Muscle group</label>
          <input id="muscle_group" name="muscle_group" className="input" placeholder="Legs" />
        </div>
        <div>
          <label className="label" htmlFor="equipment">Equipment</label>
          <input id="equipment" name="equipment" className="input" placeholder="Barbell" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="description">Cues / description</label>
        <textarea id="description" name="description" rows={2} className="input" placeholder="Coaching cues…" />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>
      )}
      <SubmitButton className="btn-primary" pendingText="Adding…">Add exercise</SubmitButton>
    </form>
  );
}
