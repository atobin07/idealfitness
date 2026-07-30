"use client";

import { useRef } from "react";
import { useFormState } from "react-dom";
import { createPackage } from "@/app/(app)/billing/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function PackageForm() {
  const [state, formAction] = useFormState(createPackage, undefined);
  const ref = useRef<HTMLFormElement>(null);
  if (state?.ok) {
    ref.current?.reset();
    state.ok = false;
  }

  return (
    <form ref={ref} action={formAction} className="space-y-2 border-t border-slate-100 pt-3 dark:border-white/10">
      <input name="name" required className="input" placeholder="Package name (e.g. Momentum 10-Pack)" />
      <input name="description" className="input" placeholder="Description (optional)" />
      <div className="flex gap-2">
        <input name="sessions_count" type="number" min={1} className="input" placeholder="Sessions" defaultValue="10" />
        <input name="price" className="input" placeholder="$ price" />
        <SubmitButton className="btn-primary whitespace-nowrap" pendingText="Adding…">Add</SubmitButton>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
