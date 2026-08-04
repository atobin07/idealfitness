import { requireProfile } from "@/lib/auth";
import { TabHub, type HubTab } from "@/components/TabHub";
import { CheckInRow } from "@/components/hub/CheckInRow";
import { OverviewSection } from "@/components/hub/OverviewSection";
import { ClassesSection } from "@/components/hub/ClassesSection";
import { EventsSection } from "@/components/hub/EventsSection";
import { TopicSection } from "@/components/hub/TopicSection";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const profile = await requireProfile();
  const firstName = (profile.full_name || "there").split(" ")[0];

  const tabs: HubTab[] = [
    { key: "hub", label: "My Hub", content: <OverviewSection profile={profile} /> },
    { key: "classes", label: "Classes", content: <ClassesSection profile={profile} /> },
    { key: "events", label: "Events", content: <EventsSection profile={profile} /> },
    { key: "topic", label: "Hot Topic", content: <TopicSection profile={profile} /> },
  ];

  return (
    <TabHub
      tabs={tabs}
      initial={tab ?? "hub"}
      basePath="/dashboard"
      title={`Welcome back, ${firstName}`}
      subtitle="Check in below, then jump to anything else with the tabs."
      top={<CheckInRow profile={profile} />}
    />
  );
}
