"use client";

import { useFormState } from "react-dom";
import { SubmitButton } from "@/components/SubmitButton";
import type { LinkState } from "@/app/(app)/clients/actions";

export function EmailLinkForm({
  action,
  placeholder,
  buttonLabel,
}: {
  action: (prev: LinkState, formData: FormData) => Promise<LinkState>;
  placeholder: string;
  buttonLabel: string;
}) {
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="email"
          type="email"
          required
          className="input"
          placeholder={placeholder}
        />
        <SubmitButton className="btn-primary whitespace-nowrap" pendingText="Sending…">
          {buttonLabel}
        </SubmitButton>
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">{state.ok}</p>
      )}
    </form>
  );
}
