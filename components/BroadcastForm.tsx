"use client";

import { useFormState, useFormStatus } from "react-dom";
import { sendBroadcast } from "@/app/(app)/broadcast/actions";

type ClassOption = { id: string; label: string; booked: number };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? "Sending…" : "Send broadcast"}
    </button>
  );
}

export function BroadcastForm({ clientCount, classes }: { clientCount: number; classes: ClassOption[] }) {
  const [state, action] = useFormState(sendBroadcast, undefined);

  return (
    <form
      action={action}
      key={state?.sent} // reset the textarea after a successful send
      className="overflow-hidden rounded-2xl bg-white p-5 shadow-[0_4px_14px_-2px_rgba(15,23,42,0.08),0_24px_56px_-16px_rgba(15,23,42,0.28)] dark:bg-ink-800 dark:shadow-none dark:ring-1 dark:ring-white/10"
    >
      <label className="label">Send to</label>
      <select name="audience" className="input" defaultValue="all_clients">
        <option value="all_clients">All my clients ({clientCount})</option>
        {classes.length > 0 && <option disabled>──── a class roster ────</option>}
        {classes.map((c) => (
          <option key={c.id} value={`class:${c.id}`}>{c.label} · {c.booked} booked</option>
        ))}
      </select>

      <label className="label mt-4">Message</label>
      <textarea
        name="body"
        rows={5}
        required
        placeholder="e.g. Heads up — tonight's 6pm HIIT is moved to 6:30. See you there! 💪"
        className="input resize-none"
      />

      {state?.error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>}
      {state?.sent != null && (
        <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
          ✓ Sent to {state.sent} {state.sent === 1 ? "person" : "people"}.
        </p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-400">Delivered as a direct message from you. Everyone replies privately.</p>
        <SubmitButton />
      </div>
    </form>
  );
}
