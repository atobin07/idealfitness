import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { ProfileForm } from "@/components/ProfileForm";
import { AvailabilityEditor } from "@/components/AvailabilityEditor";

export default async function SettingsPage() {
  const profile = await requireProfile();

  return (
    <>
      <PageHeader title="Settings" subtitle="Manage your profile." />

      <div className="mb-6 flex items-center gap-4">
        <Avatar name={profile.full_name || "You"} size="lg" />
        <div>
          <p className="text-lg font-semibold text-ink-900">{profile.full_name || "Your name"}</p>
          <p className="text-sm capitalize text-slate-500">
            {profile.role} · {profile.email}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <ProfileForm profile={profile} />
        </div>
        {profile.role === "trainer" && <AvailabilityEditor trainerId={profile.id} />}
      </div>
    </>
  );
}
