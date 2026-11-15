"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Flame,
  ImagePlus,
  Loader2,
  MessageSquarePlus,
  Radio,
  Rocket,
  Send,
  Sparkles,
  Zap
} from "lucide-react";
import { useAuthModal } from "@/components/auth-modal";
import { ARENA_FIGHTERS } from "@/lib/arena-personas";
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

const PULSE_WAVES = [
  "What Everyone Is Getting Wrong About Tech Right Now",
  "Solo Creators vs Traditional Media Studios",
  "The Next 5 Years of Digital Culture",
  "Underrated Projects Worth Paying Attention To"
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

  async function handleStartWave(topic?: string) {
    const label = topic || "Live Cultural Wave";
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
    <section className="space-y-4">
      {/* Live Pulse Insiders & Conversation Waves */}
      <div className="panel-soft edge-light relative overflow-hidden rounded-[30px] border border-white/12 p-4 md:p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-purple-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-cyan-500/12 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white">
              Featured Voices · Active Now
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/45 bg-[linear-gradient(135deg,rgba(6,182,212,0.22),rgba(139,92,246,0.22))] px-3.5 py-1.5 text-xs font-semibold text-cyan-200 shadow-[0_0_24px_rgba(6,182,212,0.2)] transition hover:border-cyan-300 hover:text-white disabled:opacity-60"
              disabled={Boolean(sparkingTopic)}
              onClick={() => handleStartWave()}
              type="button"
            >
              {sparkingTopic ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
              ) : (
                <Zap className="h-3.5 w-3.5 text-cyan-300" />
              )}
              <span>{sparkingTopic ? "Going Live..." : "⚡ Drop Fresh Topic"}</span>
            </button>
            <Link
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/25 hover:text-white"
              href="/explore"
            >
              Explore All →
            </Link>
          </div>
        </div>

        {/* 1-Click Live Conversation Starters */}
        <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <Radio className="h-3 w-3 text-purple-300" />
            Live Waves:
          </span>
          {PULSE_WAVES.map((topic) => (
            <button
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/70 transition hover:border-cyan-400/40 hover:bg-cyan-500/12 hover:text-white disabled:opacity-50"
              disabled={Boolean(sparkingTopic)}
              key={topic}
              onClick={() => handleStartWave(topic)}
              type="button"
            >
              {topic}
            </button>
          ))}
        </div>

        <div className="relative mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {ARENA_FIGHTERS.map((voice) => (
            <div
              className={cn(
                "flex flex-col justify-between rounded-2xl border p-3.5 transition duration-200 hover:-translate-y-0.5",
                voice.accentClass
              )}
              key={voice.slug}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                    <span className={cn("h-2 w-2 rounded-full", voice.dotClass)} />
                    {voice.name}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white/85">
                    {voice.tag}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-white/80">{voice.role}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-white/50">
                  {voice.stance}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-[11px]">
                <Link
                  className="font-medium text-white/80 hover:text-white"
                  href={`/profile/${voice.slug}`}
                >
                  {voice.handle}
                </Link>
                <button
                  className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-semibold text-white transition hover:bg-white/25"
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
                  type="button"
                >
                  + Tag
                </button>
              </div>
            </div>
          ))}
        </div>

        {statusBanner ? (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/40 bg-cyan-500/12 px-4 py-3 text-xs text-cyan-100">
            <div className="flex items-center gap-2.5">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-cyan-300" />
              <span className="font-medium">{statusBanner}</span>
            </div>
            <span className="hidden rounded-full bg-cyan-400/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200 sm:inline">
              Live Pulse
            </span>
          </div>
        ) : null}
      </div>

      {/* Inline Quick Post Composer */}
      <form
        className="glass-panel edge-light rounded-[28px] border border-white/10 p-4 md:p-5"
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
            scheduleFeedRefreshes("Your post is live! Active voices are jumping into your thread...");
          });
        }}
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {QUICK_STARTERS.map(({ label, icon: Icon, template }) => (
              <button
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/75 transition hover:border-purple-400/40 hover:bg-purple-500/15 hover:text-white"
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
                <Icon className="h-3 w-3 text-accent-soft" />
                {label}
              </button>
            ))}
          </div>
          <Link
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/75 transition hover:border-cyan-400/40 hover:text-white"
            href={isAuthenticated ? "/creator" : "/login?next=%2Fcreator"}
          >
            <ImagePlus className="h-3.5 w-3.5 text-cyan-300" />
            Photos / Video / Poll
          </Link>
        </div>

        <textarea
          className="min-h-[88px] w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-purple-400/50 md:text-[15px]"
          maxLength={500}
          onChange={(event) => setBody(event.target.value)}
          onFocus={() => {
            if (!isAuthenticated) {
              openAuthModal("Sign in to share your thoughts and connect with the community.", "/home");
            }
          }}
          placeholder="What's moving right now? Share a take, drop what you're working on, or ask the room..."
          value={body}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-white/55">
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            {pulseActive
              ? "Pushing your post to the live feed..."
              : "Posts go live immediately to the Pulse feed."}
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-accent/45 bg-[linear-gradient(135deg,#f43f5e,#8b5cf6)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(244,63,94,0.3)] transition hover:brightness-110 disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            <Send className="h-4 w-4" />
            {pending ? "Posting..." : "Post Now"}
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      </form>
    </section>
  );
}
