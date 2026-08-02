"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type LinkState = { error?: string; ok?: string } | undefined;

/** Trainer links an existing client by email. */
export async function addClientByEmail(
  _prev: LinkState,
  formData: FormData
): Promise<LinkState> {
  const profile = await requireProfile();
  if (profile.role !== "trainer") return { error: "Only trainers can add clients." };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Enter an email address." };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .ilike("email", email)
    .maybeSingle();

  if (!target)
    return { error: "No account found with that email. Ask them to sign up first." };
  if (target.id === profile.id) return { error: "That's you!" };

  const { error } = await supabase.from("trainer_clients").upsert(
    { trainer_id: profile.id, client_id: target.id, status: "active" },
    { onConflict: "trainer_id,client_id" }
  );
  if (error) return { error: error.message };

  revalidatePath("/clients");
  return { ok: `${target.full_name || target.email} added to your roster.` };
}

/** Client links themselves to a trainer by email. */
export async function connectToTrainer(
  _prev: LinkState,
  formData: FormData
): Promise<LinkState> {
  const profile = await requireProfile();
  if (profile.role !== "client")
    return { error: "Only clients can connect to a trainer." };

  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) return { error: "Enter your trainer's email." };

  const supabase = await createClient();
  const { data: trainer } = await supabase
    .from("profiles")
    .select("id, role, full_name, email")
    .ilike("email", email)
    .maybeSingle();

  if (!trainer) return { error: "No account found with that email." };
  if (trainer.role !== "trainer")
    return { error: "That account isn't a trainer." };

  // The link is owned (RLS write) by the trainer; a client can still create it
  // because the policy checks trainer_id — so we cannot insert as the client.
  // Instead we record a pending request via a message so the trainer can add us.
  const { error } = await supabase.from("messages").insert({
    sender_id: profile.id,
    recipient_id: trainer.id,
    body: `Hi! I'd like to connect as your client on IdealFitness Hub. (Connection request from ${profile.full_name || profile.email}.)`,
  });
  if (error) return { error: error.message };

  return {
    ok: `Request sent to ${trainer.full_name || trainer.email}. They'll add you to their roster.`,
  };
}

/** Trainer records a progress entry for a client. */
export async function addProgress(
  _prev: LinkState,
  formData: FormData
): Promise<LinkState> {
  const profile = await requireProfile();
  const supabase = await createClient();

  const clientId = String(formData.get("client_id") || "");
  const weight = String(formData.get("weight_kg") || "").trim();
  const bodyFat = String(formData.get("body_fat_pct") || "").trim();
  const notes = String(formData.get("notes") || "").trim();
  const recordedAt = String(formData.get("recorded_at") || "");

  if (!clientId) return { error: "Missing client." };
  if (!weight && !bodyFat && !notes)
    return { error: "Add at least one measurement or a note." };

  const { error } = await supabase.from("client_progress").insert({
    client_id: clientId,
    recorded_by: profile.id,
    recorded_at: recordedAt || undefined,
    weight_kg: weight ? Number(weight) : null,
    body_fat_pct: bodyFat ? Number(bodyFat) : null,
    notes: notes || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { ok: "Progress recorded." };
}

/** Trainer removes a client link. */
/** Trainer saves private notes & flags for one of their clients. */
export async function saveClientNotes(_prev: LinkState, formData: FormData): Promise<LinkState> {
  const profile = await requireProfile();
  if (profile.role !== "trainer" && !profile.is_admin) return { error: "Not allowed." };
  const supabase = await createClient();

  const clientId = String(formData.get("client_id") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  const tags = String(formData.get("tags") || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (!clientId) return { error: "Missing client." };

  // Confirm the client belongs to this trainer.
  const { data: link } = await supabase
    .from("trainer_clients")
    .select("id")
    .eq("trainer_id", profile.id)
    .eq("client_id", clientId)
    .maybeSingle();
  if (!link) return { error: "Not your client." };

  const { error } = await supabase
    .from("client_notes")
    .upsert(
      { trainer_id: profile.id, client_id: clientId, notes, tags, updated_at: new Date().toISOString() },
      { onConflict: "trainer_id,client_id" }
    );
  if (error) return { error: error.message };

  revalidatePath(`/clients/${clientId}`);
  return { ok: "Saved" };
}

export async function removeClient(formData: FormData) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const clientId = String(formData.get("client_id") || "");
  if (!clientId) return;
  await supabase
    .from("trainer_clients")
    .delete()
    .eq("trainer_id", profile.id)
    .eq("client_id", clientId);
  revalidatePath("/clients");
}
