"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { signIn } from "@/app/auth/actions";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, undefined);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your IdealFitness Hub account."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-semibold text-brand-300 hover:text-brand-200">
            Create an account
          </Link>
        </>
      }
    >
      <form action={formAction} className="space-y-4">
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
          <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      </form>
    </AuthShell>
  );
}
