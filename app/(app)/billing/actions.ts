"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type BillingState = { error?: string; ok?: boolean } | undefined;

function toCents(v: FormDataEntryValue | null): number {
  const n = Number(String(v || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export async function createPackage(_prev: BillingState, formData: FormData): Promise<BillingState> {
  const profile = await requireProfile();
  if (profile.role !== "trainer") return { error: "Only trainers can create packages." };
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "Name the package." };
  const { error } = await supabase.from("packages").insert({
    trainer_id: profile.id,
    name,
    description: String(formData.get("description") || "").trim() || null,
    sessions_count: parseInt(String(formData.get("sessions_count") || "10"), 10),
    price_cents: toCents(formData.get("price")),
  });
  if (error) return { error: error.message };
  revalidatePath("/billing");
  return { ok: true };
}

export async function deletePackage(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("packages").delete().eq("id", id).eq("trainer_id", profile.id);
  revalidatePath("/billing");
}

export async function grantPackage(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "trainer") return;
  const supabase = await createClient();
  const client_id = String(formData.get("client_id") || "");
  const package_id = String(formData.get("package_id") || "");
  if (!client_id || !package_id) return;

  const { data: pkg } = await supabase
    .from("packages")
    .select("name, sessions_count, price_cents")
    .eq("id", package_id)
    .single();
  if (!pkg) return;

  await supabase.from("client_packages").insert({
    client_id,
    trainer_id: profile.id,
    package_id,
    name: pkg.name,
    sessions_total: pkg.sessions_count,
    sessions_used: 0,
    price_cents: pkg.price_cents,
  });
  // Also raise an invoice for it.
  await supabase.from("invoices").insert({
    client_id,
    trainer_id: profile.id,
    description: pkg.name,
    amount_cents: pkg.price_cents,
    status: "due",
  });
  revalidatePath("/billing");
}

export async function createInvoice(formData: FormData) {
  const profile = await requireProfile();
  if (profile.role !== "trainer") return;
  const supabase = await createClient();
  const client_id = String(formData.get("client_id") || "");
  const description = String(formData.get("description") || "").trim();
  if (!client_id || !description) return;
  await supabase.from("invoices").insert({
    client_id,
    trainer_id: profile.id,
    description,
    amount_cents: toCents(formData.get("amount")),
    due_date: String(formData.get("due_date") || "") || null,
  });
  revalidatePath("/billing");
}

export async function markInvoicePaid(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("trainer_id", profile.id);
  revalidatePath("/billing");
}

export async function deleteInvoice(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("invoices").delete().eq("id", id).eq("trainer_id", profile.id);
  revalidatePath("/billing");
}
