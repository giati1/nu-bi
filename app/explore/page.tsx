import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { InterestPicker } from "@/components/interest-picker";
import { PostCard } from "@/components/post-card";
import { requirePageViewer } from "@/lib/auth/session";
import { getDiscoveryFeed, getSuggestedUsers, getTrendingTags, getUserInterests } from "@/lib/db/repository";

export default async function ExplorePage() {
  const viewer = await requirePageViewer("/explore");

  const [posts, suggestions, tags, interests] = await Promise.all([
    getDiscoveryFeed(viewer.id),
    getSuggestedUsers(viewer.id),
    getTrendingTags(),
    getUserInterests(viewer.id)
  ]);

  return (
    <AppShell
      aside={
        <div className="space-y-5">
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Trending tags</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link className="rounded-full bg-white/10 px-3 py-2 text-sm" href={`/search?q=%23${tag.tag}`} key={tag.tag}>
                  #{tag.tag}
                </Link>
              ))}
            </div>
          </section>
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Suggestions</p>
            <div className="mt-4 space-y-3">
              {suggestions.map((user) => (
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
        </div>
      }
      subtitle="Discovery feed, trending tags, and interest-aware user suggestions."
      title="Explore"
    >
      <section className="glass-panel rounded-[28px] p-5">
        <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Interests</p>
        <div className="mt-4">
          <InterestPicker active={interests} />
        </div>
      </section>
      {posts.map((post) => (
        <PostCard key={post.id} post={post} viewerId={viewer.id} />
      ))}
    </AppShell>
  );
}
