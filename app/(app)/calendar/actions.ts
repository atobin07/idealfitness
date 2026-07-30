"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import type { SessionStatus } from "@/lib/database.types";

export type BookingState = { error?: string; ok?: boolean } | undefined;

export async function createSession(
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const title = String(formData.get("title") || "Training session").trim();
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const duration = parseInt(String(formData.get("duration") || "60"), 10);
  const location = String(formData.get("location") || "").trim();
  const counterpartId = String(formData.get("counterpart_id") || "");

  if (!date || !time) return { error: "Pick a date and time." };
  if (!counterpartId)
    return {
      error:
        profile.role === "trainer"
          ? "Select a client for this session."
          : "Select a trainer for this session.",
    };

  const starts = new Date(`${date}T${time}`);
  if (Number.isNaN(starts.getTime())) return { error: "Invalid date or time." };
  const ends = new Date(starts.getTime() + duration * 60_000);

  const trainer_id = profile.role === "trainer" ? profile.id : counterpartId;
  const client_id = profile.role === "trainer" ? counterpartId : profile.id;

  // Prevent double-booking: reject if the trainer already has an overlapping
  // scheduled session.
  const { data: clash } = await supabase
    .from("sessions")
    .select("id")
    .eq("trainer_id", trainer_id)
    .eq("status", "scheduled")
    .lt("starts_at", ends.toISOString())
    .gt("ends_at", starts.toISOString())
    .limit(1);
  if (clash && clash.length > 0) {
    return { error: "That time overlaps an existing session. Pick another slot." };
  }

  const { error } = await supabase.from("sessions").insert({
    trainer_id,
    client_id,
    title: title || "Training session",
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    location: location || null,
    created_by: profile.id,
    status: "scheduled",
  });

  if (error) return { error: error.message };

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function setSessionStatus(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "") as SessionStatus;
  if (!id || !status) return;

  await supabase.from("sessions").update({ status }).eq("id", id);
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
