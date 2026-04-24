"use client";

import { Activity, MoonStar, Sparkles, Waves, Zap } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PostCard } from "@/components/post-card";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/types/domain";

type MoodKey = "all" | "bold" | "soft" | "late-night" | "locked-in";

type PresenceItem = {
  id: string;
  label: string;
  detail: string;
  state: "live" | "active" | "new";
};

const moods: Array<{
  key: MoodKey;
  label: string;
  detail: string;
  icon: typeof Sparkles;
}> = [
  { key: "all", label: "All posts", detail: "Everything happening right now.", icon: Activity },
  { key: "bold", label: "Bold", detail: "Stronger opinions, louder posts, and standout visuals.", icon: Zap },
  { key: "soft", label: "Soft", detail: "Calmer posts, portraits, and slower moments.", icon: Waves },
  { key: "late-night", label: "Late Night", detail: "Moody posts, voice notes, and after-hours energy.", icon: MoonStar },
  { key: "locked-in", label: "Focused", detail: "Work, progress, building, and creative momentum.", icon: Sparkles }
];

export function MoodFeedPanel({
  feed,
  viewerId,
  canDeleteAnyPost = false
}: {
  feed: FeedPost[];
  viewerId: string;
  presence: PresenceItem[];
  canDeleteAnyPost?: boolean;
}) {
  const [selectedMood, setSelectedMood] = useState<MoodKey>("all");
  const deferredMood = useDeferredValue(selectedMood);

  const filteredFeed = useMemo(() => {
    if (deferredMood === "all") {
      return feed;
    }

    return [...feed]
      .map((post) => ({
        post,
        score: scorePostForMood(post, deferredMood)
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score)
      .map((entry) => entry.post);
  }, [deferredMood, feed]);

  const activeMood = moods.find((mood) => mood.key === deferredMood) ?? moods[0];

  return (
    <section className="space-y-4">
      <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.02] px-4 py-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent-soft">Feed</p>
            <p className="mt-1 text-sm text-white/58">{activeMood.detail}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {moods.map(({ key, label }) => {
              const active = deferredMood === key;
              return (
                <button
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs font-medium transition",
                    active
                      ? "border-accent/45 bg-accent text-white"
                      : "border-white/[0.08] bg-white/[0.03] text-white/72 hover:bg-white/[0.06] hover:text-white"
                  )}
                  key={key}
                  onClick={() => setSelectedMood(key)}
                  type="button"
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredFeed.length === 0 ? (
        <EmptyState
          description={`Nothing matches ${activeMood.label.toLowerCase()} yet. Try another mood or publish something that shifts the tone.`}
          title="No posts match this view yet"
        />
      ) : (
        filteredFeed.map((post) => (
          <PostCard
            allowDelete={canDeleteAnyPost || post.author.id === viewerId}
            allowEngagementOverride={canDeleteAnyPost}
            key={post.id}
            post={post}
            viewerId={viewerId}
          />
        ))
      )}
    </section>
  );
}

function scorePostForMood(post: FeedPost, mood: Exclude<MoodKey, "all">) {
  const haystack = `${post.body} ${post.tags.join(" ")} ${post.linkPreview?.title ?? ""} ${post.linkPreview?.description ?? ""}`.toLowerCase();
  const hasVideo = post.media.some((item) => item.mimeType?.startsWith("video/"));
  const scores: Record<Exclude<MoodKey, "all">, number> = {
    bold: 0,
    soft: 0,
    "late-night": 0,
    "locked-in": 0
  };

  const addIfMatch = (target: Exclude<MoodKey, "all">, expressions: RegExp[], weight = 1) => {
    expressions.forEach((expression) => {
      if (expression.test(haystack)) {
        scores[target] += weight;
      }
    });
  };

  addIfMatch("bold", [/drop/i, /launch/i, /fire/i, /bold/i, /trend/i, /fit/i], 2);
  addIfMatch("soft", [/soft/i, /calm/i, /morning/i, /love/i, /portrait/i, /cozy/i], 2);
  addIfMatch("late-night", [/night/i, /late/i, /midnight/i, /after dark/i, /voice/i, /mood/i], 2);
  addIfMatch("locked-in", [/build/i, /focus/i, /ship/i, /work/i, /studio/i, /create/i], 2);

  if (hasVideo) {
    scores.bold += 1;
    scores["late-night"] += 1;
  }

  if (post.tags.some((tag) => ["fashion", "viral", "drop"].includes(tag.toLowerCase()))) {
    scores.bold += 2;
  }
  if (post.tags.some((tag) => ["soft", "portrait", "selfcare"].includes(tag.toLowerCase()))) {
    scores.soft += 2;
  }
  if (post.tags.some((tag) => ["night", "latenight", "voice"].includes(tag.toLowerCase()))) {
    scores["late-night"] += 2;
  }
  if (post.tags.some((tag) => ["build", "creator", "studio", "focus"].includes(tag.toLowerCase()))) {
    scores["locked-in"] += 2;
  }

  return scores[mood];
}
