"use client";

import { useFormState } from "react-dom";
import { addProgress } from "@/app/(app)/clients/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function AddProgressForm({
  clientId,
  today,
}: {
  clientId: string;
  today: string;
}) {
  const [state, formAction] = useFormState(addProgress, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="client_id" value={clientId} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
      </div>
      <div>
        <label className="label" htmlFor="notes">Notes</label>
        <textarea id="notes" name="notes" rows={2} className="input" placeholder="Session notes, PRs, how they felt…" />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{state.ok}</p>
      )}
      <SubmitButton className="btn-primary" pendingText="Saving…">Record progress</SubmitButton>
    </form>
  );
}
