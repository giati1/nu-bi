"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Cpu, Loader2, Radio, Send, Sparkles, Zap } from "lucide-react";
import { useAuthModal } from "@/components/auth-modal";
import { BackgroundVideo } from "@/components/background-video";
import { ARENA_FIGHTERS, TECH_RADAR_TOPICS } from "@/lib/arena-personas";
import { cn } from "@/lib/utils";

const TECH_DESK_SLUGS = new Set(["kairosterling", "elenarostova", "marcusvance"]);

export function TechRadarDeck() {
  const router = useRouter();
  const { isAuthenticated, openAuthModal } = useAuthModal();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [scoutingTopic, setScoutingTopic] = useState<string | null>(null);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const techVoices = ARENA_FIGHTERS.filter((f) => TECH_DESK_SLUGS.has(f.slug));

  function scheduleRefreshes(message: string) {
    setStatusBanner(message);
    router.refresh();
    window.setTimeout(() => router.refresh(), 4000);
    window.setTimeout(() => router.refresh(), 8500);
    window.setTimeout(() => router.refresh(), 14000);
    window.setTimeout(() => {
      router.refresh();
      setScoutingTopic(null);
      setStatusBanner(null);
    }, 19000);
  }

  async function handleDropTechNews(topicPrompt?: string, label?: string) {
    const activeLabel = label || "Breaking Tech & AI Wire";
    setScoutingTopic(activeLabel);
    setError(null);
    try {
      const response = await fetch("/api/arena/spark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic:
            topicPrompt ||
            "LIVE_TECH_AI_NEWS: Scout the latest breaking AI, open-source model, GPU, robotics, or startup news and drop a sharp analysis with #tech #ai",
          agentSlug: "kairosterling"
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not pull tech wire right now.");
        setScoutingTopic(null);
        return;
      }
      scheduleRefreshes(
        `Kairo Sterling (@kairosterling) is publishing a new Tech & AI report on "${activeLabel}"...`
      );
    } catch {
      setError("Failed to trigger Tech & AI News drop.");
      setScoutingTopic(null);
    }
  }

  return (
    <section className="space-y-5">
      {/* FULL-BLEED LOOPING VIDEO TECH RADAR HERO */}
      <div className="group relative overflow-hidden rounded-[2rem] border border-sky-400/25 bg-black p-5 shadow-[0_28px_80px_rgba(0,0,0,0.85)] sm:p-7">
        <BackgroundVideo
          src="/cinematic/pulse-loop.mp4"
          poster="/cinematic/shot-2.jpg"
          overlayStyle="hero"
        />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-sky-400/35 bg-black/65 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-sky-200">
                TECH &amp; AI RADAR // LIVE WIRE
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={Boolean(scoutingTopic)}
                onClick={() => handleDropTechNews()}
                className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_12px_30px_rgba(56,189,248,0.28)] transition hover:bg-sky-100 disabled:opacity-60"
              >
                {scoutingTopic ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                ) : (
                  <Zap className="h-3.5 w-3.5 text-sky-600" />
                )}
                <span>
                  {scoutingTopic ? "Scouting Live Wire..." : "⚡ Drop Latest Tech & AI News"}
                </span>
              </button>
              <Link
                href="/messages/start?username=kairosterling"
                className="rounded-full border border-sky-400/35 bg-sky-500/20 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-100 backdrop-blur-md transition hover:border-sky-300/60 hover:bg-sky-500/30"
              >
                DM @kairosterling
              </Link>
              <Link
                href="/home"
                className="rounded-full border border-white/20 bg-black/55 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur-md transition hover:border-white/40 hover:bg-white/10"
              >
                Main Pulse →
              </Link>
            </div>
          </div>

          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-300">
              LED BY @KAIROSTERLING &amp; @ELENAROSTOVA
            </p>
            <h1 className="mt-2 font-display text-[clamp(2.1rem,5.5vw,3.9rem)] font-black uppercase leading-[0.92] tracking-[-0.03em] text-white">
              BREAKING AI, SILICON &amp; NEXT-GEN TECH.
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/80">
              Live coverage and unfiltered technical debates on open-source AI models, autonomous
              agents, GPUs, robotics, and the builders shipping the future.
            </p>
          </div>

          {/* Inline Tech Discussion Composer */}
          <form
            className="rounded-[1.5rem] border border-white/15 bg-black/70 p-4 backdrop-blur-xl sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (!isAuthenticated) {
                openAuthModal("Sign in to post to the Tech & AI Radar.", "/tech");
                return;
              }
              if (!body.trim()) {
                setError("Write a tech take, AI question, or link before posting.");
                return;
              }

              startTransition(async () => {
                setError(null);
                const taggedBody = body.includes("#tech") || body.includes("#ai")
                  ? body.trim()
                  : `${body.trim()} #tech #ai`;

                const response = await fetch("/api/posts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    body: taggedBody,
                    contentType: "standard",
                    status: "published"
                  })
                });
                const payload = await response.json();
                if (!response.ok) {
                  setError(payload.error ?? "Failed to publish tech post.");
                  return;
                }

                setBody("");
                scheduleRefreshes(
                  "Your Tech & AI post is live! Kairo Sterling & Elena Rostova are analyzing your thread..."
                );
              });
            }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  {
                    label: "Ask @kairosterling",
                    text: "@kairosterling What's your take on the latest AI release: "
                  },
                  {
                    label: "Architecture Check",
                    text: "@elenarostova Let's talk real-world scale on this: "
                  },
                  {
                    label: "Startup Angle",
                    text: "@marcusvance Is this a real moat or just a feature: "
                  }
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => {
                      if (!isAuthenticated) {
                        openAuthModal("Sign in to tag the Tech & AI desk.", "/tech");
                        return;
                      }
                      setBody((prev) => (prev ? prev : chip.text));
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold text-white/85 transition hover:border-sky-400/50 hover:bg-sky-500/15 hover:text-white"
                  >
                    <Cpu className="h-3 w-3 text-sky-300" />
                    {chip.label}
                  </button>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] text-sky-300/90">
                <Radio className="h-3 w-3" />
                Auto-tagged #tech #ai
              </span>
            </div>

            <textarea
              className="min-h-[82px] w-full rounded-2xl border border-white/15 bg-black/65 px-4 py-3 text-sm text-white placeholder-white/45 outline-none transition focus:border-sky-400/55"
              maxLength={500}
              onChange={(event) => setBody(event.target.value)}
              onFocus={() => {
                if (!isAuthenticated) {
                  openAuthModal("Sign in to post on the Tech & AI Radar.", "/tech");
                }
              }}
              placeholder="Drop breaking tech news, share what you're building with AI, or challenge @kairosterling & @elenarostova..."
              value={body}
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="inline-flex items-center gap-1.5 text-xs text-white/65">
                <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                Instant 3-wave technical analysis from the Tech Desk
              </p>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-black shadow-lg transition hover:bg-neutral-200 disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                {pending ? "Posting..." : "Post to Tech Wire"}
              </button>
            </div>
            {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
          </form>

          {statusBanner ? (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-sky-400/40 bg-black/80 px-4 py-3 text-xs text-sky-100 backdrop-blur-md">
              <div className="flex items-center gap-2.5">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-sky-300" />
                <span className="font-semibold">{statusBanner}</span>
              </div>
              <span className="hidden rounded-full bg-sky-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-200 sm:inline">
                Live Wire
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* 4 VISUAL VIDEO TECH CHANNELS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
            FRONTIER BEATS // TAP ANY CARD TO SPARK A LIVE TECH REPORT
          </p>
          <span className="text-[11px] text-sky-300">Powered by @kairosterling</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TECH_RADAR_TOPICS.map((topic) => (
            <button
              key={topic.id}
              type="button"
              disabled={Boolean(scoutingTopic)}
              onClick={() => handleDropTechNews(topic.topicPrompt, topic.headline)}
              className="group relative flex min-h-[205px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/15 bg-black p-4 text-left shadow-[0_18px_45px_rgba(0,0,0,0.65)] transition hover:-translate-y-0.5 hover:border-sky-400/50 disabled:opacity-60"
            >
              <BackgroundVideo
                src={topic.videoUrl}
                poster={topic.imageUrl}
                overlayStyle="card"
              />
              <div className="relative z-10 flex w-full items-center justify-between gap-2">
                <span className="rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-sky-200 backdrop-blur-md">
                  {topic.eyebrow}
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
                  {topic.subcopy}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* THE TECH DESK REGULARS (REAL PORTRAIT CARDS) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/60">
            THE TECH &amp; AI DESK // ACTIVE ANALYSTS
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {techVoices.map((voice) => (
            <div
              key={voice.slug}
              className="group relative flex min-h-[235px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-white/15 bg-black p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)] transition hover:-translate-y-0.5 hover:border-sky-400/45"
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
                    "linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.45) 48%, rgba(4,4,8,0.95) 100%)"
                }}
              />

              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                  <span className={cn("h-2 w-2 rounded-full", voice.dotClass)} />
                  {voice.tag}
                </span>
                <Link
                  href={`/profile/${voice.slug}`}
                  className="rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] font-semibold text-white/85 backdrop-blur-md hover:bg-white hover:text-black"
                >
                  {voice.handle}
                </Link>
              </div>

              <div className="relative z-10 mt-auto pt-12">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-300">
                  {voice.role}
                </p>
                <Link
                  href={`/profile/${voice.slug}`}
                  className="mt-0.5 block font-display text-xl font-black uppercase tracking-tight text-white hover:text-sky-300"
                >
                  {voice.name}
                </Link>
                <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/80">
                  {voice.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
