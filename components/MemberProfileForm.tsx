"use client";

import { useFormState } from "react-dom";
import { updateMemberProfile } from "@/app/(app)/settings/actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { MemberProfile } from "@/lib/database.types";

function Field({ name, label, value, placeholder }: { name: string; label: string; value?: string | null; placeholder?: string }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      <input id={name} name={name} defaultValue={value ?? ""} className="input" placeholder={placeholder} />
    </div>
  );
}

export function MemberProfileForm({ mp }: { mp: MemberProfile | null }) {
  const [state, formAction] = useFormState(updateMemberProfile, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label className="label" htmlFor="intro">Intro — tell everyone a bit about you</label>
        <textarea id="intro" name="intro" rows={3} defaultValue={mp?.intro ?? ""} className="input" placeholder="Who you are, what brought you to the gym, what makes you tick…" />
      </div>

      <div>
        <label className="label" htmlFor="current_goal">🎯 Current goal — what are you working on right now?</label>
        <input id="current_goal" name="current_goal" defaultValue={mp?.current_goal ?? ""} className="input" placeholder="First unbroken pull-up · Deadlift 2x bodyweight · Show up 4x a week" />
        <p className="mt-1 text-xs muted">Shown front-and-center on your profile so the crew can cheer you on.</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-white">Get to know me</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="hometown" label="Hometown" value={mp?.hometown} placeholder="Virginia Beach, VA" />
          <Field name="occupation" label="What I do" value={mp?.occupation} placeholder="Teacher, nurse, entrepreneur…" />
          <Field name="favorite_color" label="Favorite color" value={mp?.favorite_color} placeholder="Sky blue, obviously" />
          <Field name="favorite_food" label="Favorite food" value={mp?.favorite_food} placeholder="Tacos" />
          <Field name="favorite_music" label="Favorite music / artist" value={mp?.favorite_music} placeholder="90s hip-hop, Beyoncé…" />
          <div>
            <label className="label" htmlFor="favorite_decade">Favorite decade</label>
            <select id="favorite_decade" name="favorite_decade" defaultValue={mp?.favorite_decade ?? ""} className="input">
              <option value="">Pick one…</option>
              {["70s", "80s", "90s", "2000s", "2010s", "2020s"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <Field name="favorite_movie" label="Favorite movie or show" value={mp?.favorite_movie} placeholder="Rocky IV 🥊" />
          <Field name="hobbies" label="Hobbies outside the gym" value={mp?.hobbies} placeholder="Hiking, cooking, gaming…" />
          <Field name="dream_vacation" label="Dream vacation" value={mp?.dream_vacation} placeholder="Italy" />
          <Field name="pets" label="Pets" value={mp?.pets} placeholder="Two dogs — Rocky & Duke" />
          <div>
            <label className="label" htmlFor="early_bird_or_night_owl">Early bird or night owl?</label>
            <select id="early_bird_or_night_owl" name="early_bird_or_night_owl" defaultValue={mp?.early_bird_or_night_owl ?? ""} className="input">
              <option value="">Pick one…</option>
              <option value="Early bird">Early bird 🌅</option>
              <option value="Night owl">Night owl 🦉</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="coffee_or_tea">Coffee or tea?</label>
            <select id="coffee_or_tea" name="coffee_or_tea" defaultValue={mp?.coffee_or_tea ?? ""} className="input">
              <option value="">Pick one…</option>
              <option value="Coffee">Coffee ☕</option>
              <option value="Tea">Tea 🍵</option>
              <option value="Neither">Neither</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Field name="fun_fact" label="A fun fact about me" value={mp?.fun_fact} placeholder="I once ran a marathon dressed as a banana" />
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-900 dark:text-white">In the gym</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="favorite_workout_song" label="Favorite workout song" value={mp?.favorite_workout_song} placeholder="Till I Collapse — Eminem" />
          <Field name="favorite_movement" label="Favorite movement / lift" value={mp?.favorite_movement} placeholder="Deadlift" />
          <div>
            <label className="label" htmlFor="favorite_training_day">Favorite day to train</label>
            <select id="favorite_training_day" name="favorite_training_day" defaultValue={mp?.favorite_training_day ?? ""} className="input">
              <option value="">Pick one…</option>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      </div>

      {state?.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10">{state.error}</p>}
      {state?.ok && <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">Profile saved!</p>}
      <SubmitButton className="btn-primary" pendingText="Saving…">Save profile</SubmitButton>
    </form>
  );
}
