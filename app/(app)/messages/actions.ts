"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export async function sendMessage(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const recipientId = String(formData.get("recipient_id") || "");
  const body = String(formData.get("body") || "").trim();
  if (!recipientId || !body) return;

  await supabase.from("messages").insert({
    sender_id: profile.id,
    recipient_id: recipientId,
    body,
  });

  revalidatePath("/messages");
}

export async function markConversationRead(otherId: string) {
  const profile = await requireProfile();
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", profile.id)
    .eq("sender_id", otherId)
    .is("read_at", null);
}
