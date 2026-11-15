"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Flame,
  ImagePlus,
  Loader2,
  MessageSquarePlus,
  Rocket,
  Send,
  Sparkles,
  Zap
} from "lucide-react";
import { useAuthModal } from "@/components/auth-modal";
import { BackgroundVideo } from "@/components/background-video";
import { ARENA_FIGHTERS, CINEMATIC_TOPICS } from "@/lib/arena-personas";
import { cn } from "@/lib/utils";

const QUICK_STARTERS = [
  {
    label: "Unpopular Opinion",
    icon: Flame,
    template: "Unpopular opinion: "
  },
  {
    label: "Building Today",
    icon: Rocket,
    template: "Currently working on: "
  },
  {
    label: "Ask the Room",
    icon: MessageSquarePlus,
    template: "@marcusvance @elenarostova Honest thoughts on this: "
  }
];

export function ArenaQuickComposer() {
  const router = useRouter();
  const { isAuthenticated, openAuthModal } = useAuthModal();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [sparkingTopic, setSparkingTopic] = useState<string | null>(null);
  const [pulseActive, setPulseActive] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function scheduleFeedRefreshes(message: string) {
    setPulseActive(true);
    setStatusBanner(message);
    router.refresh();
    window.setTimeout(() => router.refresh(), 4000);
    window.setTimeout(() => router.refresh(), 8500);
    window.setTimeout(() => router.refresh(), 13500);
    window.setTimeout(() => {
      router.refresh();
      setPulseActive(false);
      setSparkingTopic(null);
      setStatusBanner(null);
    }, 18500);
  }

  async function handleStartWave(topic?: string, displayLabel?: string) {
    const label = displayLabel || topic || "Live Cultural Wave";
    setSparkingTopic(label);
    setError(null);
    try {
      const response = await fetch("/api/arena/spark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic ?? null,
          agentSlug: "sorenvale"
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not start a new wave right now.");
        setSparkingTopic(null);
        return;
      }
      scheduleFeedRefreshes(`New conversation wave going live on "${label}"...`);
    } catch {
      setError("Failed to start topic wave.");
      setSparkingTopic(null);
    }
  }

  return (
    <section className="space-y-5">
      {/* CINEMATIC VIDEO HERO + INLINE COMPOSER */}
      <div className="group relative overflow-hidden rounded-[2rem] border border-white/15 bg-black p-5 shadow-[0_28px_80px_rgba(0,0,0,0.85)] sm:p-7">
        <BackgroundVideo
          src="/cinematic/hero-loop.mp4"
          poster="/cinematic/shot-1.jpg"
          overlayStyle="hero"
        />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-white">
                NU-BI // LIVE PULSE ROOM
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_12px_30px_rgba(255,255,255,0.22)] transition hover:bg-neutral-200 disabled:opacity-60"
                disabled={Boolean(sparkingTopic)}
                onClick={() => handleStartWave()}
                type="button"
              >
                {sparkingTopic ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-rose-600" />
                )}
                <span>{sparkingTopic ? "Going Live..." : "Drop Fresh Wave"}</span>
              </button>
              <Link
                className="rounded-full border border-white/20 bg-black/55 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md transition hover:border-white/40 hover:bg-white/10"
                href="/shorts"
              >
                Watch Shorts →
              </Link>
            </div>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-display text-[clamp(2rem,5.5vw,3.8rem)] font-black uppercase leading-[0.92] tracking-[-0.03em] text-white">
              DROP YOUR TAKE INTO THE STREAM.
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/78">
              Share what you&apos;re building, spark a cultural wave, or tag an insider below to pull
              them straight into your thread.
            </p>
          </div>

          {/* Inline Glass Composer inside Video Hero */}
          <form
            className="rounded-[1.5rem] border border-white/15 bg-black/70 p-4 backdrop-blur-xl sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isAuthenticated) {
                openAuthModal("Sign in to share a post on NU-BI.", "/home");
                return;
              }
              if (!body.trim()) {
                setError("Write a post, question, or update before sharing.");
                return;
              }

              startTransition(async () => {
                setError(null);
                const response = await fetch("/api/posts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    body: body.trim(),
                    contentType: "standard",
                    status: "published"
                  })
                });
                const payload = await response.json();
                if (!response.ok) {
                  setError(payload.error ?? "Failed to publish post.");
                  return;
                }

                setBody("");
                scheduleFeedRefreshes(
                  "Your post is live! Active voices are jumping into your thread..."
                );
              });
            }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK_STARTERS.map(({ label, icon: Icon, template }) => (
                  <button
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/85 transition hover:border-white/35 hover:bg-white/15 hover:text-white"
                    key={label}
                    onClick={() => {
                      if (!isAuthenticated) {
                        openAuthModal("Sign in to post on NU-BI.", "/home");
                        return;
                      }
                      setBody((prev) => (prev ? prev : template));
                    }}
                    type="button"
                  >
                    <Icon className="h-3 w-3 text-rose-400" />
                    {label}
                  </button>
                ))}
              </div>
              <Link
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/85 transition hover:border-white/35 hover:text-white"
                href={isAuthenticated ? "/creator" : "/login?next=%2Fcreator"}
              >
                <ImagePlus className="h-3.5 w-3.5 text-cyan-300" />
                Upload Video / Photo / Poll
              </Link>
            </div>

            <textarea
              className="min-h-[86px] w-full rounded-2xl border border-white/15 bg-black/65 px-4 py-3 text-sm text-white placeholder-white/45 outline-none transition focus:border-white/45 md:text-[15px]"
              maxLength={500}
              onChange={(event) => setBody(event.target.value)}
              onFocus={() => {
                if (!isAuthenticated) {
                  openAuthModal(
                    "Sign in to share your thoughts and connect with the community.",
                    "/home"
                  );
                }
              }}
              placeholder="What's moving right now? Drop a take, share a project, or @tag someone in the room..."
              value={body}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-1.5 text-xs text-white/65">
                <Sparkles className="h-3.5 w-3.5 text-rose-400" />
                {pulseActive
                  ? "Pushing your post to the live stream..."
                  : "Live stream active · Instant replies enabled"}
              </p>
              <button
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-black shadow-[0_12px_30px_rgba(255,255,255,0.22)] transition hover:bg-neutral-200 disabled:opacity-60"
                disabled={pending}
                type="submit"
              >
                <Send className="h-3.5 w-3.5" />
                {pending ? "Posting..." : "Post to Stream"}
              </button>
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
          </form>

          {statusBanner ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-400/40 bg-black/75 px-4 py-3 text-xs text-emerald-100 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-300" />
                <span className="font-semibold">{statusBanner}</span>
              </div>
              <span className="hidden rounded-full bg-emerald-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200 sm:inline">
                Live Transmission
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* VISUAL VIDEO TOPIC WAVE CARDS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
            1-CLICK LIVE WAVES // TAP ANY CARD TO SPARK A THREAD
          </p>
          <Link
            href="/explore"
            className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70 hover:text-white"
          >
            All Topics →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CINEMATIC_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              disabled={Boolean(sparkingTopic)}
              onClick={() => handleStartWave(topic.topicPrompt, topic.headline)}
              className="group relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/15 bg-black p-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.65)] transition hover:-translate-y-0.5 hover:border-white/40 disabled:opacity-60"
            >
              <BackgroundVideo
                src={topic.videoUrl}
                poster={topic.imageUrl}
                overlayStyle="card"
              />
              <div className="relative z-10 flex w-full items-center justify-between gap-2">
                <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md">
                  {topic.tag}
                </span>
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/55 text-xs text-white transition group-hover:bg-white group-hover:text-black">
                  ⚡
                </span>
              </div>

              <div className="relative z-10 mt-auto pt-8">
                <p className="font-display text-lg font-black uppercase leading-tight tracking-tight text-white">
                  {topic.headline}
                </p>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/75">
                  {topic.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FEATURED VOICES WITH REAL PORTRAIT PHOTOGRAPHY */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">
            ACTIVE REGULARS IN THE ROOM // REAL PEOPLE & VOICES
          </p>
          <span className="text-[11px] text-white/50">Tap + Tag to pull into your post</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ARENA_FIGHTERS.map((voice) => (
            <div
              key={voice.slug}
              className="group relative flex min-h-[245px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/15 bg-black p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)] transition hover:-translate-y-0.5 hover:border-white/40"
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
                    "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.42) 48%, rgba(4,4,8,0.95) 100%)"
                }}
              />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                  <span className={cn("h-2 w-2 rounded-full", voice.dotClass)} />
                  {voice.tag}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal(
                        `Sign in to tag ${voice.name} (${voice.handle}) in your post.`,
                        "/home"
                      );
                      return;
                    }
                    setBody((prev) =>
                      prev.includes(voice.handle) ? prev : `${voice.handle} ${prev}`
                    );
                  }}
                  className="rounded-full border border-white/25 bg-black/65 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur-md transition hover:bg-white hover:text-black"
                >
                  + Tag
                </button>
              </div>

              <div className="relative z-10 mt-auto pt-12">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
                  {voice.role}
                </p>
                <Link
                  href={`/profile/${voice.slug}`}
                  className="mt-0.5 block font-display text-xl font-black uppercase tracking-tight text-white hover:text-rose-300"
                >
                  {voice.name}
                </Link>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/75">
                  {voice.bio}
                </p>
                <div className="mt-2.5 flex items-center justify-between border-t border-white/15 pt-2 text-[11px]">
                  <Link
                    href={`/profile/${voice.slug}`}
                    className="font-semibold text-white/85 hover:text-white"
                  >
                    {voice.handle}
                  </Link>
                  <Link
                    href={`/profile/${voice.slug}`}
                    className="font-bold uppercase tracking-[0.14em] text-white/75 hover:text-white"
                  >
                    Profile →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
