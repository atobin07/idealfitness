import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { ProfileForm } from "@/components/ProfileForm";
import { MemberProfileForm } from "@/components/MemberProfileForm";
import { AvatarUploader } from "@/components/AvatarUploader";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";
import type { MemberProfile } from "@/lib/database.types";

export default async function SettingsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const { data: mp } = await supabase.from("member_profiles").select("*").eq("user_id", profile.id).maybeSingle();

  return (
    <>
      <PageHeader title="Settings" subtitle="Your photo, details, and get-to-know-you profile." />

      <AvatarUploader
        myId={profile.id}
        name={profile.full_name || "You"}
        avatarUrl={profile.avatar_url}
        role={profile.role}
        email={profile.email}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="mb-4 font-semibold text-ink-900 dark:text-white">Account details</h2>
          <ProfileForm profile={profile} />
        </div>
        {profile.role === "trainer" && <AvailabilityEditor trainerId={profile.id} />}
      </div>

      <div className="mt-6 card p-6">
        <h2 className="mb-1 font-semibold text-ink-900 dark:text-white">Your member profile</h2>
        <p className="mb-4 text-sm muted">Fill this out so the crew can get to know you. It shows on your Members page profile.</p>
        <MemberProfileForm mp={(mp ?? null) as MemberProfile | null} />
      </div>
    </>
  );
}
