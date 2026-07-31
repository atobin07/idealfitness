"use client";

import { useFormState } from "react-dom";
import { updateGymSettings } from "@/app/(app)/admin/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { GymSettings } from "@/lib/database.types";

export function GymSettingsForm({ settings }: { settings: GymSettings }) {
  const [state, formAction] = useFormState(updateGymSettings, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="name">Gym name</label>
          <input id="name" name="name" required defaultValue={settings.name} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="tagline">Tagline</label>
          <input id="tagline" name="tagline" defaultValue={settings.tagline ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="email">Contact email</label>
          <input id="email" name="email" type="email" defaultValue={settings.email ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Phone</label>
          <input id="phone" name="phone" defaultValue={settings.phone ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="address">Address</label>
          <input id="address" name="address" defaultValue={settings.address ?? ""} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="city">City</label>
          <input id="city" name="city" defaultValue={settings.city ?? ""} className="input" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div>
          <label className="label" htmlFor="timezone">Timezone</label>
          <select id="timezone" name="timezone" defaultValue={settings.timezone} className="input">
            {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles"].map((z) => (
              <option key={z} value={z}>{z.split("/")[1].replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="currency">Currency</label>
          <select id="currency" name="currency" defaultValue={settings.currency} className="input">
            {["USD", "CAD", "GBP", "EUR", "AUD"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="booking_window_days">Booking window (days)</label>
          <input id="booking_window_days" name="booking_window_days" type="number" min={1} defaultValue={settings.booking_window_days} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="cancel_cutoff_hours">Cancel cutoff (hrs)</label>
          <input id="cancel_cutoff_hours" name="cancel_cutoff_hours" type="number" min={0} defaultValue={settings.cancel_cutoff_hours} className="input" />
        </div>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/15">Settings saved.</p>}
      <SubmitButton className="btn-primary" pendingText="Saving…">Save settings</SubmitButton>
    </form>
  );
}
