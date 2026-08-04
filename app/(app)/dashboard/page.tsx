import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { DashboardTabs } from "@/components/hub/DashboardTabs";
import { HomeSection } from "@/components/hub/HomeSection";
import { OverviewSection } from "@/components/hub/OverviewSection";
import { EventsSection } from "@/components/hub/EventsSection";
import { TopicSection } from "@/components/hub/TopicSection";

const TITLES: Record<string, string> = {
  overview: "Overview",
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
        subtitle={active === "home" ? "Your classes, check-in and the gym feed — all in one place." : undefined}
      />

      <DashboardTabs />

      {active === "home" && <HomeSection profile={profile} />}
      {active === "overview" && <OverviewSection profile={profile} />}
      {active === "events" && <EventsSection profile={profile} />}
      {active === "topic" && <TopicSection profile={profile} />}
    </>
  );
}
