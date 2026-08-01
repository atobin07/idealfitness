import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/PageHeader";
import { PostFeed, POST_SELECT, type PostRow } from "@/components/community/PostFeed";

export default async function AnimalKingdomPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const [{ data: postsRaw }, { data: peopleRaw }] = await Promise.all([
    supabase.from("posts").select(POST_SELECT).eq("channel", "pets").order("created_at", { ascending: false }).limit(40),
    supabase.from("profiles").select("id, full_name").neq("id", profile.id).order("full_name"),
  ]);

  const posts = (postsRaw ?? []) as unknown as PostRow[];
  const people = (peopleRaw ?? []) as { id: string; full_name: string; avatar_url: string | null }[];

  return (
    <>
      <PageHeader
        title="Animal Kingdom 🐾"
        subtitle="Our gym's pets. Share photos and updates about your dogs (and every other good boy & girl)."
      />

      <div className="mx-auto max-w-2xl">
        <PostFeed
          posts={posts}
          people={people}
          me={{ id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url }}
          isAdmin={profile.is_admin}
          channel="pets"
          composerVariant="simple"
          composerPlaceholder="Show off your pup! Share a photo or an update 🐶"
          emptyText="No critters yet. Post the first pup! 🐾"
        />
      </div>
    </>
  );
}
