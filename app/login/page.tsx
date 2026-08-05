"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { signIn, sendMagicLink } from "@/app/auth/actions";
import { AuthShell } from "@/components/AuthShell";
import { SubmitButton } from "@/components/SubmitButton";

export default function LoginPage() {
  const [state, formAction] = useFormState(signIn, undefined);
  const [magic, magicAction] = useFormState(sendMagicLink, undefined);

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to your iDEAL FITNESS hub."
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
          <div className="flex items-center justify-between">
            <label className="label" htmlFor="password">
              Password
            </label>
            <Link href="/forgot" className="text-xs font-semibold text-brand-300 hover:text-brand-200">
              Forgot password?
            </Link>
          </div>
          <input id="password" name="password" type="password" required className="input" placeholder="••••••••" />
        </div>
        {state?.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
        )}
        <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>
      </form>

      {/* Passwordless option */}
      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-white/40">
        <span className="h-px flex-1 bg-white/15" />
        or
        <span className="h-px flex-1 bg-white/15" />
      </div>

      <form action={magicAction} className="space-y-3">
        <div>
          <label className="label" htmlFor="magic-email">
            Email me a magic link
          </label>
          <input id="magic-email" name="email" type="email" required className="input" placeholder="you@example.com" />
        </div>
        {magic?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{magic.error}</p>}
        {magic?.notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{magic.notice}</p>}
        <SubmitButton className="btn-secondary w-full" pendingText="Sending…">
          Send a sign-in link
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
