import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post-card";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { requirePageViewer } from "@/lib/auth/session";
import { getTrendingTags, searchAll } from "@/lib/db/repository";

export default async function SearchPage({
  searchParams
}: {
  searchParams: { q?: string };
}) {
  const viewer = await requirePageViewer("/search");
  const canDeleteAnyPost = isInternalAdminUsername(viewer.username);
  const query = searchParams.q?.trim() ?? "";
  const normalizedTag = query.startsWith("#") ? query.slice(1).toLowerCase() : null;
  const [results, trendingTags] = await Promise.all([
    query ? await searchAll(query, viewer.id) : { users: [], posts: [] },
    getTrendingTags()
  ]);
  const relatedTags =
    normalizedTag
      ? trendingTags.filter((tag) => tag.tag !== normalizedTag && (tag.tag.includes(normalizedTag) || normalizedTag.includes(tag.tag))).slice(0, 6)
      : trendingTags.slice(0, 6);
  const subtitle = normalizedTag
    ? `Posts and people connected to #${normalizedTag}.`
    : "Search for people, posts, and tags.";
  const title = normalizedTag ? `#${normalizedTag}` : "Search";

  return (
    <AppShell
      aside={
        <section className="glass-panel rounded-[28px] p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">
            {normalizedTag ? "Related tags" : "Trending tags"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedTags.map((tag) => (
              <Link
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-xs text-white/78 hover:bg-white/8"
                href={`/search?q=%23${tag.tag}`}
                key={tag.tag}
              >
                #{tag.tag} <span className="text-white/46">{tag.count}</span>
              </Link>
            ))}
          </div>
        </section>
      }
      subtitle={subtitle}
      title={title}
    >
      <form action="/search" className="glass-panel rounded-[28px] p-4">
        <input
          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 outline-none focus:border-accent"
          defaultValue={query}
          name="q"
          placeholder="Search users, bios, or posts"
        />
      </form>
      {!query ? (
        <EmptyState
          description="Search creators, profiles, or specific post text."
          title="Start with a name, keyword, or idea"
        />
      ) : (
        <>
          {normalizedTag ? (
            <section className="grid gap-4 md:grid-cols-3">
              <div className="glass-panel rounded-[28px] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Posts in topic</p>
                <p className="mt-3 text-3xl font-semibold text-white">{results.posts.length}</p>
                <p className="mt-2 text-sm text-white/60">Published posts using #{normalizedTag} in the current result set.</p>
              </div>
              <div className="glass-panel rounded-[28px] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Creators in topic</p>
                <p className="mt-3 text-3xl font-semibold text-white">{results.users.length}</p>
                <p className="mt-2 text-sm text-white/60">Profiles matching or posting around this tag right now.</p>
              </div>
              <div className="glass-panel rounded-[28px] p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Topic cue</p>
                <p className="mt-3 text-lg font-semibold text-white">Post with this tag</p>
                <p className="mt-2 text-sm text-white/60">Use #{normalizedTag} in your next post to join the conversation.</p>
              </div>
            </section>
          ) : null}
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">
              {normalizedTag ? "People around this topic" : "Users"}
            </p>
            {results.users.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {results.users.map((user) => (
                  <Link
                    className="flex items-center gap-3 rounded-2xl border border-white/10 p-4"
                    href={`/profile/${user.username}`}
                    key={user.id}
                  >
                    <Avatar className="h-12 w-12" name={user.displayName} src={user.avatarUrl} />
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-sm text-white/50">@{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-white/55">
                {normalizedTag
                  ? `No profile matches surfaced for #${normalizedTag} yet.`
                  : "No user matches for this search yet."}
              </p>
            )}
          </section>
          <section className="space-y-4">
            {results.posts.length > 0 ? (
              results.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  viewerId={viewer.id}
                  allowDelete={canDeleteAnyPost || post.author.id === viewer.id}
                  allowEngagementOverride={canDeleteAnyPost}
                />
              ))
            ) : (
              <EmptyState
                description={
                  normalizedTag
                    ? `No posts have been shared with #${normalizedTag} yet.`
                    : "No posts matched this search yet."
                }
                title={normalizedTag ? `No posts in #${normalizedTag} yet` : "No matching posts"}
              />
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}
