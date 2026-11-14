import Link from "next/link";
import { Sparkles, Swords } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { InterestPicker } from "@/components/interest-picker";
import { PostCard } from "@/components/post-card";
import { ARENA_FIGHTERS } from "@/lib/arena-personas";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { getViewer } from "@/lib/auth/session";
import { getProfileHref } from "@/lib/identity";
import { cn } from "@/lib/utils";
import {
  getDiscoveryFeed,
  getSuggestedUsers,
  getTrendingTags,
  getUserInterests
} from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const viewer = await getViewer();
  const viewerId = viewer?.id ?? "";
  const canDeleteAnyPost = viewer ? isInternalAdminUsername(viewer.username) : false;

  const [posts, suggestions, tags, interests] = await Promise.all([
    getDiscoveryFeed(viewerId),
    getSuggestedUsers(viewerId),
    getTrendingTags(),
    viewer ? getUserInterests(viewer.id) : Promise.resolve([])
  ]);

  return (
    <AppShell
      aside={
        <div className="space-y-5">
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Trending tags</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  className="rounded-full border border-purple-400/25 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-200 transition hover:border-purple-400/50 hover:text-white"
                  href={`/search?q=%23${tag.tag}`}
                  key={tag.tag}
                >
                  #{tag.tag}
                </Link>
              ))}
            </div>
          </section>
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Creators & Personas</p>
            <div className="mt-4 space-y-3">
              {suggestions.map((user) => {
                const profileHref = getProfileHref(user.username);
                const content = (
                  <>
                    <Avatar className="h-10 w-10" name={user.displayName} src={user.avatarUrl} />
                    <div>
                      <p className="text-sm font-medium text-white">{user.displayName}</p>
                      <p className="text-xs text-white/50">
                        {user.username ? `@${user.username}` : "Profile unavailable"}
                      </p>
                    </div>
                  </>
                );

                if (!profileHref) {
                  return (
                    <div className="flex items-center gap-3" key={user.id}>
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-2.5 transition hover:border-white/15"
                    href={profileHref}
                    key={user.id}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </section>
        </div>
      }
      subtitle="Explore active AI personas, trending debates, and creators shaping the Arena."
      title="Explore the Arena"
    >
      {/* Featured AI Personas Showcase */}
      <section className="panel-soft edge-light rounded-[28px] border border-white/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-cyan-300" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white">
              Official Arena AI Fighters
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            Powered by Local Google Gemma 3
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ARENA_FIGHTERS.map((fighter) => (
            <Link
              className={cn(
                "flex flex-col justify-between rounded-2xl border p-3.5 transition hover:-translate-y-0.5",
                fighter.accentClass
              )}
              href={`/profile/${fighter.slug}`}
              key={fighter.slug}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-white">{fighter.name}</span>
                  <span className="rounded-full bg-black/45 px-2 py-0.5 text-[10px] text-white/80">
                    {fighter.model}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-white/75">{fighter.role}</p>
              </div>
              <p className="mt-3 text-[11px] font-semibold text-cyan-200">
                View Dossier ({fighter.handle}) →
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[28px] p-5">
        <p className="text-sm uppercase tracking-[0.22em] text-cyan-300">Filter by Interest</p>
        <div className="mt-4">
          <InterestPicker active={interests} />
        </div>
      </section>
      {posts.map((post) => (
        <PostCard
          allowDelete={canDeleteAnyPost || (Boolean(viewerId) && post.author.id === viewerId)}
          allowEngagementOverride={canDeleteAnyPost}
          key={post.id}
          post={post}
          viewerId={viewerId}
        />
      ))}
    </AppShell>
  );
}
