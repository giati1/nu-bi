import Link from "next/link";
import { BarChart3, CalendarClock, FileText, Heart, MessageCircle, Bookmark, LibraryBig } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CreatorPostActions } from "@/components/creator-post-actions";
import { FeedComposer } from "@/components/feed-composer";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post-card";
import { getViewer } from "@/lib/auth/session";
import { getCreatorDashboard } from "@/lib/db/repository";

export default async function CreatorPage() {
  const viewer = await getViewer();
  if (!viewer) {
    return null;
  }

  const dashboard = await getCreatorDashboard(viewer.id);

  return (
    <AppShell
      title="Creator Dashboard"
      subtitle="Manage drafts, scheduled content, and published posts from one workspace."
    >
      <div className="flex flex-wrap gap-3">
        <Link className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80" href="/creator/media">
          <LibraryBig className="h-4 w-4" />
          Open media library
        </Link>
      </div>
      <FeedComposer />
      <section className="grid gap-4 md:grid-cols-7">
        {[
          { label: "Published", value: dashboard.metrics.publishedCount, Icon: BarChart3 },
          { label: "Drafts", value: dashboard.metrics.draftCount, Icon: FileText },
          { label: "Scheduled", value: dashboard.metrics.scheduledCount, Icon: CalendarClock },
          { label: "Likes", value: dashboard.metrics.totalLikes, Icon: Heart },
          { label: "Comments", value: dashboard.metrics.totalComments, Icon: MessageCircle },
          { label: "Saves", value: dashboard.metrics.totalSaved, Icon: Bookmark },
          { label: "Views", value: dashboard.metrics.totalViews, Icon: BarChart3 }
        ].map(({ label, value, Icon }) => {
          return (
            <div className="glass-panel rounded-[24px] p-4" key={label}>
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.2em] text-white/50">{label}</p>
                <Icon className="h-4 w-4 text-accent-soft" />
              </div>
              <p className="mt-4 text-2xl font-bold">{value}</p>
            </div>
          );
        })}
      </section>

      <Section title="Drafts">
        {dashboard.drafts.length === 0 ? (
          <EmptyState title="No drafts yet" description="Save a draft from the composer to keep work in progress." />
        ) : (
          dashboard.drafts.map((post) => (
            <div className="space-y-3" key={post.id}>
              <PostCard post={post} viewerId={viewer.id} allowDelete />
              <CreatorPostActions postId={post.id} status="draft" />
            </div>
          ))
        )}
      </Section>

      <Section title="Scheduled">
        {dashboard.scheduled.length === 0 ? (
          <EmptyState title="No scheduled posts" description="Use Schedule in the composer to queue launches and updates." />
        ) : (
          dashboard.scheduled.map((post) => (
            <div className="space-y-3" key={post.id}>
              <PostCard post={post} viewerId={viewer.id} allowDelete />
              <CreatorPostActions postId={post.id} status="scheduled" />
            </div>
          ))
        )}
      </Section>

      <Section title="Recent published">
        {dashboard.published.length === 0 ? (
          <EmptyState title="No published posts yet" description="Your published content will appear here with quick review access." />
        ) : (
          dashboard.published.map((post) => <PostCard key={post.id} post={post} viewerId={viewer.id} allowDelete />)
        )}
      </Section>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">{title}</p>
      {children}
    </section>
  );
}
