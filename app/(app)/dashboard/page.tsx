import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { DashboardTabs } from "@/components/hub/DashboardTabs";
import { HomeSection } from "@/components/hub/HomeSection";
import { OverviewSection } from "@/components/hub/OverviewSection";
import { ClassesSection } from "@/components/hub/ClassesSection";
import { EventsSection } from "@/components/hub/EventsSection";
import { TopicSection } from "@/components/hub/TopicSection";

const TITLES: Record<string, string> = {
  hub: "My Hub",
  classes: "Classes",
  events: "Events",
  topic: "Hot Topic",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const profile = await requireProfile();
  const firstName = (profile.full_name || "there").split(" ")[0];

  const active = tab && TITLES[tab] ? tab : "home";

  return (
    <>
      <PageHeader
        title={active === "home" ? `Welcome back, ${firstName}` : TITLES[active]}
        subtitle={active === "home" ? "Check in, then catch up on the gym feed." : undefined}
      />

      <DashboardTabs />

      {active === "home" && <HomeSection profile={profile} />}
      {active === "hub" && <OverviewSection profile={profile} />}
      {active === "classes" && <ClassesSection profile={profile} />}
      {active === "events" && <EventsSection profile={profile} />}
      {active === "topic" && <TopicSection profile={profile} />}
    </>
  );
}
