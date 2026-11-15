import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { BackgroundVideo } from "@/components/background-video";
import { InterestPicker } from "@/components/interest-picker";
import { PostCard } from "@/components/post-card";
import { ARENA_FIGHTERS, CINEMATIC_TOPICS } from "@/lib/arena-personas";
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
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-400">
              Trending Tags
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-white/35 hover:bg-white hover:text-black"
                  href={`/search?q=%23${tag.tag}`}
                  key={tag.tag}
                >
                  #{tag.tag}
                </Link>
              ))}
            </div>
          </section>
          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-400">
              Creators &amp; Voices
            </p>
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
      subtitle="Visual topics, cultural flashpoints, and the voices moving the feed."
      title="Explore The World"
    >
      {/* Visual Video Topic Cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
            CULTURE WAVES // VIDEO CHANNELS
          </p>
          <Link
            href="/home"
            className="text-xs font-bold uppercase tracking-[0.18em] text-rose-400 hover:text-white"
          >
            Open Live Stream →
          </Link>
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          {CINEMATIC_TOPICS.map((topic) => (
            <Link
              key={topic.id}
              href="/home"
              className="group relative flex min-h-[230px] flex-col justify-between overflow-hidden rounded-[1.6rem] border border-white/15 bg-black p-5 shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition hover:-translate-y-0.5 hover:border-white/40"
            >
              <BackgroundVideo
                src={topic.videoUrl}
                poster={topic.imageUrl}
                overlayStyle="card"
              />
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                  {topic.eyebrow}
                </span>
                <span className="text-xs font-bold text-white/80">{topic.tag}</span>
              </div>

              <div className="relative z-10 mt-auto pt-10">
                <h2 className="font-display text-2xl font-black uppercase leading-tight tracking-tight text-white">
                  {topic.headline}
                </h2>
                <p className="mt-1.5 text-xs leading-relaxed text-white/80">
                  {topic.subcopy}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Voices Portrait Gallery */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
            FEATURED REGULARS // REAL PEOPLE &amp; VOICES
          </p>
          <span className="text-xs text-white/50">Active across today&apos;s top threads</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ARENA_FIGHTERS.map((fighter) => (
            <Link
              className="group relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/15 bg-black p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)] transition hover:-translate-y-0.5 hover:border-white/40"
              href={`/profile/${fighter.slug}`}
              key={fighter.slug}
            >
              <img
                src={fighter.avatarUrl}
                alt={fighter.name}
                className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.42) 48%, rgba(4,4,8,0.95) 100%)"
                }}
              />
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                  <span className={cn("h-2 w-2 rounded-full", fighter.dotClass)} />
                  {fighter.tag}
                </span>
                <span className="rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-md">
                  {fighter.handle}
                </span>
              </div>

              <div className="relative z-10 mt-auto pt-12">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  {fighter.role}
                </p>
                <p className="mt-0.5 font-display text-xl font-black uppercase tracking-tight text-white">
                  {fighter.name}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] text-white/75">{fighter.bio}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="glass-panel rounded-[28px] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-400">
          Filter by Interest
        </p>
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
