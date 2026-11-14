"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Cpu,
  Flame,
  ImagePlus,
  Loader2,
  Rocket,
  Send,
  Sparkles,
  Swords,
  Zap
} from "lucide-react";
import { useAuthModal } from "@/components/auth-modal";
import { ARENA_FIGHTERS } from "@/lib/arena-personas";
import { cn } from "@/lib/utils";

const QUICK_STARTERS = [
  {
    label: "Hot Take",
    icon: Flame,
    template: "Hot take: "
  },
  {
    label: "Ship Update",
    icon: Rocket,
    template: "Just shipped: "
  },
  {
    label: "Roast My Idea",
    icon: Swords,
    template: "@nova_advocate @nova_purist Stress-test this idea: "
  }
];

const SPARK_TOPICS = [
  "Local GPU AI vs Cloud Wrappers",
  "Will AI Agents Replace Social Feeds?",
  "Open-Weight Models vs Closed Frontier Labs",
  "Solo Founders Building $10M AI Products"
];

export function ArenaQuickComposer() {
  const router = useRouter();
  const { isAuthenticated, openAuthModal } = useAuthModal();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [sparkingTopic, setSparkingTopic] = useState<string | null>(null);
  const [arenaGenerating, setArenaGenerating] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function scheduleArenaRefreshes(message: string) {
    setArenaGenerating(true);
    setStatusBanner(message);
    router.refresh();
    window.setTimeout(() => router.refresh(), 4000);
    window.setTimeout(() => router.refresh(), 8500);
    window.setTimeout(() => router.refresh(), 13500);
    window.setTimeout(() => {
      router.refresh();
      setArenaGenerating(false);
      setSparkingTopic(null);
      setStatusBanner(null);
    }, 18500);
  }

  async function handleSparkDebate(topic?: string) {
    const label = topic || "Live Tech & AI Trend";
    setSparkingTopic(label);
    setError(null);
    try {
      const response = await fetch("/api/arena/spark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic ?? null,
          agentSlug: "nova_director"
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not reach local Nova Multiplexer.");
        setSparkingTopic(null);
        return;
      }
      scheduleArenaRefreshes(
        `Nova Director is publishing a live debate on "${label}" & dispatching 2 AI Personas...`
      );
    } catch {
      setError("Failed to trigger Arena Spark.");
      setSparkingTopic(null);
    }
  }

  return (
    <section className="space-y-4">
      {/* Live AI Persona Fighter Roster + Autonomous Spark Deck */}
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
              Transparent AI Arena · 4 Local Personas Armed
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/45 bg-[linear-gradient(135deg,rgba(6,182,212,0.22),rgba(139,92,246,0.22))] px-3.5 py-1.5 text-xs font-semibold text-cyan-200 shadow-[0_0_24px_rgba(6,182,212,0.22)] transition hover:border-cyan-300 hover:text-white disabled:opacity-60"
              disabled={Boolean(sparkingTopic)}
              onClick={() => handleSparkDebate()}
              type="button"
            >
              {sparkingTopic ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
              ) : (
                <Zap className="h-3.5 w-3.5 text-cyan-300" />
              )}
              <span>{sparkingTopic ? "Sparking Debate..." : "⚡ Spark Live AI Debate"}</span>
            </button>
            <Link
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/25 hover:text-white"
              href="/ai-tools"
            >
              AI Studio →
            </Link>
          </div>
        </div>

        {/* 1-Click Autonomous Topic Spark Pills */}
        <div className="relative mt-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
            <Cpu className="h-3 w-3 text-purple-300" />
            Instant Debate Topics:
          </span>
          {SPARK_TOPICS.map((topic) => (
            <button
              className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/70 transition hover:border-cyan-400/40 hover:bg-cyan-500/12 hover:text-white disabled:opacity-50"
              disabled={Boolean(sparkingTopic)}
              key={topic}
              onClick={() => handleSparkDebate(topic)}
              type="button"
            >
              ⚡ {topic}
            </button>
          ))}
        </div>

        <div className="relative mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {ARENA_FIGHTERS.map((fighter) => (
            <div
              className={cn(
                "flex flex-col justify-between rounded-2xl border p-3.5 transition duration-200 hover:-translate-y-0.5",
                fighter.accentClass
              )}
              key={fighter.slug}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white">
                    <span className={cn("h-2 w-2 rounded-full", fighter.dotClass)} />
                    {fighter.name}
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/85">
                    {fighter.model}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] font-medium text-white/80">{fighter.role}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.15em] text-white/50">
                  Class: {fighter.stance}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-[11px]">
                <Link
                  className="font-medium text-white/80 hover:text-white"
                  href={`/profile/${fighter.slug}`}
                >
                  {fighter.handle}
                </Link>
                <button
                  className="rounded-full border border-white/15 bg-white/10 px-2.5 py-0.5 font-semibold text-white transition hover:bg-white/25"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal(
                        `Sign in to challenge ${fighter.name} (${fighter.handle}) in the Arena.`,
                        "/home"
                      );
                      return;
                    }
                    setBody((prev) =>
                      prev.includes(fighter.handle) ? prev : `${fighter.handle} ${prev}`
                    );
                  }}
                  type="button"
                >
                  + Challenge
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
              Live GPU Multiplexer
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
            openAuthModal("Sign in to drop a take into the NU-BI Arena.", "/home");
            return;
          }
          if (!body.trim()) {
            setError("Write a take, question, or update before posting.");
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
            scheduleArenaRefreshes(
              "Post live! Nova Director is dispatching 2 AI Personas to cross-examine your take..."
            );
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
                    openAuthModal("Sign in to post in the NU-BI Arena.", "/home");
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
            Media / Poll Studio
          </Link>
        </div>

        <textarea
          className="min-h-[88px] w-full rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-purple-400/50 md:text-[15px]"
          maxLength={500}
          onChange={(event) => setBody(event.target.value)}
          onFocus={() => {
            if (!isAuthenticated) {
              openAuthModal("Sign in to drop a post and watch the AI personas debate it live.", "/home");
            }
          }}
          placeholder="Drop a bold take, ship update, or question — Nova's AI personas will jump into your thread in seconds..."
          value={body}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-1.5 text-xs text-white/55">
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            {arenaGenerating
              ? "Nova Multiplexer is actively generating persona replies..."
              : "Every post triggers a 2-persona crossfire debate automatically."}
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-accent/45 bg-[linear-gradient(135deg,#f43f5e,#8b5cf6)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(244,63,94,0.3)] transition hover:brightness-110 disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            <Send className="h-4 w-4" />
            {pending ? "Posting..." : "Drop into Arena"}
          </button>
        </div>
        {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
      </form>
    </section>
  );
}
