"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { signUp } from "@/app/auth/actions";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";

export default function SignupPage() {
  const [state, formAction] = useFormState(signUp, undefined);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join your gym's hub as a trainer or client."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-brand-300 hover:text-brand-200">
            Sign in
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
        <div>
          <label className="label" htmlFor="full_name">
            Full name
          </label>
          <input id="full_name" name="full_name" required className="input" placeholder="Jordan Smith" />
        </div>
        <div>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" />
        </div>
        <div>
          <label className="label" htmlFor="password">
            Password
          </label>
          <input id="password" name="password" type="password" required minLength={6} className="input" placeholder="At least 6 characters" />
        </div>
        <div>
          <label className="label">I am a…</label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="role" value="client" defaultChecked className="accent-brand-600" />
              Client
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
              <input type="radio" name="role" value="trainer" className="accent-brand-600" />
              Trainer
            </label>
          </div>
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        {state?.notice && (
          <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{state.notice}</p>
        )}
        <SubmitButton pendingText="Creating account…">Create account</SubmitButton>
      </form>
    </AuthShell>
  );
}
