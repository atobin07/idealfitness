"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type TicketResult = { ok?: boolean; error?: string };

export async function createTicket(formData: FormData): Promise<TicketResult> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const category = String(formData.get("category") || "General").trim();
  const details = String(formData.get("details") || "").trim();
  const urgency = ["low", "medium", "high"].includes(String(formData.get("urgency"))) ? String(formData.get("urgency")) : "medium";
  const subject = String(formData.get("subject") || "").trim() || `${category} issue`;
  const summary = String(formData.get("summary") || "").trim() || details.slice(0, 160);

  if (!details) return { error: "Add a little detail so we can help." };

  const { error } = await supabase.from("support_tickets").insert({
    user_id: profile.id,
    category,
    subject: subject.slice(0, 120),
    summary: summary.slice(0, 400),
    details,
    urgency,
  });
  if (error) return { error: error.message };

  revalidatePath("/support");
  return { ok: true };
}

export async function setTicketStatus(formData: FormData) {
  await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  if (!id || !["open", "in_progress", "resolved"].includes(status)) return;
  await supabase.from("support_tickets").update({ status }).eq("id", id);
  revalidatePath("/support");
}
