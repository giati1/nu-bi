import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ArenaQuickComposer } from "@/components/arena-quick-composer";
import { BackgroundVideo } from "@/components/background-video";
import { EmptyState } from "@/components/empty-state";
import { HomeStoriesPanel } from "@/components/home-stories-panel";
import { MoodFeedPanel } from "@/components/mood-feed-panel";
import { Avatar } from "@/components/avatar";
import { ARENA_FIGHTERS } from "@/lib/arena-personas";
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
        <div className="space-y-4">
          {/* Looping Video Sidebar Spotlight */}
          <Link
            href="/shorts"
            className="group relative flex min-h-[220px] flex-col justify-between overflow-hidden rounded-[28px] border border-white/15 bg-black p-5 shadow-[0_20px_50px_rgba(0,0,0,0.75)] transition hover:border-white/40"
          >
            <BackgroundVideo
              src="/cinematic/culture-loop.mp4"
              poster="/cinematic/shot-3.jpg"
              overlayStyle="card"
            />
            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                SHORTS // LIVE
              </span>
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/55 text-xs text-white transition group-hover:bg-white group-hover:text-black">
                ↗
              </span>
            </div>
            <div className="relative z-10 mt-auto pt-10">
              <p className="font-display text-2xl font-black uppercase leading-none tracking-tight text-white">
                CULTURE IN MOTION
              </p>
              <p className="mt-1.5 text-xs text-white/75">
                Watch full-screen vertical clips and studio drops from the community.
              </p>
            </div>
          </Link>

          <div className="panel-soft edge-light overflow-hidden rounded-[30px]">
            <section className="border-b border-white/[0.08] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-400">
                Voices to Know
              </p>
              <div className="mt-4 space-y-3">
                {ARENA_FIGHTERS.map((voice) => (
                  <Link
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 transition hover:border-white/25 hover:bg-white/[0.05]"
                    href={`/profile/${voice.slug}`}
                    key={voice.slug}
                  >
                    <img
                      src={voice.avatarUrl}
                      alt={voice.name}
                      className="h-11 w-11 rounded-2xl object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-white">{voice.name}</p>
                        <span className="rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/75">
                          {voice.tag}
                        </span>
                      </div>
                      <p className="truncate text-xs text-white/55">{voice.role}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
            <section className="border-b border-white/[0.08] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-400">Inbox</p>
                <Link
                  className="text-xs uppercase tracking-[0.18em] text-white/55 hover:text-white"
                  href="/messages"
                >
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
                      <p className="truncate font-medium text-white">
                        {conversation.counterpart.displayName}
                      </p>
                      <p className="truncate text-sm text-white/62">
                        {conversation.lastMessage?.body ?? "Start the thread"}
                      </p>
                    </div>
                    {conversation.unreadCount > 0 ? (
                      <span className="rounded-full bg-accent px-2 py-1 text-xs text-white">
                        {conversation.unreadCount}
                      </span>
                    ) : null}
                  </Link>
                ))}
              </div>
            </section>
            <section className="p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-400">
                Trending
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {tags.slice(0, 8).map((tag) => (
                  <Link
                    className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs transition hover:border-white/30 hover:text-white"
                    href={`/search?q=%23${tag.tag}`}
                    key={tag.tag}
                  >
                    #{tag.tag}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      }
      headerMode="brand-only"
      showInstallPrompt={false}
      subtitle="Share what you're building, drop unfiltered takes, and jump into live threads."
      title={`Pulse Feed`}
    >
      <ArenaQuickComposer />
      <HomeStoriesPanel highlights={highlightItems} stories={storyItems} />
      <section className="grid gap-3.5 md:grid-cols-2">
        <Link
          className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[1.6rem] border border-white/15 bg-black p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:border-white/40"
          href="/shorts"
        >
          <BackgroundVideo
            src="/cinematic/culture-loop.mp4"
            poster="/cinematic/shot-3.jpg"
            overlayStyle="card"
          />
          <div className="relative z-10 flex items-center justify-between">
            <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
              MOTION // SHORT-FORM
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/55 text-xs text-white transition group-hover:bg-white group-hover:text-black">
              ↗
            </span>
          </div>
          <div className="relative z-10 mt-auto pt-8">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white">
              WATCH SHORTS &amp; DROPS
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/80">
              Full-screen vertical video clips, studio sessions, and visual stories from the room.
            </p>
          </div>
        </Link>

        <Link
          className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[1.6rem] border border-white/15 bg-black p-5 text-white shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:border-white/40"
          href={viewer ? "/creator" : "/login?next=%2Fcreator"}
        >
          <BackgroundVideo
            src="/cinematic/creator-loop.mp4"
            poster="/cinematic/shot-4.jpg"
            overlayStyle="card"
          />
          <div className="relative z-10 flex items-center justify-between">
            <span className="rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md">
              STUDIO // CREATE
            </span>
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/55 text-xs text-white transition group-hover:bg-white group-hover:text-black">
              ↗
            </span>
          </div>
          <div className="relative z-10 mt-auto pt-8">
            <h2 className="font-display text-2xl font-black uppercase tracking-tight text-white">
              OPEN CREATOR STUDIO
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/80">
              Publish video drops, photo carousels, voice notes, and live community polls.
            </p>
          </div>
        </Link>
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
