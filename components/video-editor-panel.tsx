"use client";

import { Scissors, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { extractVideoFrameAt } from "@/lib/media/video-editor";

export function VideoEditorPanel({
  aspectRatio,
  coverTime,
  focusY,
  muted,
  onCoverTimeChange,
  onFocusYChange,
  onMutedChange,
  onTrimEndChange,
  onTrimStartChange,
  previewUrl,
  trimEnd,
  trimStart,
  videoDuration
}: {
  aspectRatio: number;
  coverTime: number;
  focusY: number;
  muted: boolean;
  onCoverTimeChange: (value: number) => void;
  onFocusYChange: (value: number) => void;
  onMutedChange: (value: boolean) => void;
  onTrimEndChange: (value: number) => void;
  onTrimStartChange: (value: number) => void;
  previewUrl: string;
  trimEnd: number;
  trimStart: number;
  videoDuration: number;
}) {
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const trimmedDuration = Math.max(0, trimEnd - trimStart);

  useEffect(() => {
    let cancelled = false;
    let file: File | null = null;

    async function renderCover() {
      setCoverLoading(true);

      try {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        file = new File([blob], "cover-source", { type: blob.type || "video/webm" });
        const frame = await extractVideoFrameAt(file, coverTime, aspectRatio, focusY);

        if (!cancelled) {
          setCoverPreview(frame);
        }
      } catch {
        if (!cancelled) {
          setCoverPreview(null);
        }
      } finally {
        if (!cancelled) {
          setCoverLoading(false);
        }
      }
    }

    void renderCover();

    return () => {
      cancelled = true;
    };
  }, [aspectRatio, coverTime, focusY, previewUrl]);

  return (
    <section className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Scissors className="h-4 w-4 text-accent-soft" />
          Video editor
        </div>
        <button
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em] ${
            muted ? "border-accent/50 bg-accent/10 text-accent-soft" : "border-white/10 text-white/72"
          }`}
          onClick={() => onMutedChange(!muted)}
          type="button"
        >
          {muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          {muted ? "Muted" : "Audio on"}
        </button>
      </div>
      <p className="mt-2 text-sm text-white/55">Trim the clip, choose the cover frame, and lock the crop before publishing.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-[22px] border border-white/10 bg-black" style={{ aspectRatio }}>
            <video
              className="h-full w-full object-cover"
              controls
              muted={muted}
              playsInline
              preload="metadata"
              src={previewUrl}
              style={{ objectPosition: `center ${focusY}%` }}
            />
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/45">
              <span>Timeline</span>
              <span>{trimmedDuration.toFixed(1)}s selected</span>
            </div>
            <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent/75"
                style={{
                  marginLeft: `${videoDuration > 0 ? (trimStart / videoDuration) * 100 : 0}%`,
                  width: `${videoDuration > 0 ? (trimmedDuration / videoDuration) * 100 : 0}%`
                }}
              />
            </div>
            <div className="mt-4 space-y-4">
              <label className="block">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/50">
                  <span>Start</span>
                  <span>{trimStart.toFixed(1)}s</span>
                </div>
                <input
                  className="w-full accent-red-500"
                  max={Math.max(0, trimEnd - 0.1)}
                  min={0}
                  onChange={(event) => onTrimStartChange(Number(event.target.value))}
                  step={0.1}
                  type="range"
                  value={trimStart}
                />
              </label>
              <label className="block">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/50">
                  <span>End</span>
                  <span>{trimEnd.toFixed(1)}s</span>
                </div>
                <input
                  className="w-full accent-red-500"
                  max={videoDuration}
                  min={Math.min(videoDuration, trimStart + 0.1)}
                  onChange={(event) => onTrimEndChange(Number(event.target.value))}
                  step={0.1}
                  type="range"
                  value={trimEnd}
                />
              </label>
              <label className="block">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/50">
                  <span>Cover frame</span>
                  <span>{coverTime.toFixed(1)}s</span>
                </div>
                <input
                  className="w-full accent-red-500"
                  max={trimEnd}
                  min={trimStart}
                  onChange={(event) => onCoverTimeChange(Number(event.target.value))}
                  step={0.1}
                  type="range"
                  value={coverTime}
                />
              </label>
              <label className="block">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/50">
                  <span>Vertical frame</span>
                  <span>{Math.round(focusY)}%</span>
                </div>
                <input
                  className="w-full accent-red-500"
                  max={100}
                  min={0}
                  onChange={(event) => onFocusYChange(Number(event.target.value))}
                  step={1}
                  type="range"
                  value={focusY}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">Chosen cover</p>
          <div className="mt-3 overflow-hidden rounded-[18px] border border-white/10 bg-black" style={{ aspectRatio }}>
            {coverPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Video cover frame" className="h-full w-full object-cover" src={coverPreview} />
            ) : (
              <div className="flex h-full min-h-[220px] items-center justify-center px-6 text-center text-xs uppercase tracking-[0.18em] text-white/40">
                {coverLoading ? "Rendering frame" : "Cover preview unavailable"}
              </div>
            )}
          </div>
          <p className="mt-3 text-xs leading-6 text-white/55">
            This is the exact frame you are choosing for the cover image preview.
          </p>
        </div>
      </div>
    </section>
  );
}
