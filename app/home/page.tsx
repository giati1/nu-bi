import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ArenaQuickComposer } from "@/components/arena-quick-composer";
import { EmptyState } from "@/components/empty-state";
import { HomeAIToolsPanel } from "@/components/home-ai-tools-panel";
import { HomeStoriesPanel } from "@/components/home-stories-panel";
import { MoodFeedPanel } from "@/components/mood-feed-panel";
import { Avatar } from "@/components/avatar";
import { getViewer } from "@/lib/auth/session";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { getProfileHref, resolveStoryDestinationPath } from "@/lib/identity";
import {
  getActiveStories,
  getConversationSummaries,
  getHomeFeed,
  getSuggestedUsers,
  getTrendingTags
} from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const viewer = await getViewer();
  const viewerId = viewer?.id ?? "";
  const canDeleteAnyPost = viewer ? isInternalAdminUsername(viewer.username) : false;

  const [feed, conversations, suggestions, tags, stories] = await Promise.all([
    getHomeFeed(viewerId),
    viewer ? getConversationSummaries(viewer.id) : Promise.resolve([]),
    getSuggestedUsers(viewerId),
    getTrendingTags(),
    getActiveStories(viewerId)
  ]);

  const fallbackStoryItems = [
    ...(viewer
      ? [
          {
            id: `viewer-${viewer.id}`,
            type: "storyAction" as const,
            label: "Your story",
            href: "/creator",
            imageUrl: viewer.avatarUrl,
            action: true,
            status: "your-story" as const,
            meta: "Post",
            body: "Post a quick update, tease a drop, or share something worth pinning.",
            ctaLabel: "Create story"
          }
        ]
      : []),
    ...suggestions.slice(0, 4).map((user) => {
      const profileHref = getProfileHref(user.username);
      const existingConversation = conversations.find((conversation) => conversation.counterpart.id === user.id);
      return {
        id: `suggested-${user.id}`,
        type: "profileShortcut" as const,
        label: user.displayName,
        href: profileHref ?? undefined,
        secondaryHref: existingConversation ? `/messages/${existingConversation.id}` : undefined,
        secondaryCtaLabel: existingConversation ? "Message" : undefined,
        imageUrl: user.avatarUrl,
        status: "new" as const,
        meta: "New",
        body: `Check in on ${user.displayName}'s latest profile updates and posts.`,
        ctaLabel: profileHref ? "Open profile" : "Message"
      };
    }),
    ...conversations
      .filter((conversation) => !suggestions.some((user) => user.id === conversation.counterpart.id))
      .slice(0, 3)
      .map((conversation) => ({
        id: `conversation-${conversation.id}`,
        type: "messageShortcut" as const,
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
        type: "realStory" as const,
        label: story.author.displayName,
        href:
          resolveStoryDestinationPath({
            destinationPath: story.destinationPath,
            authorUsername: story.author.username
          }) ?? undefined,
        imageUrl: story.mediaUrl ?? story.author.avatarUrl,
        status:
          story.author.id === viewerId
            ? ("your-story" as const)
            : story.viewerHasSeen
              ? ("seen" as const)
              : index < 4
              ? ("new" as const)
              : ("seen" as const),
        meta:
          story.author.id === viewerId
            ? "Your update"
            : story.viewerHasSeen
              ? "Seen"
              : index < 4
                ? "Live"
                : "Recent",
        body: story.body,
        ctaLabel:
          story.author.id === viewerId
            ? story.destinationLabel ?? "Manage story"
            : story.destinationLabel ?? "Open story"
      }))
    : fallbackStoryItems;

  const highlightItems = [
    ...suggestions
      .slice(0, 2)
      .map((user) => {
        const profileHref = getProfileHref(user.username);
        if (!profileHref) {
          return null;
        }

        return {
          id: `highlight-profile-${user.id}`,
          label: user.displayName,
          href: profileHref,
          imageUrl: user.avatarUrl,
          eyebrow: "Creator Spotlight",
          detail: `Open ${user.displayName}'s profile and latest posts.`
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item)),
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
                (() => {
                  const profileHref = getProfileHref(user.username);
                  const content = (
                    <>
                      <Avatar className="h-10 w-10" name={user.displayName} src={user.avatarUrl} />
                      <div>
                        <p className="text-sm font-medium">{user.displayName}</p>
                        <p className="text-xs text-white/50">
                          {user.username ? `@${user.username}` : "Profile unavailable"}
                        </p>
                      </div>
                    </>
                  );

                  if (!profileHref) {
                    return (
                      <div className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5" key={user.id}>
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5" href={profileHref} key={user.id}>
                      {content}
                    </Link>
                  );
                })()
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
      subtitle="Drop a take, summon AI personas, and jump into live debates."
      title={`Arena Feed`}
    >
      <ArenaQuickComposer />
      <HomeStoriesPanel highlights={highlightItems} stories={storyItems} />
      <section className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.85fr)]">
        <Link
          className="rounded-[26px] border border-purple-400/35 bg-[linear-gradient(135deg,rgba(139,92,246,0.22),rgba(244,63,94,0.14))] px-5 py-5 text-white shadow-[0_18px_40px_rgba(139,92,246,0.18)] transition hover:border-purple-400/55 hover:brightness-110"
          href={viewer ? "/ai-tools" : "/login?next=%2Fai-tools"}
        >
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">AI Studio</p>
          <h2 className="mt-2 text-2xl font-semibold">Create with AI Studio</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
            Generate text-to-video, image-to-video, voice clones, and direct AI persona chats.
          </p>
        </Link>
        <HomeAIToolsPanel />
      </section>
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
          viewerId={viewerId}
        />
      )}
    </AppShell>
  );
}
