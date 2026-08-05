"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { updatePassword } from "@/app/auth/actions";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";

export default function ResetPasswordPage() {
  const [state, formAction] = useFormState(updatePassword, undefined);

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a new password to finish resetting your account."
      footer={
        <>
          Back to{" "}
          <Link href="/login" className="font-semibold text-brand-300 hover:text-brand-200">
            sign in
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="password">New password</label>
          <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className="input" placeholder="••••••••" />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm new password</label>
          <input id="confirm" name="confirm" type="password" required minLength={6} autoComplete="new-password" className="input" placeholder="••••••••" />
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        <SubmitButton pendingText="Saving…">Update password</SubmitButton>
      </form>
    </AuthShell>
  );
}
