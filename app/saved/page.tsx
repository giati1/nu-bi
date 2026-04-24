import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post-card";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { requirePageViewer } from "@/lib/auth/session";
import { getSavedPosts } from "@/lib/db/repository";

export default async function SavedPage() {
  const viewer = await requirePageViewer("/saved");
  const canDeleteAnyPost = isInternalAdminUsername(viewer.username);

  const posts = await getSavedPosts(viewer.id);

  return (
    <AppShell
      subtitle="Posts you save show up here so you can come back to them later."
      title="Saved"
    >
      {posts.length === 0 ? (
        <EmptyState
          actionHref="/home"
          actionLabel="Go to Home"
          title="Nothing saved yet"
          description="Use Save on any post to keep it here, then come back when you want to revisit it."
        />
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            viewerId={viewer.id}
            allowDelete={canDeleteAnyPost || post.author.id === viewer.id}
            allowEngagementOverride={canDeleteAnyPost}
          />
        ))
      )}
    </AppShell>
  );
}
