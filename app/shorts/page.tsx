import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { ShortsFeed } from "@/components/shorts-feed";
import { requirePageViewer } from "@/lib/auth/session";
import { getShortsFeed } from "@/lib/db/repository";

export default async function ShortsPage() {
  const viewer = await requirePageViewer("/shorts");

  const shorts = await getShortsFeed(viewer.id);

  return (
    <AppShell
      title="Shorts"
      subtitle="Fast vertical video drops with snap scrolling, autoplay, and early video analytics."
    >
      {shorts.length === 0 ? (
        <EmptyState
          title="No shorts yet"
          description="Upload a 15 to 30 second video from the composer to start the short-form feed."
        />
      ) : (
        <ShortsFeed posts={shorts} />
      )}
    </AppShell>
  );
}
