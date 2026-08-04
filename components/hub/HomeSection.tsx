import { ClassesSection } from "@/components/hub/ClassesSection";
import { CheckInRow } from "@/components/hub/CheckInRow";
import { FeedSection } from "@/components/hub/FeedSection";
import type { Profile } from "@/lib/database.types";

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">{children}</h2>;
}

/**
 * The main dashboard landing — everything you need without leaving the page,
 * in priority order: classes, your check-in, then the feed.
 */
export async function HomeSection({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-10">
      <section id="classes" className="scroll-mt-6">
        <Heading>Classes</Heading>
        <ClassesSection profile={profile} />
      </section>

      <section>
        <Heading>Your check-in</Heading>
        <CheckInRow profile={profile} />
      </section>

      <section>
        <Heading>The feed</Heading>
        <FeedSection profile={profile} />
      </section>
    </div>
  );
}
