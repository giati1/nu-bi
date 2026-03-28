import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post-card";
import { requirePageViewer } from "@/lib/auth/session";
import { getSavedPosts } from "@/lib/db/repository";

export default async function SavedPage() {
  const viewer = await requirePageViewer("/saved");

  const posts = await getSavedPosts(viewer.id);

  return (
    <AppShell
      subtitle="Private saves for ideas, references, competitor scans, and content you want to revisit."
      title="Saved posts"
    >
      {posts.length === 0 ? (
        <EmptyState title="Nothing saved yet" description="Use Save on any post to keep it here." />
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} viewerId={viewer.id} />)
      )}
    </AppShell>
  );
}
