import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { HomeStoriesPanel } from "@/components/home-stories-panel";
import { MoodFeedPanel } from "@/components/mood-feed-panel";
import { Avatar } from "@/components/avatar";
import { requirePageViewer } from "@/lib/auth/session";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import {
  getActiveStories,
  getConversationSummaries,
  getHomeFeed,
  getSuggestedUsers,
  getTrendingTags
} from "@/lib/db/repository";

export default async function HomePage() {
  const viewer = await requirePageViewer("/home");
  const canDeleteAnyPost = isInternalAdminUsername(viewer.username);

  const [feed, conversations, suggestions, tags, stories] = await Promise.all([
    getHomeFeed(viewer.id),
    getConversationSummaries(viewer.id),
    getSuggestedUsers(viewer.id),
    getTrendingTags(),
    getActiveStories(viewer.id)
  ]);

  const fallbackStoryItems = [
    {
      id: `viewer-${viewer.id}`,
      label: "Your story",
      href: "/creator",
      imageUrl: viewer.avatarUrl,
      action: true,
      status: "your-story" as const,
      meta: "Post",
      body: "Post a quick update, tease a drop, or share something worth pinning.",
      ctaLabel: "Create story"
    },
    ...suggestions.slice(0, 4).map((user) => ({
      id: `suggested-${user.id}`,
      label: user.displayName,
      href: `/profile/${user.username}`,
      imageUrl: user.avatarUrl,
      status: "new" as const,
      meta: "New",
      body: `Check in on ${user.displayName}'s latest profile updates and posts.`,
      ctaLabel: "Open profile"
    })),
    ...conversations
      .filter((conversation) => !suggestions.some((user) => user.id === conversation.counterpart.id))
      .slice(0, 3)
      .map((conversation) => ({
        id: `conversation-${conversation.id}`,
        label: conversation.counterpart.displayName,
        href: `/messages/${conversation.id}`,
        imageUrl: conversation.counterpart.avatarUrl,
        status: conversation.unreadCount > 0 ? ("new" as const) : ("seen" as const),
        meta: conversation.unreadCount > 0 ? `${conversation.unreadCount} new` : "Recent",
        body:
          conversation.lastMessage?.body ??
          `Pick up the conversation with ${conversation.counterpart.displayName}.`,
        ctaLabel: "Open messages"
      }))
  ];

  const storyItems = stories.length > 0
    ? stories.map((story, index) => ({
        id: story.id,
        label: story.author.displayName,
        href: story.destinationPath ?? `/profile/${story.author.username}`,
        imageUrl: story.mediaUrl ?? story.author.avatarUrl,
        status:
          story.author.id === viewer.id
            ? ("your-story" as const)
            : story.viewerHasSeen
              ? ("seen" as const)
              : index < 4
              ? ("new" as const)
              : ("seen" as const),
        meta:
          story.author.id === viewer.id
            ? "Your update"
            : story.viewerHasSeen
              ? "Seen"
              : index < 4
                ? "Live"
                : "Recent",
        body: story.body,
        ctaLabel:
          story.author.id === viewer.id
            ? story.destinationLabel ?? "Manage story"
            : story.destinationLabel ?? "Open story"
      }))
    : fallbackStoryItems;

  const highlightItems = [
    ...suggestions.slice(0, 2).map((user) => ({
      id: `highlight-profile-${user.id}`,
      label: user.displayName,
      href: `/profile/${user.username}`,
      imageUrl: user.avatarUrl,
      eyebrow: "Creator Spotlight",
      detail: `Open ${user.displayName}'s profile and latest posts.`
    })),
    ...conversations.slice(0, 1).map((conversation) => ({
      id: `highlight-message-${conversation.id}`,
      label: conversation.counterpart.displayName,
      href: `/messages/${conversation.id}`,
      imageUrl: conversation.counterpart.avatarUrl,
      eyebrow: "Reply Queue",
      detail:
        conversation.lastMessage?.body ?? `Pick up where you left off with ${conversation.counterpart.displayName}.`
    })),
    ...tags.slice(0, 1).map((tag) => ({
      id: `highlight-tag-${tag.tag}`,
      label: `#${tag.tag}`,
      href: `/search?q=%23${tag.tag}`,
      eyebrow: "Trending Now",
      detail: "Jump into the conversation around this tag."
    }))
  ].slice(0, 4);

  return (
    <AppShell
      aside={
        <div className="panel-soft edge-light overflow-hidden rounded-[30px]">
          <section className="border-b border-white/[0.08] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Suggested people</p>
            <div className="mt-4 space-y-3">
              {suggestions.slice(0, 4).map((user) => (
                <Link className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5" href={`/profile/${user.username}`} key={user.id}>
                  <Avatar className="h-10 w-10" name={user.displayName} src={user.avatarUrl} />
                  <div>
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-white/50">@{user.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="border-b border-white/[0.08] p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Inbox</p>
              <Link className="text-xs uppercase tracking-[0.18em] text-white/55 hover:text-white" href="/messages">
                Open
              </Link>
            </div>
            <div className="space-y-3">
              {conversations.slice(0, 3).map((conversation) => (
                <Link
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3"
                  href={`/messages/${conversation.id}`}
                  key={conversation.id}
                >
                  <Avatar
                    className="h-11 w-11"
                    name={conversation.counterpart.displayName}
                    src={conversation.counterpart.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{conversation.counterpart.displayName}</p>
                    <p className="truncate text-sm text-white/62">
                      {conversation.lastMessage?.body ?? "Start the thread"}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <span className="rounded-full bg-accent px-2 py-1 text-xs text-white">{conversation.unreadCount}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
          <section className="p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Trending</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.slice(0, 8).map((tag) => (
                <Link className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs" href={`/search?q=%23${tag.tag}`} key={tag.tag}>
                  #{tag.tag}
                </Link>
              ))}
            </div>
          </section>
        </div>
      }
      headerMode="brand-only"
      showInstallPrompt={false}
      subtitle="Check your feed, post something, or finish setting up your profile."
      title={`Home`}
    >
      <section className="flex items-center justify-between gap-4 rounded-[24px] border border-white/[0.08] bg-white/[0.02] px-4 py-4">
        <div>
          <p className="text-base font-semibold text-white">Home</p>
          <p className="mt-1 text-sm text-white/58">
            Stories first, feed next, everything else off to the side.
          </p>
        </div>
        <Link
          className="rounded-2xl border border-accent/35 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-4 py-3 text-sm font-medium text-white"
          href="/creator"
        >
          Create post
        </Link>
      </section>
      <HomeStoriesPanel highlights={highlightItems} stories={storyItems} />
      {feed.length === 0 ? (
        <EmptyState
          actionHref="/explore"
          actionLabel="Find people to follow"
          description="Follow people from Explore or create your first post to wake up your feed."
          title="Your feed is still quiet"
        />
      ) : (
        <MoodFeedPanel
          canDeleteAnyPost={canDeleteAnyPost}
          feed={feed}
          presence={[]}
          viewerId={viewer.id}
        />
      )}
    </AppShell>
  );
}
