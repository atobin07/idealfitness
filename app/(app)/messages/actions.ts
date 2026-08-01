"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

const FONTS = ["default", "serif", "mono", "script", "bold"];
const ATTACH = ["image", "file", "gif"];

export async function sendMessage(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();

  const recipientId = String(formData.get("recipient_id") || "");
  const body = String(formData.get("body") || "").trim();
  const attachmentUrl = String(formData.get("attachment_url") || "").trim() || null;
  const attachmentType = ATTACH.includes(String(formData.get("attachment_type"))) ? String(formData.get("attachment_type")) : null;
  const attachmentName = String(formData.get("attachment_name") || "").trim() || null;
  const font = FONTS.includes(String(formData.get("font"))) ? String(formData.get("font")) : "default";

  if (!recipientId) return;
  if (!body && !attachmentUrl) return;

  await supabase.from("messages").insert({
    sender_id: profile.id,
    recipient_id: recipientId,
    body: body || null,
    attachment_url: attachmentUrl,
    attachment_type: attachmentUrl ? attachmentType : null,
    attachment_name: attachmentName,
    font,
  });

  revalidatePath("/messages");
}

export async function toggleReaction(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const messageId = String(formData.get("message_id") || "");
  const emoji = String(formData.get("emoji") || "").trim();
  if (!messageId || !emoji) return;

  const { data: existing } = await supabase
    .from("message_reactions")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", profile.id)
    .eq("emoji", emoji)
    .maybeSingle();
  if (existing) await supabase.from("message_reactions").delete().eq("id", existing.id);
  else await supabase.from("message_reactions").insert({ message_id: messageId, user_id: profile.id, emoji });

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
