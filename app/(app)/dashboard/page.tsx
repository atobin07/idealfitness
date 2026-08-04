import { requireProfile } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { DashboardTabs } from "@/components/hub/DashboardTabs";
import { OverviewSection } from "@/components/hub/OverviewSection";
import { CommunitySection } from "@/components/hub/CommunitySection";
import { ClassesSection } from "@/components/hub/ClassesSection";
import { EventsSection } from "@/components/hub/EventsSection";
import { TopicSection } from "@/components/hub/TopicSection";

const TITLES: Record<string, string> = {
  community: "Community",
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
  const isTrainer = profile.role === "trainer";
  const firstName = (profile.full_name || "there").split(" ")[0];

  const active = tab && TITLES[tab] ? tab : "overview";

  return (
    <>
      <PageHeader
        title={active === "overview" ? `Welcome back, ${firstName}` : TITLES[active]}
        subtitle={
          active === "overview"
            ? isTrainer
              ? "Here's what's happening across your gym."
              : "Here's your training at a glance."
            : undefined
        }
      />

      <DashboardTabs />

      {active === "overview" && <OverviewSection profile={profile} />}
      {active === "community" && <CommunitySection profile={profile} />}
      {active === "classes" && <ClassesSection profile={profile} />}
      {active === "events" && <EventsSection profile={profile} />}
      {active === "topic" && <TopicSection profile={profile} />}
    </>
  );
}
