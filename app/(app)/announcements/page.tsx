import { formatDistanceToNow } from "date-fns";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { NewAnnouncementForm } from "@/components/NewAnnouncementForm";
import { deleteAnnouncement } from "@/app/(app)/announcements/actions";
import type { Announcement, Profile } from "@/lib/database.types";

type AnnWithAuthor = Announcement & {
  author: Pick<Profile, "id" | "full_name"> | null;
};

export default async function AnnouncementsPage() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const isTrainer = profile.role === "trainer";

  const { data } = await supabase
    .from("announcements")
    .select("*, author:author_id(id, full_name)")
    .order("created_at", { ascending: false })
    .limit(50);

  const announcements = (data ?? []) as AnnWithAuthor[];

  return (
    <>
      <PageHeader title="Announcements" subtitle="Gym-wide news and updates." />

      {isTrainer && (
        <div className="card mb-6 p-5">
          <h2 className="mb-3 font-semibold text-ink-900 dark:text-white">Post an announcement</h2>
          <NewAnnouncementForm />
        </div>
      )}

      <div className="space-y-4">
        {announcements.length === 0 && (
          <div className="card p-10 text-center text-slate-500">No announcements yet.</div>
        )}
        {announcements.map((a) => (
          <div key={a.id} className="card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={a.author?.full_name || "Gym"} size="sm" />
                <div>
                  <p className="font-semibold text-ink-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-slate-500">
                    {a.author?.full_name || "Staff"} ·{" "}
                    {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              {isTrainer && a.author_id === profile.id && (
                <form action={deleteAnnouncement}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-sm text-slate-400 hover:text-red-600" aria-label="Delete">
                    Delete
                  </button>
                </form>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{a.body}</p>
          </div>
        ))}
      </div>
    </>
  );
}
