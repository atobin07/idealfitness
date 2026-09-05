import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { CheckInRow } from "@/components/hub/CheckInRow";
import { OverviewSection } from "@/components/hub/OverviewSection";

export default async function DashboardPage() {
  const profile = await requireProfile();
  const firstName = (profile.full_name || "there").split(" ")[0];

  return (
    <>
      <PageHeader title={`Today, ${firstName}`} subtitle="Check in, then see what's happening." />
      <div className="mb-6">
        <CheckInRow profile={profile} />
      </div>
      <OverviewSection profile={profile} />
    </>
  );
}
