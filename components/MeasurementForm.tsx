"use client";

import { useRef } from "react";
import { useFormState } from "react-dom";
import { addMeasurement } from "@/app/(app)/progress/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function MeasurementForm({ today }: { today: string }) {
  const [state, formAction] = useFormState(addMeasurement, undefined);
  const ref = useRef<HTMLFormElement>(null);
  if (state?.ok) {
    ref.current?.reset();
    state.ok = false;
  }

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="recorded_at">Date</label>
          <input id="recorded_at" name="recorded_at" type="date" defaultValue={today} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="weight_kg">Weight (kg)</label>
          <input id="weight_kg" name="weight_kg" type="number" step="0.1" className="input" placeholder="—" />
        </div>
        <div>
          <label className="label" htmlFor="body_fat_pct">Body fat (%)</label>
          <input id="body_fat_pct" name="body_fat_pct" type="number" step="0.1" className="input" placeholder="—" />
        </div>
        <div>
          <label className="label" htmlFor="chest_cm">Chest (cm)</label>
          <input id="chest_cm" name="chest_cm" type="number" step="0.1" className="input" placeholder="—" />
        </div>
        <div>
          <label className="label" htmlFor="waist_cm">Waist (cm)</label>
          <input id="waist_cm" name="waist_cm" type="number" step="0.1" className="input" placeholder="—" />
        </div>
        <div>
          <label className="label" htmlFor="hips_cm">Hips (cm)</label>
          <input id="hips_cm" name="hips_cm" type="number" step="0.1" className="input" placeholder="—" />
        </div>
        <div>
          <label className="label" htmlFor="arms_cm">Arms (cm)</label>
          <input id="arms_cm" name="arms_cm" type="number" step="0.1" className="input" placeholder="—" />
        </div>
        <div>
          <label className="label" htmlFor="thighs_cm">Thighs (cm)</label>
          <input id="thighs_cm" name="thighs_cm" type="number" step="0.1" className="input" placeholder="—" />
        </div>
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>
      )}
      <SubmitButton className="btn-primary" pendingText="Saving…">Log measurement</SubmitButton>
    </form>
  );
}
