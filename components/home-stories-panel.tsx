"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useState } from "react";
import { QuickUploadSheet } from "@/components/quick-upload-sheet";
import { StoryHighlightRow } from "@/components/story-highlight-row";

type StoryItem = {
  id: string;
  label: string;
  href?: string;
  imageUrl?: string | null;
  action?: boolean;
  status?: "new" | "seen" | "your-story";
  meta?: string;
  body?: string;
  ctaLabel?: string;
};

type HighlightItem = {
  id: string;
  label: string;
  href: string;
  imageUrl?: string | null;
  eyebrow: string;
  detail: string;
};

export function HomeStoriesPanel({
  stories,
  highlights
}: {
  stories: StoryItem[];
  highlights: HighlightItem[];
}) {
  const [storyUploadOpen, setStoryUploadOpen] = useState(false);

  return (
    <>
      <section className="glass-panel rounded-[26px] border border-accent/30 p-3.5 md:rounded-[28px] md:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.24em] text-accent-soft">Stories</p>
            <p className="mt-1 text-xs text-white/72 md:text-sm md:text-white/78">Tap through recent updates.</p>
          </div>
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white transition hover:bg-accent/90"
              onClick={() => setStoryUploadOpen(true)}
              type="button"
            >
              <Plus className="h-3.5 w-3.5 text-white" />
              Create story
            </button>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/65 transition hover:bg-white/5 hover:text-white"
              href="/search"
            >
              Search
            </Link>
          </div>
        </div>
        <StoryHighlightRow highlights={highlights} stories={stories} />
      </section>

      <QuickUploadSheet defaultMode="story" onClose={() => setStoryUploadOpen(false)} open={storyUploadOpen} />
    </>
  );
}
