"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type ClassState = { error?: string; ok?: boolean } | undefined;

export async function createClass(_prev: ClassState, formData: FormData): Promise<ClassState> {
  const profile = await requireProfile();
  if (profile.role !== "trainer") return { error: "Only trainers can create classes." };
  const supabase = await createClient();

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const date = String(formData.get("date") || "");
  const time = String(formData.get("time") || "");
  const duration = parseInt(String(formData.get("duration") || "60"), 10);
  const capacity = parseInt(String(formData.get("capacity") || "10"), 10);
  const location = String(formData.get("location") || "").trim();

  if (!title) return { error: "Add a class title." };
  if (!date || !time) return { error: "Pick a date and time." };

  const starts = new Date(`${date}T${time}`);
  if (Number.isNaN(starts.getTime())) return { error: "Invalid date or time." };
  const ends = new Date(starts.getTime() + duration * 60_000);

  const { error } = await supabase.from("classes").insert({
    trainer_id: profile.id,
    title,
    description: description || null,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    capacity,
    location: location || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/classes");
  return { ok: true };
}

export async function deleteClass(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("classes").delete().eq("id", id).eq("trainer_id", profile.id);
  revalidatePath("/classes");
}

export async function generateSchedule() {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && !profile.is_admin) return;
  const supabase = await createClient();
  await supabase.rpc("generate_class_schedule", { p_days: 14 });
  revalidatePath("/classes");
  revalidatePath("/calendar");
}

export async function bookClass(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const classId = String(formData.get("class_id") || "");
  if (!classId) return;

  const [{ data: cls }, { count: booked }] = await Promise.all([
    supabase.from("classes").select("capacity").eq("id", classId).single(),
    supabase
      .from("class_bookings")
      .select("id", { count: "exact", head: true })
      .eq("class_id", classId)
      .eq("status", "booked"),
  ]);

  const status = (booked ?? 0) < (cls?.capacity ?? 0) ? "booked" : "waitlisted";

  await supabase
    .from("class_bookings")
    .upsert({ class_id: classId, client_id: profile.id, status }, { onConflict: "class_id,client_id" });

  revalidatePath("/classes");
}

export async function cancelBooking(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const classId = String(formData.get("class_id") || "");
  if (!classId) return;

  const { data: mine } = await supabase
    .from("class_bookings")
    .select("id, status")
    .eq("class_id", classId)
    .eq("client_id", profile.id)
    .maybeSingle();

  await supabase.from("class_bookings").delete().eq("class_id", classId).eq("client_id", profile.id);

  // If a booked spot opened up, promote the earliest waitlisted person.
  if (mine?.status === "booked") {
    const { data: next } = await supabase
      .from("class_bookings")
      .select("id")
      .eq("class_id", classId)
      .eq("status", "waitlisted")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (next) {
      await supabase.from("class_bookings").update({ status: "booked" }).eq("id", next.id);
    }
  }

  revalidatePath("/classes");
}
