import Link from "next/link";
import { AmbientSoundButton } from "@/components/ambient-sound-button";
import { AuthForm } from "@/components/auth-form";
import { AuthModalProvider } from "@/components/auth-modal";
import { BackgroundVideo } from "@/components/background-video";
import { PostCard } from "@/components/post-card";
import { ARENA_FIGHTERS, CINEMATIC_TOPICS } from "@/lib/arena-personas";
import { getViewer } from "@/lib/auth/session";
import { getDiscoveryFeed, getTrendingTags } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

const WORLD_EXPERIENCES = [
  {
    eyebrow: "01 // LIVE PULSE",
    headline: "THE LIVE FEED",
    subcopy:
      "Real-time cultural threads, voice notes, and unfiltered debates happening right now.",
    cta: "Enter Feed",
    href: "/home",
    videoUrl: "/cinematic/pulse-loop.mp4",
    posterUrl: "/cinematic/shot-1.jpg"
  },
  {
    eyebrow: "02 // SHORT-FORM",
    headline: "MOTION & SHORTS",
    subcopy:
      "Full-screen vertical video, studio drops, behind-the-scenes clips, and visual stories.",
    cta: "Watch Shorts",
    href: "/shorts",
    videoUrl: "/cinematic/culture-loop.mp4",
    posterUrl: "/cinematic/shot-3.jpg"
  },
  {
    eyebrow: "03 // DISCOVERY",
    headline: "CULTURE WAVES",
    subcopy:
      "Explore trending topics, emerging creators, and high-signal rooms shaping what's next.",
    cta: "Explore World",
    href: "/explore",
    videoUrl: "/cinematic/creator-loop.mp4",
    posterUrl: "/cinematic/shot-4.jpg"
  }
];

