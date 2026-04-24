"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Mic, Play, Plus, Sparkles, Square, X } from "lucide-react";
import type { Dispatch, SetStateAction, TouchEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { MicrophoneLevel } from "@/components/microphone-level";
import { useMicrophoneLevel } from "@/hooks/use-microphone-level";
import { cn } from "@/lib/utils";

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

function isVideoStory(url?: string | null) {
  return Boolean(url && url.match(/\.(mp4|webm|mov|m4v)(\?|$)/i));
}

export function StoryHighlightRow({
  stories,
  highlights,
  className
}: {
  stories: StoryItem[];
  highlights: HighlightItem[];
  className?: string;
}) {
  if (stories.length === 0 && highlights.length === 0) {
    return null;
  }

  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [seenStoryIds, setSeenStoryIds] = useState<string[]>(
    () => stories.filter((story) => story.status === "seen").map((story) => story.id)
  );
  const activeIndex = useMemo(
    () => stories.findIndex((story) => story.id === activeStoryId),
    [activeStoryId, stories]
  );
  const activeStory = activeIndex >= 0 ? stories[activeIndex] : null;

  useEffect(() => {
    setSeenStoryIds((current) => {
      const serverSeenIds = stories
        .filter((story) => story.status === "seen")
        .map((story) => story.id);
      return Array.from(new Set([...current, ...serverSeenIds]));
    });
  }, [stories]);

  useEffect(() => {
    if (!activeStory || activeStory.status === "your-story") {
      return;
    }

    setSeenStoryIds((current) => {
      if (current.includes(activeStory.id)) {
        return current;
      }
      return [...current, activeStory.id];
    });

    void fetch("/api/stories/seen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: activeStory.id })
    }).catch(() => undefined);
  }, [activeStory]);

  const storiesWithSeenState = useMemo(
    () =>
      stories.map((story) =>
        story.status === "your-story" || !seenStoryIds.includes(story.id)
          ? story
          : {
              ...story,
              status: "seen" as const,
              meta: story.meta === "Live" || story.meta === "New" ? "Seen" : story.meta
            }
      ),
    [seenStoryIds, stories]
  );

  const computedActiveIndex = useMemo(
    () => storiesWithSeenState.findIndex((story) => story.id === activeStoryId),
    [activeStoryId, storiesWithSeenState]
  );
  const computedActiveStory =
    computedActiveIndex >= 0 ? storiesWithSeenState[computedActiveIndex] : null;

  useEffect(() => {
    if (!computedActiveStory || paused) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (computedActiveIndex >= storiesWithSeenState.length - 1) {
        setActiveStoryId(null);
        return;
      }

      setActiveStoryId(storiesWithSeenState[computedActiveIndex + 1]?.id ?? null);
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [computedActiveIndex, computedActiveStory, paused, storiesWithSeenState]);

  return (
    <section className={cn("space-y-5", className)}>
      {stories.length > 0 ? (
        <div className="panel-soft edge-light overflow-hidden rounded-[30px] px-4 py-4">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent-soft">Live story rail</p>
              <p className="mt-2 text-sm leading-6 text-white/66">Recent updates, replies, and highlights all in one place.</p>
            </div>
          </div>
          <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
            <div className="flex min-w-max gap-3">
              {storiesWithSeenState.map((item) => (
                <StoryChip item={item} key={item.id} onOpen={() => setActiveStoryId(item.id)} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {highlights.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {highlights.map((item) => (
            <Link
              className="group panel-soft edge-light rounded-[28px] p-4 transition hover:border-white/15 hover:bg-white/[0.05]"
              href={item.href}
              key={item.id}
            >
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-accent/10 p-[2px]">
                  <div className="rounded-full bg-[#0b0b0d] p-[5px]">
                    <Avatar className="h-12 w-12" name={item.label} src={item.imageUrl ?? null} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-accent-soft">
                    <Sparkles className="h-3.5 w-3.5" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em]">{item.eyebrow}</p>
                  </div>
                  <p className="mt-2 truncate text-base font-semibold text-white">{item.label}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-5 text-white/68">{item.detail}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : null}

      <StoryViewer
        activeIndex={computedActiveIndex}
        onClose={() => setActiveStoryId(null)}
        onNext={() => {
          if (computedActiveIndex >= storiesWithSeenState.length - 1) {
            setActiveStoryId(null);
            return;
          }
          setActiveStoryId(storiesWithSeenState[computedActiveIndex + 1]?.id ?? null);
        }}
        onPrevious={() => {
          if (computedActiveIndex <= 0) {
            return;
          }
          setActiveStoryId(storiesWithSeenState[computedActiveIndex - 1]?.id ?? null);
        }}
        open={Boolean(computedActiveStory)}
        paused={paused}
        setPaused={setPaused}
        stories={storiesWithSeenState}
      />
    </section>
  );
}

function StoryChip({
  item,
  onOpen
}: {
  item: StoryItem;
  onOpen: () => void;
}) {
  const videoStory = isVideoStory(item.imageUrl);

  return (
    <button
      aria-label={item.label}
      className="group flex w-[88px] shrink-0 flex-col items-center gap-3"
      onClick={onOpen}
      type="button"
    >
      <div
        className={cn(
          "rounded-full p-[2px] transition group-hover:scale-[1.03]",
          item.status === "new"
            ? "bg-[linear-gradient(135deg,rgba(255,59,59,0.95),rgba(255,255,255,0.92))]"
            : item.status === "your-story"
              ? "bg-white/20"
              : "bg-white/10"
        )}
      >
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#0b0b0d]">
          {item.action ? (
            <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full border border-dashed border-white/18 bg-white/[0.03] text-white/78">
              <Plus className="h-5 w-5" />
            </div>
          ) : videoStory ? (
            <div className="relative flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full bg-white/[0.03]">
              <Avatar className="absolute inset-0 h-full w-full opacity-45" name={item.label} src={null} />
              <div className="relative rounded-full border border-white/12 bg-black/55 p-2 text-white">
                <Play className="h-4 w-4 fill-current" />
              </div>
            </div>
          ) : (
            <Avatar className="h-[62px] w-[62px]" name={item.label} src={item.imageUrl ?? null} />
          )}
        </div>
      </div>
      <div className="w-full text-center">
        <p className="truncate text-xs font-medium text-white/92">{item.label}</p>
        <p className="mt-1 truncate text-[11px] uppercase tracking-[0.12em] text-white/45">
          {item.meta ?? (item.status === "new" ? "New" : "Seen")}
        </p>
      </div>
    </button>
  );
}

function StoryViewer({
  open,
  paused,
  setPaused,
  stories,
  activeIndex,
  onClose,
  onNext,
  onPrevious
}: {
  open: boolean;
  paused: boolean;
  setPaused: Dispatch<SetStateAction<boolean>>;
  stories: StoryItem[];
  activeIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const router = useRouter();
  const activeStory = activeIndex >= 0 ? stories[activeIndex] : null;
  const activeStoryIsVideo = isVideoStory(activeStory?.imageUrl);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const voiceFileRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const [replyBody, setReplyBody] = useState("");
  const [engagementPending, setEngagementPending] = useState(false);
  const [engagementMessage, setEngagementMessage] = useState<string | null>(null);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [panelActive, setPanelActive] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [voiceAttachment, setVoiceAttachment] = useState<{
    name: string;
    type: string;
    previewUrl: string;
  } | null>(null);
  const micLevel = useMicrophoneLevel(recordingStream);

  useEffect(() => {
    if (!open || !activeStory) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPaused(false);
        onClose();
        return;
      }
      if (event.key === "ArrowLeft") {
        setPaused(false);
        onPrevious();
        return;
      }
      if (event.key === "ArrowRight") {
        setPaused(false);
        onNext();
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeStory, onClose, onNext, onPrevious, open, setPaused]);

  useEffect(() => {
    setReplyBody("");
    setEngagementMessage(null);
    setVoiceAttachment(null);
    setImageFailed(false);
    if (voiceFileRef.current) {
      voiceFileRef.current.value = "";
    }
  }, [activeStory?.id]);

  useEffect(() => {
    if (!open || !activeStory) {
      setPanelActive(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setPanelActive(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [activeStory, open]);

  if (!open || !activeStory) {
    return null;
  }

  async function sendReaction(emoji: string) {
    const story = activeStory;
    if (!story) {
      return;
    }

    setEngagementPending(true);
    setEngagementMessage(null);

    const response = await fetch("/api/stories/engage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId: story.id,
        kind: "reaction",
        emoji
      })
    });

    const payload = await response.json();
    setEngagementPending(false);

    if (!response.ok) {
      setEngagementMessage(payload.error ?? "Could not save reaction.");
      return;
    }

    setEngagementMessage(`${emoji} sent`);
  }

  async function sendReply() {
    const story = activeStory;
    if (!story) {
      return;
    }

    let media: Array<{ storageKey: string; url: string; mimeType: string | null }> = [];
    const file = voiceFileRef.current?.files?.[0] ?? null;

    if (!replyBody.trim() && !file) {
      setEngagementMessage("Write a reply or attach a voice note.");
      return;
    }

    setEngagementPending(true);
    setEngagementMessage(null);

    if (file) {
      const upload = new FormData();
      upload.set("file", file);
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: upload
      });
      const uploadPayload = await uploadResponse.json();
      if (!uploadResponse.ok) {
        setEngagementPending(false);
        setEngagementMessage(uploadPayload.error ?? "Could not upload voice reply.");
        return;
      }
      media = [uploadPayload.file];
    }

    const response = await fetch("/api/stories/engage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storyId: story.id,
        kind: "reply",
        body: replyBody,
        media
      })
    });

    const payload = await response.json();
    setEngagementPending(false);

    if (!response.ok) {
      setEngagementMessage(payload.error ?? "Could not send reply.");
      return;
    }

    setReplyBody("");
    setVoiceAttachment(null);
    if (voiceFileRef.current) {
      voiceFileRef.current.value = "";
    }
    setEngagementMessage("Reply sent");
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartX.current = touch?.clientX ?? null;
    touchStartY.current = touch?.clientY ?? null;
    setPaused(true);
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    const startX = touchStartX.current;
    const startY = touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    setPaused(false);

    if (startX === null || startY === null || !touch) {
      return;
    }

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    if (Math.abs(deltaX) < 60 || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    if (deltaX < 0) {
      onNext();
      return;
    }
    onPrevious();
  };

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Close story viewer"
        className={cn(
          "absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          panelActive ? "opacity-100" : "opacity-0"
        )}
        onClick={() => {
          setPanelActive(false);
          setPaused(false);
          onClose();
        }}
        type="button"
      />
      <div
        className={cn(
          "absolute inset-x-3 top-3 bottom-3 mx-auto flex max-w-md flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[#050505]/96 shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          panelActive ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.985] opacity-0"
        )}
        onTouchEnd={handleTouchEnd}
        onTouchStart={handleTouchStart}
      >
        <div className="flex gap-1.5 px-4 pt-4">
          {stories.map((story, index) => (
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10" key={story.id}>
              <div
                className={cn(
                  "h-full rounded-full bg-white transition-all duration-300",
                  index < activeIndex
                    ? "w-full"
                    : index === activeIndex
                      ? paused
                        ? "w-1/2"
                        : "w-2/3"
                      : "w-0"
                )}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-4 pb-4 pt-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-11 w-11" name={activeStory.label} src={activeStory.imageUrl ?? null} />
            <div>
              <p className="text-sm font-semibold text-white">{activeStory.label}</p>
              <p className="text-xs uppercase tracking-[0.16em] text-white/45">
                {activeStory.meta ?? (activeStory.status === "new" ? "Live now" : "Recent")}
              </p>
            </div>
          </div>
          <button
            className="rounded-full border border-white/10 p-2 text-white/80 transition hover:border-white/20 hover:text-white"
            onClick={() => {
              setPaused(false);
              onClose();
            }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mx-4 flex-1 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_52%),linear-gradient(180deg,#171717,#070707)]">
          {activeStory.imageUrl && activeStoryIsVideo ? (
            <video
              autoPlay
              className={cn(
                "h-full w-full object-cover media-image-focus opacity-72 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                panelActive ? "scale-100" : "scale-[1.04]"
              )}
              loop
              muted
              playsInline
              src={activeStory.imageUrl}
            />
          ) : activeStory.imageUrl && !imageFailed ? (
            <Image
              alt={activeStory.label}
              className={cn(
                "object-cover media-image-focus opacity-65 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                panelActive ? "scale-100" : "scale-[1.04]"
              )}
              fill
              onError={() => setImageFailed(true)}
              sizes="(max-width: 768px) 100vw, 420px"
              src={activeStory.imageUrl}
              unoptimized
            />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.22),rgba(0,0,0,0.08)_30%,rgba(0,0,0,0.45)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,0,0,0.08),transparent_35%,transparent_65%,rgba(255,255,255,0.03))]" />
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div
              className={cn(
                "w-full max-w-[16rem] text-center transition-all duration-500 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)]",
                panelActive ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
              )}
            >
              <div className="mx-auto w-fit rounded-full bg-accent/10 p-[3px]">
                <div className="rounded-full bg-[#0b0b0d] p-[8px]">
                  <Avatar
                    className="h-28 w-28"
                    name={activeStory.label}
                    src={activeStoryIsVideo ? null : (activeStory.imageUrl ?? null)}
                  />
                </div>
              </div>
              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-soft">
                {activeStory.status === "your-story" ? "Your story" : activeStory.status === "new" ? "Live update" : "Recent story"}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{activeStory.label}</h3>
              <p className="mt-3 text-sm leading-6 text-white/72">
                {activeStory.body
                  ? activeStory.body
                  : activeStory.status === "your-story"
                    ? "Post a quick update, share a behind-the-scenes moment, or pin something worth revisiting."
                    : activeStory.status === "new"
                      ? "A fresh update is ready. Open it now before it rolls off the story rail."
                      : "Catch up on the latest activity and jump back into the conversation from here."}
              </p>
              <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-white/45">
                Hold to pause. Swipe or use arrow keys to move.
              </p>
            </div>
          </div>

          <button
            aria-label="Previous story"
            className="absolute inset-y-0 left-0 w-1/3"
            disabled={activeIndex <= 0}
            onClick={onPrevious}
            onMouseDown={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onMouseUp={() => setPaused(false)}
            onTouchEnd={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            type="button"
          />
          <button
            aria-label="Next story"
            className="absolute inset-y-0 right-0 w-1/3"
            onClick={onNext}
            onMouseDown={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onMouseUp={() => setPaused(false)}
            onTouchEnd={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            type="button"
          />
          <button
            aria-label="Pause story"
            className="absolute inset-x-[33%] inset-y-0"
            onMouseDown={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onMouseUp={() => setPaused(false)}
            onTouchEnd={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
            type="button"
          />
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <div className="rounded-full bg-black/30 p-2 text-white/80">
              <ChevronLeft className="h-4 w-4" />
            </div>
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <div className="rounded-full bg-black/30 p-2 text-white/80">
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>

        <div className="px-4 pt-4">
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Like", emoji: "heart" },
              { label: "Fire", emoji: "fire" },
              { label: "Need this", emoji: "clap" }
            ].map(({ label, emoji }) => (
              <button
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/78 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                disabled={engagementPending}
                key={label}
                onClick={() => void sendReaction(emoji)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-3">
          <div className="mb-2 flex flex-wrap gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white/78 transition hover:bg-white/5"
              disabled={engagementPending}
              onClick={async () => {
                if (recordingVoice) {
                  recorderRef.current?.stop();
                  return;
                }
                setEngagementMessage(null);
                try {
                  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                  setRecordingStream(stream);
                  const recorder = new MediaRecorder(stream);
                  voiceChunksRef.current = [];
                  recorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                      voiceChunksRef.current.push(event.data);
                    }
                  };
                  recorder.onstop = () => {
                    const blob = new Blob(voiceChunksRef.current, {
                      type: recorder.mimeType || "audio/webm"
                    });
                    const extension = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
                    const voiceFile = new File([blob], `story-reply.${extension}`, {
                      type: recorder.mimeType || "audio/webm"
                    });
                    const transfer = new DataTransfer();
                    transfer.items.add(voiceFile);
                    if (voiceFileRef.current) {
                      voiceFileRef.current.files = transfer.files;
                    }
                    setVoiceAttachment({
                      name: voiceFile.name,
                      type: voiceFile.type,
                      previewUrl: URL.createObjectURL(voiceFile)
                    });
                    recorder.stream.getTracks().forEach((track) => track.stop());
                    setRecordingStream(null);
                    setRecordingVoice(false);
                  };
                  recorderRef.current = recorder;
                  recorder.start();
                  setRecordingVoice(true);
                } catch {
                  setEngagementMessage("Microphone access was blocked or unavailable.");
                }
              }}
              type="button"
            >
              {recordingVoice ? <Square className="h-3.5 w-3.5 text-accent-soft" /> : <Mic className="h-3.5 w-3.5 text-accent-soft" />}
              {recordingVoice ? "Stop voice reply" : "Voice reply"}
            </button>
            <input
              accept="audio/webm,audio/mp4,audio/mpeg,audio/wav"
              className="block text-xs text-white/55"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                if (!file) {
                  setVoiceAttachment(null);
                  return;
                }
                setVoiceAttachment({
                  name: file.name,
                  type: file.type,
                  previewUrl: URL.createObjectURL(file)
                });
              }}
              ref={voiceFileRef}
              type="file"
            />
          </div>
          {recordingVoice ? (
            <div className="mb-2 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
              <MicrophoneLevel active level={micLevel} />
              <p className="text-xs uppercase tracking-[0.14em] text-white/68">Mic live</p>
            </div>
          ) : null}
          {voiceAttachment ? (
            <div className="mb-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-white">{voiceAttachment.name}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/45">Voice reply ready</p>
                </div>
                <button
                  className="rounded-full border border-white/10 p-2 text-white/65 transition hover:text-white"
                  onClick={() => {
                    if (voiceFileRef.current) {
                      voiceFileRef.current.value = "";
                    }
                    setVoiceAttachment(null);
                  }}
                  type="button"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <audio className="mt-3 w-full" controls preload="metadata" src={voiceAttachment.previewUrl} />
            </div>
          ) : null}
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-white/20"
              maxLength={240}
              onChange={(event) => setReplyBody(event.target.value)}
              placeholder="Reply to this story..."
              value={replyBody}
            />
            <button
              className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-60"
              disabled={engagementPending}
              onClick={() => void sendReply()}
              type="button"
            >
              Send
            </button>
          </div>
          {engagementMessage ? (
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/50">{engagementMessage}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-3 px-4 py-4">
          {activeStory.href ? (
            <button
              className="flex-1 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              onClick={() => {
                setPaused(false);
                onClose();
                router.push(activeStory.href!);
              }}
              type="button"
            >
              {activeStory.ctaLabel ?? (activeStory.status === "your-story" ? "Create story" : "Open destination")}
            </button>
          ) : null}
          <button
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/80 transition hover:border-white/20 hover:text-white"
            onClick={() => {
              setPaused(false);
              onClose();
            }}
            type="button"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
