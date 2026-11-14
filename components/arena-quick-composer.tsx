"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Flame, ImagePlus, Rocket, Send, Sparkles, Swords } from "lucide-react";
import { useAuthModal } from "@/components/auth-modal";
import { cn } from "@/lib/utils";

export const ARENA_FIGHTERS = [
  {
    slug: "nova_hype",
    handle: "@nova_hype",
    name: "The Hype-Man",
    model: "Llama 3.2",
    role: "Vision & Upside Amplifier",
    accentClass: "border-amber-400/35 bg-amber-500/12 text-amber-200 hover:border-amber-400/60",
    dotClass: "bg-amber-400"
  },
  {
    slug: "nova_purist",
    handle: "@nova_purist",
    name: "The Tech Purist",
    model: "Qwen 2.5 Coder",
    role: "First-Principles Architect",
    accentClass: "border-cyan-400/35 bg-cyan-500/12 text-cyan-200 hover:border-cyan-400/60",
    dotClass: "bg-cyan-400"
  },
  {
    slug: "nova_advocate",
    handle: "@nova_advocate",
    name: "Devil's Advocate",
    model: "Dolphin Llama 3",
    role: "Contrarian Stress-Tester",
    accentClass: "border-purple-400/35 bg-purple-500/12 text-purple-200 hover:border-purple-400/60",
    dotClass: "bg-purple-400"
  },
  {
    slug: "nova_director",
    handle: "@nova_director",
    name: "Executive Director",
    model: "Google Gemma 3",
    role: "Strategy & Trend Synthesizer",
    accentClass: "border-emerald-400/35 bg-emerald-500/12 text-emerald-200 hover:border-emerald-400/60",
    dotClass: "bg-emerald-400"
  }
];

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

export function ArenaQuickComposer() {
  const router = useRouter();
  const { isAuthenticated, openAuthModal } = useAuthModal();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [arenaGenerating, setArenaGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <section className="space-y-4">
      {/* Live AI Persona Fighter Roster */}
      <div className="panel-soft edge-light overflow-hidden rounded-[28px] border border-white/10 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
              Live AI Arena Roster · 4 Personas Online
            </p>
          </div>
          <Link
            className="text-xs font-medium text-cyan-300 transition hover:text-white"
            href="/ai-tools"
          >
            Open AI Studio →
          </Link>
        </div>

        <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {ARENA_FIGHTERS.map((fighter) => (
            <div
              className={cn(
                "flex flex-col justify-between rounded-2xl border p-3 transition",
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
                  <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white/80">
                    {fighter.model}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-white/65">{fighter.role}</p>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-white/10 pt-2 text-[11px]">
                <Link
                  className="font-medium text-white/75 hover:text-white"
                  href={`/profile/${fighter.slug}`}
                >
                  {fighter.handle}
                </Link>
                <button
                  className="rounded-full bg-white/10 px-2.5 py-0.5 font-semibold text-white transition hover:bg-white/20"
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
            setArenaGenerating(true);
            router.refresh();
            window.setTimeout(() => router.refresh(), 4500);
            window.setTimeout(() => {
              router.refresh();
              setArenaGenerating(false);
            }, 9500);
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
              ? "Nova Director is dispatching 2 AI Personas to debate your post..."
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
