"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import type { UserRole } from "@/lib/database.types";

export type AdminState = { error?: string; ok?: boolean } | undefined;

export async function assignClientToTrainer(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const client_id = String(formData.get("client_id") || "");
  const trainer_id = String(formData.get("trainer_id") || "");
  if (!client_id || !trainer_id) return;
  await supabase
    .from("trainer_clients")
    .upsert({ trainer_id, client_id, status: "active" }, { onConflict: "trainer_id,client_id" });
  revalidatePath("/admin/people");
}

export async function unassignLink(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("trainer_clients").delete().eq("id", id);
  revalidatePath("/admin/people");
}

export async function setUserRole(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();
  const user_id = String(formData.get("user_id") || "");
  const role = String(formData.get("role") || "") as UserRole;
  if (!user_id || !role) return;
  await supabase.from("profiles").update({ role }).eq("id", user_id);
  revalidatePath("/admin/people");
}

export async function setUserAdmin(formData: FormData) {
  const me = await requireAdmin();
  const supabase = await createClient();
  const user_id = String(formData.get("user_id") || "");
  const value = String(formData.get("value") || "") === "true";
  if (!user_id) return;
  // Don't let an admin remove their own admin rights (avoid lock-out).
  if (user_id === me.id && !value) return;
  await supabase.from("profiles").update({ is_admin: value }).eq("id", user_id);
  revalidatePath("/admin/people");
}

export async function updateGymSettings(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await requireAdmin();
  const supabase = await createClient();
  const str = (k: string) => String(formData.get(k) || "").trim() || null;
  const num = (k: string, d: number) => {
    const v = parseInt(String(formData.get(k) || ""), 10);
    return Number.isFinite(v) ? v : d;
  };

  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Gym name is required." };

  const { error } = await supabase
    .from("gym_settings")
    .update({
      name,
      tagline: str("tagline"),
      email: str("email"),
      phone: str("phone"),
      address: str("address"),
      city: str("city"),
      timezone: String(formData.get("timezone") || "America/New_York"),
      currency: String(formData.get("currency") || "USD"),
      booking_window_days: num("booking_window_days", 30),
      cancel_cutoff_hours: num("cancel_cutoff_hours", 24),
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) return { error: error.message };

  revalidatePath("/admin/settings");
  return { ok: true };
}
