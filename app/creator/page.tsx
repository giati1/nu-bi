import Link from "next/link";
import { Heart, MessageCircle, Bookmark, Sparkles } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { CreatorCommandPanel } from "@/components/creator-command-panel";
import { CreatorPostActions } from "@/components/creator-post-actions";
import { FeedComposer } from "@/components/feed-composer";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post-card";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { requirePageViewer } from "@/lib/auth/session";
import { getCreatorDashboard, getStoryInbox } from "@/lib/db/repository";
import { formatRelativeDate } from "@/lib/utils";

export default async function CreatorPage() {
  const viewer = await requirePageViewer("/creator");
  const canDeleteAnyPost = isInternalAdminUsername(viewer.username);

  const [dashboard, storyInbox] = await Promise.all([
    getCreatorDashboard(viewer.id),
    getStoryInbox(viewer.id)
  ]);

  return (
    <AppShell
      title="Create Post"
      subtitle="Write a post, save drafts, schedule updates, and review published content from one place."
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="panel-soft edge-light rounded-[30px] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Start here</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Make posting obvious</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
            Write in the composer below, attach a photo or video if you want one, then publish now, save as a draft,
            or schedule it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="rounded-2xl border border-accent/35 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-4 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(127,29,29,0.32)]" href="#post-composer">
              Jump to post composer
            </a>
            <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75" href="/settings/profile">
              Finish profile setup
            </Link>
            <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75" href="/creator/media">
              Open media library
            </Link>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { step: "1", title: "Add post text", body: "A short update is enough to publish." },
              { step: "2", title: "Attach media", body: "Optional image, short video, or poll." },
              { step: "3", title: "Choose publish mode", body: "Publish now, draft it, or schedule it." }
            ].map((item) => (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4" key={item.step}>
                <p className="text-[11px] uppercase tracking-[0.18em] text-accent-soft">Step {item.step}</p>
                <p className="mt-2 font-medium text-white">{item.title}</p>
                <p className="mt-2 text-sm text-white/62">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="panel-soft edge-light rounded-[30px] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Your profile</p>
          <div className="mt-4 flex items-center gap-3">
            <Avatar className="h-12 w-12" name={viewer.displayName} src={viewer.avatarUrl} />
            <div>
              <p className="font-semibold text-white">{viewer.displayName}</p>
              <p className="text-sm text-white/60">@{viewer.username}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-white/65">
            People decide fast whether to follow. Keep your photo, bio, and first post in shape so the profile feels alive.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link className="rounded-2xl border border-accent/35 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-4 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(127,29,29,0.32)]" href={`/profile/${viewer.username}`}>
              View public profile
            </Link>
            <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75" href="/settings/profile">
              Edit profile
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <CreatorCommandPanel metrics={dashboard.metrics} />
        <div className="panel-soft edge-light rounded-[30px] p-5">
          <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Engagement pulse</p>
          <div className="mt-4 space-y-3">
            {[
              { label: "Story reactions", value: storyInbox.reactionsCount, Icon: Heart },
              { label: "Story replies", value: storyInbox.repliesCount, Icon: MessageCircle },
              { label: "Post comments", value: dashboard.metrics.totalComments, Icon: MessageCircle },
              { label: "Post saves", value: dashboard.metrics.totalSaved, Icon: Bookmark }
            ].map(({ label, value, Icon }) => (
              <div className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3" key={label}>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/[0.05] p-2.5">
                    <Icon className="h-4 w-4 text-accent-soft" />
                  </div>
                  <p className="text-sm text-white/72">{label}</p>
                </div>
                <p className="text-xl font-semibold text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4" id="post-composer">
        <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Create post</p>
        <FeedComposer />
      </section>

      <Section title="Story inbox">
        <div className="panel-soft edge-light rounded-[26px] p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Recent story activity</p>
              <p className="mt-1 text-sm text-white/62">
                See who reacted, read replies, and decide what you want to post next.
              </p>
            </div>
            <Sparkles className="mt-1 h-4 w-4 shrink-0 text-accent-soft" />
          </div>
        </div>

        {storyInbox.items.length === 0 ? (
          <EmptyState
            title="No story engagement yet"
            description="Reactions and replies from your stories will collect here for quick review."
          />
        ) : (
          <div className="space-y-3">
            {storyInbox.items.map((item) => (
              <div className="panel-soft edge-light rounded-[26px] p-4" key={item.id}>
                <div className="flex items-start gap-3">
                  <Avatar
                    className="h-11 w-11"
                    name={item.actor.displayName}
                    src={item.actor.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-white/88">
                        <span className="font-semibold">{item.actor.displayName}</span>{" "}
                        {item.kind === "reaction"
                          ? `reacted to your story ${item.emoji ?? ""}`.trim()
                          : "replied to your story"}
                      </p>
                      <p className="shrink-0 text-[11px] uppercase tracking-[0.14em] text-white/45">
                        {formatRelativeDate(item.createdAt)}
                      </p>
                    </div>
                    {item.body ? (
                      <p className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm text-white/78">
                        {item.body}
                      </p>
                    ) : null}
                    {item.media?.mimeType?.startsWith("audio/") ? (
                      <div className="mt-2 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3">
                        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-white/45">Voice reply</p>
                        <audio className="w-full" controls preload="metadata" src={item.media.url} />
                      </div>
                    ) : null}
                    <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 text-sm text-white/65">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Story context</p>
                      <p className="mt-2 line-clamp-2">
                        {item.story.body || "Story media update"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Drafts">
        {dashboard.drafts.length === 0 ? (
          <EmptyState title="No drafts yet" description="Save a draft from the composer to keep work in progress." />
        ) : (
          dashboard.drafts.map((post) => (
            <div className="space-y-3" key={post.id}>
              <PostCard
                allowDelete
                allowEngagementOverride={canDeleteAnyPost}
                post={post}
                viewerId={viewer.id}
              />
              <CreatorPostActions postId={post.id} status="draft" />
            </div>
          ))
        )}
      </Section>

      <Section title="Scheduled">
        {dashboard.scheduled.length === 0 ? (
          <EmptyState title="No scheduled posts" description="Use Schedule in the composer to post later." />
        ) : (
          dashboard.scheduled.map((post) => (
            <div className="space-y-3" key={post.id}>
              <PostCard
                allowDelete
                allowEngagementOverride={canDeleteAnyPost}
                post={post}
                viewerId={viewer.id}
              />
              <CreatorPostActions postId={post.id} status="scheduled" />
            </div>
          ))
        )}
      </Section>

      <Section title="Recent published">
        {dashboard.published.length === 0 ? (
          <EmptyState title="No published posts yet" description="Your published content will appear here with quick review access." />
        ) : (
          dashboard.published.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              viewerId={viewer.id}
              allowDelete
              allowEngagementOverride={canDeleteAnyPost}
            />
          ))
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
