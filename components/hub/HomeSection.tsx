import { CheckInRow } from "@/components/hub/CheckInRow";
import { FeedSection } from "@/components/hub/FeedSection";
import type { Profile } from "@/lib/database.types";

/**
 * The main dashboard landing — your check-in first (most important),
 * then the gym feed. Everything else lives in the tabs.
 */
export async function HomeSection({ profile }: { profile: Profile }) {
  return (
    <div className="space-y-10">
      <section>
        <CheckInRow profile={profile} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink-900 dark:text-white">The feed</h2>
        <FeedSection profile={profile} />
      </section>
    </div>
  );
}
