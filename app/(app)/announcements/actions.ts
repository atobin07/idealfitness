"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";

export type AnnState = { error?: string; ok?: boolean } | undefined;

export async function createAnnouncement(
  _prev: AnnState,
  formData: FormData
): Promise<AnnState> {
  const profile = await requireProfile();
  if (profile.role !== "trainer")
    return { error: "Only trainers can post announcements." };

  const title = String(formData.get("title") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!title || !body) return { error: "Add a title and a message." };

  const supabase = await createClient();
  const { error } = await supabase.from("announcements").insert({
    author_id: profile.id,
    title,
    body,
  });
  if (error) return { error: error.message };

  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAnnouncement(formData: FormData) {
  const supabase = await createClient();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await supabase.from("announcements").delete().eq("id", id);
  revalidatePath("/announcements");
}
