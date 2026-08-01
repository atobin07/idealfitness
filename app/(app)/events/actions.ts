"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { EventKind, RsvpStatus } from "@/lib/database.types";

export type EventState = { error?: string; ok?: boolean } | undefined;

export async function createEvent(_prev: EventState, formData: FormData): Promise<EventState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const kind = (String(formData.get("kind") || "gym") === "social" ? "social" : "gym") as EventKind;
  const description = String(formData.get("description") || "").trim();
  const location = String(formData.get("location") || "").trim();
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const endTime = String(formData.get("end_time") || "");
  const imageUrl = String(formData.get("image_url") || "").trim() || null;

  if (!title) return { error: "Give the event a name." };
  if (!date || !time) return { error: "Pick a date and start time." };

  const starts = new Date(`${date}T${time}`);
  if (Number.isNaN(starts.getTime())) return { error: "Invalid date or time." };
  let ends: Date | null = null;
  if (endTime) {
    const e = new Date(`${date}T${endTime}`);
    if (!Number.isNaN(e.getTime()) && e >= starts) ends = e;
  }

  const { error } = await supabase.from("events").insert({
    created_by: profile.id,
    kind,
    title,
    description: description || null,
    location: location || null,
    image_url: imageUrl,
    starts_at: starts.toISOString(),
    ends_at: ends ? ends.toISOString() : null,
  });
  if (error) return { error: error.message };

  revalidatePath("/events");
  return { ok: true };
}

export async function deleteEvent(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const query = supabase.from("events").delete().eq("id", id);
  if (!profile.is_admin) query.eq("created_by", profile.id);
  await query;
  revalidatePath("/events");
}

export async function setRsvp(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") || "");
  const status = String(formData.get("status") || "") as RsvpStatus;
  const note = String(formData.get("note") || "").trim() || null;
  if (!eventId || !["going", "maybe", "cant"].includes(status)) return;

  await supabase
    .from("event_rsvps")
    .upsert(
      { event_id: eventId, user_id: profile.id, status, note, updated_at: new Date().toISOString() },
      { onConflict: "event_id,user_id" }
    );
  revalidatePath("/events");
}

export async function clearRsvp(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const eventId = String(formData.get("event_id") || "");
  if (!eventId) return;
  await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", profile.id);
  revalidatePath("/events");
}
