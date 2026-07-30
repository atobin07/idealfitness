"use client";

import { useRef } from "react";
import { useFormState } from "react-dom";
import { createAnnouncement } from "@/app/(app)/announcements/actions";
import { SubmitButton } from "@/components/SubmitButton";

export function NewAnnouncementForm() {
  const [state, formAction] = useFormState(createAnnouncement, undefined);
  const ref = useRef<HTMLFormElement>(null);

  if (state?.ok) {
    ref.current?.reset();
    state.ok = false;
  }

  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" name="title" required className="input" placeholder="Holiday hours, new class, gym update…" />
      </div>
      <div>
        <label className="label" htmlFor="body">Message</label>
        <textarea id="body" name="body" required rows={3} className="input" placeholder="Share news with everyone at the gym." />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      <SubmitButton className="btn-primary" pendingText="Posting…">Post announcement</SubmitButton>
    </form>
  );
}
