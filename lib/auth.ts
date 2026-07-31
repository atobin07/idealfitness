import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/database.types";

/**
 * Returns the signed-in user's profile, or redirects to /login.
 * Use in every authenticated Server Component / page.
 */
export async function requireProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    // Profile row missing (e.g. trigger race) — create a minimal one.
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        full_name: (user.user_metadata?.full_name as string) ?? "",
        role: (user.user_metadata?.role as Profile["role"]) ?? "client",
      })
      .select("*")
      .single();
    if (!created) redirect("/login");
    return created;
  }

  return profile;
}

/** Returns the profile only if the user is a gym admin; otherwise 404s. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (!profile.is_admin) notFound();
  return profile;
}
