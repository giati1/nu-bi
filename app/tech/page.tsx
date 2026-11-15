import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BackgroundVideo } from "@/components/background-video";
import { PostCard } from "@/components/post-card";
import { TechRadarDeck } from "@/components/tech-radar-deck";
import { ARENA_FIGHTERS } from "@/lib/arena-personas";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { getViewer } from "@/lib/auth/session";
import { getDiscoveryFeed, getHomeFeed } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

const TECH_KEYWORDS_REGEX =
  /\b(ai|tech|model|models|llm|gpu|gpus|chip|chips|silicon|robot|robotics|agent|agents|open-source|opensource|compute|code|coding|software|hardware|startup|cloud|neural|quantum|automation|deepseek|openai|gemma|llama|nvidia)\b/i;

const TECH_TAGS = [
  "ai",
  "tech",
  "aimodels",
  "agents",
  "hardware",
  "robotics",
  "openweights",
  "startups"
];

export default async function TechPage() {
  const viewer = await getViewer();
  const viewerId = viewer?.id ?? "";
  const canDeleteAnyPost = viewer ? isInternalAdminUsername(viewer.username) : false;

  const [homePosts, discoveryPosts] = await Promise.all([
    getHomeFeed(viewerId),
    getDiscoveryFeed(viewerId)
  ]);

  const seenIds = new Set<string>();
  const allPosts = [...homePosts, ...discoveryPosts].filter((post) => {
    if (seenIds.has(post.id)) {
      return false;
    }
    seenIds.add(post.id);
    return true;
  });

  const techPosts = allPosts.filter((post) => {
    const authorLower = post.author.username.toLowerCase();
    if (authorLower === "kairosterling" || authorLower === "elenarostova") {
      return true;
    }
    if (post.tags.some((t) => TECH_KEYWORDS_REGEX.test(t))) {
      return true;
    }
    if (TECH_KEYWORDS_REGEX.test(post.body)) {
      return true;
    }
    return false;
  });

  const displayPosts = techPosts.length > 0 ? techPosts : allPosts.slice(0, 10);

  return (
    <AppShell
      aside={
        <div className="space-y-4">
          <div className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[28px] border border-sky-400/25 bg-black p-5 shadow-[0_20px_50px_rgba(0,0,0,0.75)]">
            <BackgroundVideo
              src="/cinematic/pulse-loop.mp4"
              poster="/cinematic/shot-2.jpg"
              overlayStyle="card"
            />
            <div className="relative z-10 flex items-center justify-between">
              <span className="rounded-full border border-sky-400/35 bg-black/65 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-sky-200 backdrop-blur-md">
                24/7 TECH DESK
              </span>
              <span className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8]" />
            </div>
            <div className="relative z-10 mt-auto pt-10">
              <p className="font-display text-2xl font-black uppercase leading-none tracking-tight text-white">
                AI &amp; SILICON WIRE
              </p>
              <p className="mt-1.5 text-xs text-white/80">
                Real-time breakdowns of new models, open-source drops, chips, and autonomous agents.
              </p>
            </div>
          </div>

          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
              Tech &amp; AI Analysts
            </p>
            <div className="mt-4 space-y-3">
              {ARENA_FIGHTERS.slice(0, 4).map((voice) => (
                <Link
                  key={voice.slug}
                  href={`/profile/${voice.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-2.5 transition hover:border-sky-400/35 hover:bg-white/[0.05]"
                >
                  <img
                    src={voice.avatarUrl}
                    alt={voice.name}
                    className="h-11 w-11 rounded-2xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-white">{voice.name}</p>
                      <span className="rounded-full border border-white/15 bg-black/50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-sky-200">
                        {voice.tag}
                      </span>
                    </div>
                    <p className="truncate text-xs text-white/55">{voice.role}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[28px] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-300">
              Tech Radar Tags
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {TECH_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=%23${tag}`}
                  className="rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-200 transition hover:border-sky-400/60 hover:bg-sky-400 hover:text-black"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </section>
        </div>
      }
      headerMode="brand-only"
      showInstallPrompt={false}
      subtitle="Breaking AI releases, open-source models, silicon, robotics, and sharp technical debates."
      title="Tech & AI Radar"
    >
      <TechRadarDeck />

      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_#38bdf8]" />
            <h2 className="font-display text-xl font-black uppercase tracking-tight text-white">
              Live Tech &amp; AI Stream ({displayPosts.length})
            </h2>
          </div>
          <Link
            href="/home"
            className="text-xs font-bold uppercase tracking-[0.18em] text-white/65 hover:text-white"
          >
            All Channels →
          </Link>
        </div>

        {displayPosts.map((post) => (
          <PostCard
            allowDelete={canDeleteAnyPost || (Boolean(viewerId) && post.author.id === viewerId)}
            allowEngagementOverride={canDeleteAnyPost}
            key={post.id}
            post={post}
            viewerId={viewerId}
          />
        ))}
      </div>
    </AppShell>
  );
}
