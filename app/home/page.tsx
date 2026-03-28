import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { FeedComposer } from "@/components/feed-composer";
import { LiveRefresh } from "@/components/live-refresh";
import { PostCard } from "@/components/post-card";
import { Avatar } from "@/components/avatar";
import { getViewer } from "@/lib/auth/session";
import { getConversationSummaries, getHomeFeed, getNotifications, getSuggestedUsers, getTrendingTags } from "@/lib/db/repository";

export default async function HomePage() {
  const viewer = await getViewer();
  if (!viewer) {
    return null;
  }

  const [feed, conversations, notifications, suggestions, tags] = await Promise.all([
    getHomeFeed(viewer.id),
    getConversationSummaries(viewer.id),
    getNotifications(viewer.id),
    getSuggestedUsers(viewer.id),
    getTrendingTags()
  ]);

  return (
    <AppShell
      aside={
        <div className="space-y-5">
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">AI tools</p>
            <div className="mt-4 rounded-[24px] border border-accent/20 bg-accent/5 p-4">
              <p className="text-base font-semibold">Launch faster with AI Studio</p>
              <p className="mt-2 text-sm text-white/60">
                Rewrite captions, draft replies, and generate branded images without leaving Nu-bi.
              </p>
              <Link
                className="mt-4 inline-flex rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white"
                href="/ai"
              >
                Open AI Studio
              </Link>
            </div>
          </section>
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Inbox</p>
            <div className="mt-4 space-y-3">
              {conversations.slice(0, 4).map((conversation) => (
                <Link
                  className="flex items-center gap-3 rounded-2xl border border-white/10 p-3"
                  href={`/messages/${conversation.id}`}
                  key={conversation.id}
                >
                  <Avatar
                    className="h-11 w-11"
                    name={conversation.counterpart.displayName}
                    src={conversation.counterpart.avatarUrl}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{conversation.counterpart.displayName}</p>
                    <p className="truncate text-sm text-white/55">
                      {conversation.lastMessage?.body ?? "Start the thread"}
                    </p>
                  </div>
                  {conversation.unreadCount > 0 ? (
                    <span className="rounded-full bg-accent px-2 py-1 text-xs">{conversation.unreadCount}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Suggested people</p>
            <div className="mt-4 space-y-3">
              {suggestions.slice(0, 4).map((user) => (
                <Link className="flex items-center gap-3" href={`/profile/${user.username}`} key={user.id}>
                  <Avatar className="h-10 w-10" name={user.displayName} src={user.avatarUrl} />
                  <div>
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-white/50">@{user.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Notifications</p>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              {notifications.slice(0, 5).map((notification) => (
                <div className="rounded-2xl border border-white/10 p-3" key={notification.id}>
                  <p>
                    <span className="font-medium">
                      {notification.actor?.displayName ?? "Nu-bi"}
                    </span>{" "}
                    triggered a {notification.type} notification.
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Trending</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.slice(0, 8).map((tag) => (
                <Link className="rounded-full bg-white/10 px-3 py-2 text-xs" href={`/search?q=%23${tag.tag}`} key={tag.tag}>
                  #{tag.tag}
                </Link>
              ))}
            </div>
          </section>
        </div>
      }
      subtitle="Your home feed blends followed creators with discovery, then routes the same identity graph into messaging and notifications."
      title={`Welcome back, ${viewer.displayName}`}
    >
      <LiveRefresh intervalMs={15000} />
      <section className="glass-panel relative overflow-hidden rounded-[30px] border-accent/15 bg-mesh-red p-5 shadow-panel md:p-6">
        <div className="absolute -right-12 top-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.28em] text-accent-soft">Today on NU-BI</p>
            <h3 className="mt-3 break-words text-2xl font-semibold leading-tight md:text-3xl">Post faster, cut cleaner, and publish short-form video from anywhere.</h3>
            <p className="mt-3 text-sm text-white/65 md:text-base">
              The new upload flow gives you in-app camera recording, trimming, filters, and faster routes into shorts.
            </p>
          </div>
          <div className="grid min-w-0 gap-3 sm:grid-cols-3">
            {[
              ["Quick Upload", "Post from any page"],
              ["Shorts Ready", "Trim to 30 seconds"],
              ["AI Assist", "Refine captions and visuals"]
            ].map(([label, detail]) => (
              <div className="min-w-0 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4" key={label}>
                <p className="break-words text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
                <p className="mt-2 break-words text-sm text-white/80">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <FeedComposer />
      {feed.length === 0 ? (
        <EmptyState
          description="Follow people or publish your first post to start the graph."
          title="Your feed is still quiet"
        />
      ) : (
        feed.map((post) => (
          <PostCard
            allowDelete={post.author.id === viewer.id}
            key={post.id}
            post={post}
            viewerId={viewer.id}
          />
        ))
      )}
    </AppShell>
  );
}