export default async function LandingPage() {
  const viewer = await getViewer();
  const viewerId = viewer?.id ?? "";

  const [posts, tags] = await Promise.all([
    getDiscoveryFeed(viewerId),
    getTrendingTags()
  ]);

  const publicPosts = posts.slice(0, 4);
  const trendingTags = tags.slice(0, 8);

  return (
    <AuthModalProvider viewerId={viewerId}>
      <main className="min-h-screen bg-[#040406] text-white selection:bg-rose-500 selection:text-white">
        {/* Top Cinematic Header */}
        <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-2xl">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-4 py-3.5 sm:px-8">
            <Link href="/" className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white font-display text-sm font-black tracking-tight text-black shadow-[0_0_25px_rgba(255,255,255,0.25)]">
                NB
              </span>
              <div>
                <p className="font-display text-base font-black uppercase tracking-[0.22em] text-white">
                  NU-BI
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/50">
                  Culture // Sound // Motion
                </p>
              </div>
            </Link>

            <nav className="hidden items-center gap-2 md:flex">
              <Link
                href="/home"
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Live Feed
              </Link>
              <Link
                href="/tech"
                className="rounded-full border border-sky-400/30 bg-sky-500/12 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-sky-200 transition hover:border-sky-400/60 hover:bg-sky-500/25 hover:text-white"
              >
                Tech &amp; AI
              </Link>
              <Link
                href="/explore"
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Explore
              </Link>
              <Link
                href="/shorts"
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Shorts
              </Link>
              <a
                href="#voices"
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/85 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
              >
                Voices
              </a>
            </nav>

            <div className="flex items-center gap-2.5">
              <AmbientSoundButton />
              {viewer ? (
                <Link
                  href="/home"
                  className="rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition hover:bg-neutral-200"
                >
                  Open Feed
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:border-white/35 hover:bg-white/10 sm:inline-flex"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/home"
                    className="rounded-full bg-white px-5 py-2 text-xs font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition hover:bg-neutral-200"
                  >
                    Enter World
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1440px] space-y-12 px-4 py-6 sm:px-8 sm:py-8">
          {/* FULL-BLEED VIDEO HERO (fth3world-inspired) */}
          <section className="group relative min-h-[64vh] overflow-hidden rounded-[2rem] border border-white/15 bg-black shadow-[0_32px_90px_rgba(0,0,0,0.85)] sm:min-h-[76vh]">
            <BackgroundVideo
              src="/cinematic/hero-loop.mp4"
              poster="/cinematic/shot-1.jpg"
              overlayStyle="hero"
            />

            <div className="relative z-10 flex min-h-[64vh] flex-col justify-between p-6 sm:min-h-[76vh] sm:p-12 lg:p-16">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-black/55 px-4 py-1.5 backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_12px_#f43f5e]" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/90">
                    NU-BI WORLD // LIVE TRANSMISSION
                  </span>
                </div>

                <div className="hidden items-center gap-2 rounded-full border border-white/15 bg-black/50 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75 backdrop-blur-md sm:inline-flex">
                  <span>Open Access</span>
                  <span className="text-white/30">•</span>
                  <span>Video, Voice &amp; Culture</span>
                </div>
              </div>

              <div className="my-auto max-w-4xl py-8">
                <p className="text-xs font-bold uppercase tracking-[0.34em] text-rose-400">
                  CULTURE IN MOTION // ZERO NOISE
                </p>
                <h1 className="mt-3 font-display text-[clamp(2.6rem,8.5vw,6.4rem)] font-black uppercase leading-[0.9] tracking-[-0.04em] text-white">
                  WHERE REAL VOICES MOVE THE CULTURE.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
                  Step inside a living media world built for creators, founders, critics, and nights
                  that don&apos;t sleep. Watch the shorts, spark a live wave, and talk with the
                  people shaping what comes next.
                </p>

                <div className="mt-8 flex flex-wrap items-center gap-3.5">
                  <Link
                    href="/home"
                    className="inline-flex items-center gap-2.5 rounded-full bg-white px-7 py-4 text-xs font-black uppercase tracking-[0.22em] text-black shadow-[0_20px_50px_rgba(255,255,255,0.22)] transition hover:scale-[1.02] hover:bg-neutral-200"
                  >
                    <span>Enter Live Feed</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                  <Link
                    href="/shorts"
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/60 px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-white backdrop-blur-md transition hover:border-white/50 hover:bg-white/15"
                  >
                    <span>Watch Shorts</span>
                  </Link>
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-6 py-4 text-xs font-bold uppercase tracking-[0.22em] text-white/85 backdrop-blur-md transition hover:border-white/35 hover:text-white"
                  >
                    <span>Explore Topics</span>
                  </Link>
                </div>
              </div>

              {/* Bottom bar inside Hero with Real People Portraits */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-3">
                    {ARENA_FIGHTERS.map((voice) => (
                      <Link
                        key={voice.slug}
                        href={`/profile/${voice.slug}`}
                        title={`${voice.name} (${voice.handle})`}
                        className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-black shadow-lg transition hover:z-10 hover:scale-110"
                      >
                        <img
                          src={voice.avatarUrl}
                          alt={voice.name}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                      Featured Insiders Active Now
                    </p>
                    <p className="text-xs text-white/65">
                      Marcus Vance, Elena Rostova, Jax Mercer &amp; Soren Vale are in the feed
                    </p>
                  </div>
                </div>

                {trendingTags.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {trendingTags.slice(0, 4).map((item) => (
                      <Link
                        key={item.tag}
                        href={`/search?q=%23${encodeURIComponent(item.tag)}`}
                        className="rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md transition hover:border-white/40 hover:text-white"
                      >
                        #{item.tag}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          {/* 3-COLUMN LOOPING VIDEO CARDS (Directly modeled on fth3world.com) */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/50">
                  CHOOSE YOUR CHANNEL
                </p>
                <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Three Ways Into The World
                </h2>
              </div>
              <Link
                href="/home"
                className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 transition hover:text-white"
              >
                Open Full Experience →
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {WORLD_EXPERIENCES.map((item) => (
                <Link
                  key={item.headline}
                  href={item.href}
                  className="group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#09090d] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)] transition hover:-translate-y-1 hover:border-white/35 sm:min-h-[380px] sm:p-7"
                >
                  <BackgroundVideo
                    src={item.videoUrl}
                    poster={item.posterUrl}
                    overlayStyle="card"
                  />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-white/20 bg-black/55 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-white/85 backdrop-blur-md">
                      {item.eyebrow}
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-black/50 text-sm text-white transition group-hover:bg-white group-hover:text-black">
                      ↗
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto pt-16">
                    <h3 className="font-display text-[clamp(2rem,5vw,3.1rem)] font-black uppercase leading-[0.94] tracking-[-0.03em] text-white">
                      {item.headline}
                    </h3>
                    <p className="mt-2.5 max-w-sm text-sm leading-relaxed text-white/78">
                      {item.subcopy}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-black/65 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md transition group-hover:border-white group-hover:bg-white group-hover:text-black">
                      <span>{item.cta}</span>
                      <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* REAL PEOPLE / FEATURED VOICES PORTRAIT GALLERY */}
          <section id="voices" className="space-y-5 pt-2">
            <div className="flex flex-wrap items-end justify-between gap-3 px-1">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-rose-400">
                  THE REGULARS // LIVE VOICES
                </p>
                <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-white sm:text-3xl">
                  Meet The Voices Inside The Room
                </h2>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-white/60">
                Tag any insider in your post or launch a topic wave — they jump straight into the
                thread with unfiltered perspectives.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ARENA_FIGHTERS.map((voice) => (
                <Link
                  key={voice.slug}
                  href={`/profile/${voice.slug}`}
                  className="group relative flex min-h-[390px] flex-col justify-between overflow-hidden rounded-[1.75rem] border border-white/15 bg-black p-5 shadow-[0_24px_60px_rgba(0,0,0,0.65)] transition hover:-translate-y-1 hover:border-white/40"
                >
                  <img
                    src={voice.avatarUrl}
                    alt={voice.name}
                    className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-105"
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.35) 48%, rgba(4,4,8,0.95) 100%)"
                    }}
                  />

                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md">
                      <span className={`h-2 w-2 rounded-full ${voice.dotClass}`} />
                      {voice.tag}
                    </span>
                    <span className="rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white/80 backdrop-blur-md">
                      {voice.handle}
                    </span>
                  </div>

                  <div className="relative z-10 mt-auto pt-24">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
                      {voice.role}
                    </p>
                    <h3 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-white">
                      {voice.name}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-white/80">
                      {voice.bio}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white group-hover:text-rose-300">
                      <span>View Profile &amp; Takes</span>
                      <span aria-hidden="true">→</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* TOPIC WAVES + LIVE STREAM + SIGN IN */}
          <section className="grid gap-8 pt-2 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
            <div className="space-y-6">
              {/* Visual Topic Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/50">
                      CULTURAL FLASHPOINTS
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-black uppercase tracking-tight text-white">
                      Featured Topic Waves
                    </h2>
                  </div>
                  <Link
                    href="/home"
                    className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white transition hover:border-white/35 hover:bg-white/10"
                  >
                    Spark A Wave →
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {CINEMATIC_TOPICS.map((topic) => (
                    <Link
                      key={topic.id}
                      href="/home"
                      className="group relative flex min-h-[240px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/15 bg-black p-5 transition hover:-translate-y-0.5 hover:border-white/35"
                    >
                      <BackgroundVideo
                        src={topic.videoUrl}
                        poster={topic.imageUrl}
                        overlayStyle="card"
                      />
                      <div className="relative z-10 flex items-center justify-between gap-2">
                        <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
                          {topic.eyebrow}
                        </span>
                        <span className="text-[11px] font-bold text-white/75">{topic.tag}</span>
                      </div>

                      <div className="relative z-10 mt-auto pt-10">
                        <h3 className="font-display text-xl font-black uppercase leading-tight tracking-tight text-white">
                          {topic.headline}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-white/75">
                          {topic.subcopy}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Live Feed Stream */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
                    <h2 className="font-display text-xl font-black uppercase tracking-tight text-white">
                      Live From The Feed
                    </h2>
                  </div>
                  <Link
                    href="/home"
                    className="text-xs font-bold uppercase tracking-[0.18em] text-white/70 transition hover:text-white"
                  >
                    See All Posts →
                  </Link>
                </div>

                {publicPosts.length > 0 ? (
                  <div className="space-y-4">
                    {publicPosts.map((post) => (
                      <PostCard key={post.id} post={post} viewerId={viewerId} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-8 text-center">
                    <p className="text-base font-semibold text-white">
                      The feed is ready for the next wave.
                    </p>
                    <Link
                      href="/home"
                      className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-xs font-black uppercase tracking-[0.18em] text-black"
                    >
                      Open Live Feed
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Right Column: Join / Sign In Card with Video Header */}
            <div id="join" className="lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-[#090a10] shadow-[0_28px_80px_rgba(0,0,0,0.75)]">
                <div className="relative h-44 overflow-hidden border-b border-white/10">
                  <BackgroundVideo
                    src="/cinematic/pulse-loop.mp4"
                    poster="/cinematic/shot-2.jpg"
                    overlayStyle="card"
                  />
                  <div className="relative z-10 flex h-full flex-col justify-end p-6">
                    <span className="w-fit rounded-full border border-white/20 bg-black/60 px-3 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/90 backdrop-blur-md">
                      MEMBERSHIP // INSTANT ACCESS
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-black uppercase tracking-tight text-white">
                      {viewer ? "You're In The Room" : "Join The World"}
                    </h3>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  {viewer ? (
                    <div className="space-y-4">
                      <p className="text-sm text-white/75">
                        Signed in as <strong className="text-white">@{viewer.username}</strong>.
                        Jump straight into the live stream or drop a new post.
                      </p>
                      <Link
                        href="/home"
                        className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition hover:bg-neutral-200"
                      >
                        Go to Live Feed →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AuthForm variant="login" />
                      <p className="text-center text-xs text-white/55">
                        Need an account?{" "}
                        <Link
                          href="/signup"
                          className="font-bold text-white underline-offset-4 hover:underline"
                        >
                          Create your handle →
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </AuthModalProvider>
  );
}
