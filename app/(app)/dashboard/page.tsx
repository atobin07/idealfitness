import { requireProfile } from "@/lib/auth";
import { DashboardShell, type ShellTab } from "@/components/hub/DashboardShell";
import { HomeSection } from "@/components/hub/HomeSection";
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

  // Every panel is rendered up front so switching tabs is instant and never
  // navigates — the shell just shows/hides.
  const tabs: ShellTab[] = [
    { key: "home", label: "Home", content: <HomeSection profile={profile} /> },
    { key: "hub", label: "My Hub", content: <OverviewSection profile={profile} /> },
    { key: "classes", label: "Classes", content: <ClassesSection profile={profile} /> },
    { key: "events", label: "Events", content: <EventsSection profile={profile} /> },
    { key: "topic", label: "Hot Topic", content: <TopicSection profile={profile} /> },
  ];

  return (
    <DashboardShell
      tabs={tabs}
      initial={tab ?? "home"}
      title={`Welcome back, ${firstName}`}
      subtitle="Check in, catch up on the feed, and jump to anything else with the tabs."
    />
  );
}
