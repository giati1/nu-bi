"use client";

import Image from "next/image";
import { Clapperboard, FileText, ImageIcon, MessageSquareText } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AIChatPanel } from "@/components/ai-chat-panel";

const moods = [
  { id: "focused", label: "Focused" },
  { id: "warm", label: "Warm" },
  { id: "playful", label: "Playful" },
  { id: "bold", label: "Bold" }
] as const;

const tabs = [
  { id: "chat", label: "Chat", Icon: MessageSquareText },
  { id: "images", label: "Images", Icon: ImageIcon },
  { id: "video", label: "Video", Icon: Clapperboard },
  { id: "docs", label: "Docs", Icon: FileText }
] as const;

type StudioTab = (typeof tabs)[number]["id"];
type GeneratedVideoResult = {
  storageKey: string;
  mimeType: string | null;
  url: string;
  prompt: string;
  thumbnailUrl: string | null;
  seconds: string;
  size: string;
};

export function AIStudio() {
  const [activeTab, setActiveTab] = useState<StudioTab>("chat");
  const [mood, setMood] = useState<(typeof moods)[number]["id"]>("focused");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("editorial");
  const [imageOutput, setImageOutput] = useState<{ url: string; prompt: string } | null>(null);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoStyle, setVideoStyle] = useState("cinematic social launch");
  const [videoSeconds, setVideoSeconds] = useState<"4" | "8">("8");
  const [videoSize, setVideoSize] = useState<"720x1280" | "1280x720">("720x1280");
  const [videoReferenceFile, setVideoReferenceFile] = useState<File | null>(null);
  const [videoReferencePreviewUrl, setVideoReferencePreviewUrl] = useState<string | null>(null);
  const [videoOutput, setVideoOutput] = useState<GeneratedVideoResult | null>(null);
  const [videoStatusText, setVideoStatusText] = useState<string | null>(null);
  const [videoActionPending, setVideoActionPending] = useState<"publish" | "draft" | null>(null);
  const [docPrompt, setDocPrompt] = useState("Read this document and summarize the important details.");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docText, setDocText] = useState("");
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docOutput, setDocOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedDocLabel = useMemo(() => {
    if (!docFile) {
      return "No document selected";
    }
    return `${docFile.name} - ${formatFileSize(docFile.size)}`;
  }, [docFile]);

  const selectedVideoReferenceLabel = useMemo(() => {
    if (!videoReferenceFile) {
      return "No reference image selected";
    }
    return `${videoReferenceFile.name} - ${formatFileSize(videoReferenceFile.size)}`;
  }, [videoReferenceFile]);

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[30px] p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">AI workspace</p>
            <p className="mt-3 text-sm text-white/68">
              One place for chat, photo generation, video generation, and document reading.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {moods.map((item) => (
              <button
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  mood === item.id ? "bg-white text-black" : "border border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/[0.06]"
                }`}
                key={item.id}
                onClick={() => setMood(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {tabs.map(({ id, label, Icon }) => (
            <button
              className={`flex items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-semibold transition ${
                activeTab === id
                  ? "border-accent bg-white text-black"
                  : "border-white/10 bg-black/25 text-white/76 hover:border-white/20 hover:bg-white/[0.04]"
              }`}
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "chat" ? <AIChatPanel /> : null}

      {activeTab === "images" ? (
        <section className="glass-panel rounded-[30px] p-5 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">Image Generator</p>
              <p className="mt-2 text-sm text-white/62">Describe the look you want and NU-BI AI will build a visual from it.</p>
            </div>
            <button
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const response = await fetch("/api/ai/visual", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: imagePrompt, style: imageStyle, mood })
                  });
                  const payload = await response.json();
                  if (!response.ok) {
                    setError(payload.error ?? "Image generation failed.");
                    return;
                  }
                  setImageOutput(payload);
                })
              }
              type="button"
            >
              {pending ? "Working..." : "Generate image"}
            </button>
          </div>
          <textarea
            className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
            onChange={(event) => setImagePrompt(event.target.value)}
            placeholder="Describe a campaign visual, mood board, product drop, portrait, or post background..."
            value={imagePrompt}
          />
          <input
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
            onChange={(event) => setImageStyle(event.target.value)}
            placeholder="Style"
            value={imageStyle}
          />
          {imageOutput ? (
            <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-3">
              <div className="relative aspect-square overflow-hidden rounded-[18px]">
                <Image alt={imageOutput.prompt} className="object-cover" fill sizes="720px" src={imageOutput.url} unoptimized />
              </div>
              <p className="mt-3 text-sm text-white/60">{imageOutput.prompt}</p>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeTab === "video" ? (
        <section className="glass-panel rounded-[30px] p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">Video Generator</p>
              <p className="mt-2 text-sm text-white/62">
                Render a short AI video for promos, concept clips, and social drops. This can take a minute or two.
              </p>
            </div>
            <button
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  setVideoOutput(null);
                  setVideoStatusText("Generating video here. When the render finishes, it will appear in this panel.");
                  const requestBody = videoReferenceFile ? new FormData() : null;
                  if (requestBody) {
                    requestBody.set("prompt", videoPrompt);
                    requestBody.set("style", videoStyle);
                    requestBody.set("mood", mood);
                    requestBody.set("seconds", videoSeconds);
                    requestBody.set("size", videoSize);
                    if (videoReferenceFile) {
                      requestBody.set("referenceImage", videoReferenceFile);
                    }
                  }
                  const response = await fetch("/api/ai/video", requestBody
                    ? {
                        method: "POST",
                        body: requestBody
                      }
                    : {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          prompt: videoPrompt,
                          style: videoStyle,
                          mood,
                          seconds: videoSeconds,
                          size: videoSize
                        })
                      });
                  const payload = await response.json();
                  if (!response.ok) {
                    setError(payload.error ?? "Video generation failed.");
                    setVideoStatusText(null);
                    return;
                  }
                  setVideoOutput(payload);
                  setVideoStatusText("Video ready. You can preview it here, download it, post it now, or save it as a draft.");
                })
              }
              type="button"
            >
              {pending ? "Rendering..." : "Generate video"}
            </button>
          </div>
          <textarea
            className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
            onChange={(event) => setVideoPrompt(event.target.value)}
            placeholder="Describe the scene, motion, camera feel, product moment, or vibe you want..."
            value={videoPrompt}
          />
          <input
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
            onChange={(event) => setVideoStyle(event.target.value)}
            placeholder="Style"
            value={videoStyle}
          />
          <div className="mt-3 rounded-[22px] border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-accent-soft">Reference image</p>
                <p className="mt-2 text-sm text-white/62">
                  Upload a still image if you want the video to recreate that scene or subject instead of starting from text alone.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/82">
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setError(null);
                    setVideoReferenceFile(file);
                    setVideoOutput(null);
                    setVideoStatusText(null);
                    setVideoReferencePreviewUrl((current) => {
                      if (current) {
                        URL.revokeObjectURL(current);
                      }
                      return file ? URL.createObjectURL(file) : null;
                    });
                  }}
                  type="file"
                />
                Choose image
              </label>
            </div>
            <p className="mt-3 text-sm text-white/62">{selectedVideoReferenceLabel}</p>
            {videoReferencePreviewUrl ? (
              <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/30 p-3">
                <div
                  className={`relative overflow-hidden rounded-[18px] ${
                    videoSize === "1280x720" ? "aspect-video" : "aspect-[9/16]"
                  }`}
                >
                  <Image alt="Video reference" className="object-cover" fill sizes="560px" src={videoReferencePreviewUrl} unoptimized />
                </div>
              </div>
            ) : null}
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-accent-soft">Duration</p>
              <select
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
                onChange={(event) => setVideoSeconds(event.target.value as "4" | "8")}
                value={videoSeconds}
              >
                <option value="4">4 seconds</option>
                <option value="8">8 seconds</option>
              </select>
            </label>
            <label className="rounded-[22px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-accent-soft">Format</p>
              <select
                className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
                onChange={(event) => setVideoSize(event.target.value as "720x1280" | "1280x720")}
                value={videoSize}
              >
                <option value="720x1280">Vertical 9:16</option>
                <option value="1280x720">Landscape 16:9</option>
              </select>
            </label>
          </div>
          {pending ? (
            <div className="mt-4 rounded-[24px] border border-accent/20 bg-accent/5 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">Generating video</p>
              <p className="mt-3 text-sm text-white/82">
                Generating video here. Keep this panel open. Your finished clip will appear in this section automatically.
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
              </div>
            </div>
          ) : null}
          {videoOutput ? (
            <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-3">
              <div className="overflow-hidden rounded-[18px]">
                <video
                  className={`max-h-[40rem] w-full bg-black object-cover ${
                    videoOutput.size === "1280x720" ? "aspect-video" : "aspect-[9/16]"
                  }`}
                  controls
                  playsInline
                  poster={videoOutput.thumbnailUrl ?? undefined}
                  preload="metadata"
                  src={videoOutput.url}
                />
              </div>
              <p className="mt-3 text-sm text-white/60">{videoOutput.prompt}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/45">
                {videoOutput.seconds}s - {videoOutput.size}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                  download
                  href={videoOutput.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Download video
                </a>
                <button
                  className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-medium text-accent-soft disabled:opacity-60"
                  disabled={videoActionPending !== null}
                  onClick={() => publishGeneratedVideo(videoOutput, "published")}
                  type="button"
                >
                  {videoActionPending === "publish" ? "Posting..." : "Post now"}
                </button>
                <button
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82 disabled:opacity-60"
                  disabled={videoActionPending !== null}
                  onClick={() => publishGeneratedVideo(videoOutput, "draft")}
                  type="button"
                >
                  {videoActionPending === "draft" ? "Saving..." : "Save as draft"}
                </button>
                <button
                  className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82 disabled:opacity-60"
                  disabled={videoActionPending !== null}
                  onClick={() => useGeneratedVideoInCreator(videoOutput)}
                  type="button"
                >
                  Use in creator
                </button>
                <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82" href="/creator/media">
                  Open media library
                </Link>
              </div>
              <p className="mt-3 text-xs leading-6 text-white/52">
                Generated videos are stored in site media and shown here in AI Studio first. You can download them, post them immediately, or save them as a draft.
              </p>
            </div>
          ) : null}
          {!videoOutput && !pending ? (
            <p className="mt-4 text-xs leading-6 text-white/52">
              Supported render lengths here are 4 and 8 seconds. Finished clips appear in this panel first. Add a reference image if you want the video to animate a specific still.
            </p>
          ) : null}
          {videoStatusText ? <p className="mt-4 text-sm text-white/62">{videoStatusText}</p> : null}
        </section>
      ) : null}

      {activeTab === "docs" ? (
        <section className="glass-panel rounded-[30px] p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">Document Scan and Reader</p>
              <p className="mt-2 text-sm text-white/62">
                Upload a photo of a page, note, receipt, or a text file and NU-BI AI will read it for you.
              </p>
            </div>
            <button
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white"
              disabled={pending || (!docFile && !docText.trim())}
              onClick={() =>
                startTransition(async () => {
                  setError(null);

                  let imageDataUrl: string | null = null;
                  if (docFile?.type.startsWith("image/")) {
                    imageDataUrl = await readFileAsDataUrl(docFile);
                  }

                  const response = await fetch("/api/ai/document", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      task: docPrompt,
                      text: docText.trim() || null,
                      imageDataUrl
                    })
                  });
                  const payload = await response.json();
                  if (!response.ok) {
                    setError(payload.error ?? "Document reading failed.");
                    return;
                  }
                  setDocOutput(payload.result);
                })
              }
              type="button"
            >
              {pending ? "Reading..." : "Read document"}
            </button>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/82">
              <input
                accept="image/*,.txt,.md,.json,.csv"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0] ?? null;
                  setError(null);
                  setDocOutput("");
                  setDocFile(file);
                  setDocText("");
                  if (docPreviewUrl) {
                    URL.revokeObjectURL(docPreviewUrl);
                    setDocPreviewUrl(null);
                  }

                  if (!file) {
                    return;
                  }

                  if (file.type.startsWith("image/")) {
                    setDocPreviewUrl(URL.createObjectURL(file));
                    return;
                  }

                  if (isReadableTextType(file)) {
                    setDocText(await file.text());
                    return;
                  }

                  setDocFile(null);
                  setError("Use an image of a document or a text file.");
                }}
                type="file"
              />
              Choose document
            </label>
            <p className="mt-3 text-sm text-white/62">{selectedDocLabel}</p>
            <textarea
              className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
              onChange={(event) => setDocPrompt(event.target.value)}
              placeholder="What should NU-BI AI do with this document?"
              value={docPrompt}
            />

            {docPreviewUrl ? (
              <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/30 p-3">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[18px]">
                  <Image alt="Selected document" className="object-contain" fill sizes="560px" src={docPreviewUrl} unoptimized />
                </div>
              </div>
            ) : null}

            {docText ? (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">Detected text</p>
                <p className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap text-sm text-white/78">{docText}</p>
              </div>
            ) : null}

            {docOutput ? (
              <div className="mt-4 rounded-[24px] border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">Reading result</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-white/85">{docOutput}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );

  async function publishGeneratedVideo(video: GeneratedVideoResult, status: "published" | "draft") {
    setError(null);
    setVideoActionPending(status === "published" ? "publish" : "draft");

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: "",
          contentType: "standard",
          status,
          media: [
            {
              storageKey: video.storageKey,
              url: video.url,
              mimeType: video.mimeType
            }
          ]
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Could not save the generated video.");
        return;
      }

      setVideoStatusText(
        status === "published"
          ? "Video posted. You can find it in your feed and shorts view."
          : "Video saved as a draft. You can finish it later from the creator page."
      );
    } catch {
      setError("Could not save the generated video.");
    } finally {
      setVideoActionPending(null);
    }
  }

  function useGeneratedVideoInCreator(video: GeneratedVideoResult) {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(
        "nubi-ai-generated-media",
        JSON.stringify({
          storageKey: video.storageKey,
          url: video.url,
          mimeType: video.mimeType,
          filename: `nubi-ai-video-${video.seconds}s.mp4`
        })
      );
      window.location.href = "/creator#post-composer";
    }
  }
}

function isReadableTextType(file: File) {
  if (file.type.startsWith("text/")) {
    return true;
  }

  return [".txt", ".md", ".json", ".csv"].some((extension) => file.name.toLowerCase().endsWith(extension));
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read image."));
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
