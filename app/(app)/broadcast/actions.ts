"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type BroadcastState = { error?: string; sent?: number } | undefined;

// Send one direct message to many recipients at once (class cancellations,
// promos, reminders). Audience is "all" active clients or a single class roster.
export async function sendBroadcast(_prev: BroadcastState, formData: FormData): Promise<BroadcastState> {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && !profile.is_admin) return { error: "Not allowed." };
  const supabase = await createClient();

  const audience = String(formData.get("audience") || "all_clients");
  const body = String(formData.get("body") || "").trim();
  if (!body) return { error: "Write a message first." };

  let recipientIds: string[] = [];
  if (audience.startsWith("class:")) {
    const classId = audience.slice("class:".length);
    const { data } = await supabase
      .from("class_bookings")
      .select("client_id")
      .eq("class_id", classId)
      .eq("status", "booked");
    recipientIds = (data ?? []).map((r) => r.client_id);
  } else {
    const { data } = await supabase
      .from("trainer_clients")
      .select("client_id")
      .eq("trainer_id", profile.id)
      .eq("status", "active");
    recipientIds = (data ?? []).map((r) => r.client_id);
  }

  recipientIds = [...new Set(recipientIds)].filter((id) => id && id !== profile.id);
  if (recipientIds.length === 0) return { error: "No recipients in that audience." };

  const rows = recipientIds.map((rid) => ({ sender_id: profile.id, recipient_id: rid, body }));
  const { error } = await supabase.from("messages").insert(rows);
  if (error) return { error: error.message };

  revalidatePath("/messages");
  return { sent: recipientIds.length };
}
