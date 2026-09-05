"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

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

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
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

  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}
