"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { requestPasswordReset } from "@/app/auth/actions";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(requestPasswordReset, undefined);

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to set a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-brand-300 hover:text-brand-200">
            Back to sign in
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
        </div>
        {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>}
        {state?.notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.notice}</p>}
        <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>
      </form>
    </AuthShell>
  );
}
