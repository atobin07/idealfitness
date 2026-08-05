"use client";

import { useFormState } from "react-dom";
import { changePassword } from "@/app/(app)/settings/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function PasswordForm() {
  const [state, formAction] = useFormState(changePassword, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label" htmlFor="cur-pw">Current password</label>
        <input id="cur-pw" name="current_password" type="password" required autoComplete="current-password" className="input" placeholder="••••••••" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="new-pw">New password</label>
          <input id="new-pw" name="password" type="password" required minLength={6} autoComplete="new-password" className="input" placeholder="At least 6 characters" />
        </div>
        <div>
          <label className="label" htmlFor="conf-pw">Confirm new password</label>
          <input id="conf-pw" name="confirm" type="password" required minLength={6} autoComplete="new-password" className="input" placeholder="••••••••" />
        </div>
      </div>
      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-500/10">Password updated ✓</p>}
      <SubmitButton className="btn-primary" pendingText="Updating…">Update password</SubmitButton>
    </form>
  );
}
