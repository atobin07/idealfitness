"use client";

import { useFormState } from "react-dom";
import { updateProfile } from "@/app/(app)/settings/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { Profile } from "@/lib/database.types";

export function ProfileForm({ profile }: { profile: Profile }) {
  const [state, formAction] = useFormState(updateProfile, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="full_name">Full name</label>
          <input id="full_name" name="full_name" required defaultValue={profile.full_name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" defaultValue={profile.phone ?? ""} className="input" placeholder="(555) 123-4567" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="bio">
          {profile.role === "trainer" ? "Bio / specialties" : "About you"}
        </label>
        <textarea id="bio" name="bio" rows={3} defaultValue={profile.bio ?? ""} className="input"
          placeholder={profile.role === "trainer" ? "Strength coach, 8 years, mobility specialist…" : "A little about yourself"} />
      </div>

      <div>
        <label className="label" htmlFor="goals">
          {profile.role === "trainer" ? "Coaching philosophy" : "Your goals"}
        </label>
        <textarea id="goals" name="goals" rows={2} defaultValue={profile.goals ?? ""} className="input"
          placeholder={profile.role === "trainer" ? "How you like to work with clients" : "Lose 5kg, run a 10k, build strength…"} />
      </div>

      {profile.role === "trainer" && (
        <div>
          <label className="label" htmlFor="specialties">Areas of expertise</label>
          <input id="specialties" name="specialties" defaultValue={(profile.specialties ?? []).join(", ")} className="input"
            placeholder="Strength & Powerlifting, Mobility, Weight Loss" />
          <p className="mt-1 text-xs muted">Comma-separated. Members filter and book coaches by these.</p>
        </div>
      )}

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">Saved.</p>
      )}
      <SubmitButton className="btn-primary" pendingText="Saving…">Save changes</SubmitButton>
    </form>
  );
}
