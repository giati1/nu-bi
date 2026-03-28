"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clapperboard, Sparkles, Wand2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";

export function FeedComposer() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [aiPending, startAITransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contentType, setContentType] = useState<"standard" | "poll">("standard");
  const [postStatus, setPostStatus] = useState<"published" | "draft" | "scheduled">("published");
  const [body, setBody] = useState("");
  const [captionVibe, setCaptionVibe] = useState("confident");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("editorial");
  const [generatedMedia, setGeneratedMedia] = useState<Array<{ storageKey: string; url: string; mimeType: string | null }>>([]);

  return (
    <form
      className="glass-panel min-w-0 overflow-hidden rounded-[28px] p-4 shadow-panel md:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        setError(null);

        startTransition(async () => {
          let media: Array<{ storageKey: string; url: string; mimeType: string | null }> = [...generatedMedia];
          const file = fileRef.current?.files?.[0];

          if (file) {
            const mediaValidationError = await validateMediaFile(file);
            if (mediaValidationError) {
              setError(mediaValidationError);
              return;
            }
            const upload = new FormData();
            upload.set("file", file);
            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: upload
            });
            const uploadPayload = await uploadResponse.json();
            if (!uploadResponse.ok) {
              setError(uploadPayload.error ?? "Upload failed.");
              return;
            }
            media = [uploadPayload.file];
            media = [...generatedMedia, uploadPayload.file];
          }

          const response = await fetch("/api/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body,
              media,
              contentType,
              status: postStatus,
              scheduledFor: postStatus === "scheduled" ? form.get("scheduledFor") : null,
              pollOptions:
                contentType === "poll"
                  ? [
                      String(form.get("pollOption1") ?? ""),
                      String(form.get("pollOption2") ?? ""),
                      String(form.get("pollOption3") ?? ""),
                      String(form.get("pollOption4") ?? "")
                    ]
                  : []
            })
          });
          const payload = await response.json();
          if (!response.ok) {
            setError(payload.error ?? "Failed to publish post.");
            return;
          }

          formElement.reset();
          setBody("");
          setGeneratedMedia([]);
          setImagePrompt("");
          if (fileRef.current) {
            fileRef.current.value = "";
          }
          router.refresh();
        });
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold">Share something sharp</p>
        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-full px-3 py-1 text-xs ${contentType === "standard" ? "bg-accent text-white" : "bg-white/10 text-white/70"}`}
            onClick={() => setContentType("standard")}
            type="button"
          >
            Post
          </button>
          <button
            className={`rounded-full px-3 py-1 text-xs ${contentType === "poll" ? "bg-accent text-white" : "bg-white/10 text-white/70"}`}
            onClick={() => setContentType("poll")}
            type="button"
          >
            Poll
          </button>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {[
          ["published", "Publish now"],
          ["draft", "Save draft"],
          ["scheduled", "Schedule"]
        ].map(([value, label]) => (
          <button
            className={`rounded-full px-3 py-1 text-xs ${postStatus === value ? "bg-white text-black" : "bg-white/10 text-white/70"}`}
            key={value}
            onClick={() => setPostStatus(value as "published" | "draft" | "scheduled")}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        className="mt-4 min-h-32 w-full max-w-full rounded-[24px] border border-white/10 bg-black/40 px-4 py-4 outline-none transition focus:border-accent"
        maxLength={500}
        name="body"
        onChange={(event) => setBody(event.target.value)}
        placeholder="A founder note, a visual drop, a hot take, a launch update... or leave blank and post an image."
        value={body}
      />
      <section className="mt-4 rounded-[24px] border border-accent/15 bg-accent/5 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Sparkles className="h-4 w-4 text-accent-soft" />
          AI creation tools
        </div>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,220px)_auto]">
          <input
            className="min-w-0 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
            onChange={(event) => setCaptionVibe(event.target.value)}
            placeholder="Caption vibe"
            value={captionVibe}
          />
          <input
            className="min-w-0 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
            onChange={(event) => setImageStyle(event.target.value)}
            placeholder="Image style"
            value={imageStyle}
          />
          <button
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 hover:bg-white/5 md:justify-self-start"
            disabled={aiPending}
            onClick={() =>
              startAITransition(async () => {
                setError(null);
                const response = await fetch("/api/ai/caption", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ body, vibe: captionVibe })
                });
                const payload = await response.json();
                if (!response.ok) {
                  setError(payload.error ?? "Caption generation failed.");
                  return;
                }
                setBody(payload.caption);
              })
            }
            type="button"
          >
            Rewrite caption
          </button>
        </div>
        <div className="mt-3 flex min-w-0 flex-col gap-3 md:flex-row">
          <input
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
            onChange={(event) => setImagePrompt(event.target.value)}
            placeholder="Describe an AI-generated visual for this post..."
            value={imagePrompt}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
            disabled={aiPending || imagePrompt.trim().length < 4}
            onClick={() =>
              startAITransition(async () => {
                setError(null);
                const response = await fetch("/api/ai/visual", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ prompt: imagePrompt, style: imageStyle })
                });
                const payload = await response.json();
                if (!response.ok) {
                  setError(payload.error ?? "Image generation failed.");
                  return;
                }
                setGeneratedMedia([
                  {
                    storageKey: `ai-generated:${Date.now()}`,
                    url: payload.url,
                    mimeType: "image/svg+xml"
                  }
                ]);
              })
            }
            type="button"
          >
            <Wand2 className="h-4 w-4" />
            {aiPending ? "Generating..." : "Generate image"}
          </button>
        </div>
        {generatedMedia[0] ? (
          <div className="mt-4 min-w-0 overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[18px]">
              <Image alt="Generated concept" className="object-cover" fill sizes="720px" src={generatedMedia[0].url} unoptimized />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-white/60">AI-generated concept attached to this post.</p>
              <button
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                onClick={() => setGeneratedMedia([])}
                type="button"
              >
                Remove
              </button>
            </div>
          </div>
        ) : null}
      </section>
      {contentType === "poll" ? (
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-2">
          {[1, 2, 3, 4].map((index) => (
            <input
              className="min-w-0 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
              key={index}
              name={`pollOption${index}`}
              placeholder={`Option ${index}${index <= 2 ? " (required)" : " (optional)"}`}
            />
          ))}
        </div>
      ) : null}
      {postStatus === "scheduled" ? (
        <input
          className="mt-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          name="scheduledFor"
          type="datetime-local"
        />
      ) : null}
      <div className="mt-4 flex min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="block max-w-full text-sm text-white/60"
          ref={fileRef}
          type="file"
        />
        <button
          className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Working..." : postStatus === "draft" ? "Save draft" : postStatus === "scheduled" ? "Schedule" : "Publish"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <p className="mt-3 inline-flex items-center gap-2 text-xs text-white/45">
        <Clapperboard className="h-3.5 w-3.5" />
        NOMI supports images plus short videos up to 30 seconds in `mp4`, `webm`, or `mov`.
      </p>
    </form>
  );
}

async function validateMediaFile(file: File) {
  if (file.type.startsWith("video/")) {
    if (!["video/mp4", "video/webm", "video/quicktime"].includes(file.type)) {
      return "Use mp4, webm, or mov for short videos.";
    }
    if (file.size > 50 * 1024 * 1024) {
      return "Short videos must be under 50MB.";
    }
    const duration = await getVideoDuration(file);
    if (duration > 30) {
      return "Short videos must be 30 seconds or less.";
    }
  }
  return null;
}

async function getVideoDuration(file: File) {
  return await new Promise<number>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = objectUrl;
    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      URL.revokeObjectURL(objectUrl);
      resolve(duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(0);
    };
  });
}
