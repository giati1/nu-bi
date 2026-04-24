"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Clapperboard, ImagePlus, Sparkles, Wand2 } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { VideoEditorPanel } from "@/components/video-editor-panel";
import { processImageUpload } from "@/lib/media/image-framing";
import { suggestUploadAssistance, type UploadSuggestion } from "@/lib/media/upload-assistant";
import { getVideoMetadata, processVideoUpload } from "@/lib/media/video-editor";

const MAX_VIDEO_SECONDS = 60;

export function FeedComposer() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const aiToolsRef = useRef<HTMLElement | null>(null);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageFocusY, setImageFocusY] = useState(28);
  const [imageFitMode, setImageFitMode] = useState<"cover" | "contain">("cover");
  const [videoFocusY, setVideoFocusY] = useState(28);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [coverTime, setCoverTime] = useState(0);
  const [videoMuted, setVideoMuted] = useState(false);
  const [assistantSuggestion, setAssistantSuggestion] = useState<UploadSuggestion | null>(null);
  const [publishState, setPublishState] = useState<"idle" | "preparing" | "uploading" | "publishing" | "done">("idle");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isVideoFile = Boolean(selectedFile?.type.startsWith("video/"));

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form
      className="glass-panel min-w-0 overflow-hidden rounded-[28px] p-4 shadow-panel md:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        setError(null);
        setSuccessMessage(null);
        setPublishState("preparing");

        startTransition(async () => {
          let media: Array<{ storageKey: string; url: string; mimeType: string | null }> = [...generatedMedia];
          let file = selectedFile;
          const originalFile = selectedFile;

          if (file) {
            if (file.type.startsWith("image/")) {
              file = await processImageUpload(file, { focusY: imageFocusY, fitMode: imageFitMode });
            } else if (file.type.startsWith("video/")) {
              if (trimEnd - trimStart <= 0) {
                setError("Choose a valid video clip.");
                setPublishState("idle");
                return;
              }
              if (shouldProcessVideoUpload({
                originalFile: file,
                trimEnd,
                trimStart,
                videoDuration,
                videoMuted
              })) {
                file = await processVideoUpload(file, {
                  aspectRatio: 4 / 5,
                  coverTime,
                  focusY: videoFocusY,
                  muted: videoMuted,
                  trimEnd,
                  trimStart
                });
              } else if (originalFile) {
                file = originalFile;
              }
            }
            const mediaValidationError = await validateMediaFile(file);
            if (mediaValidationError) {
              setError(mediaValidationError);
              setPublishState("idle");
              return;
            }
            const upload = new FormData();
            if (!file) {
              setError("Select an image before uploading.");
              setPublishState("idle");
              return;
            }
            upload.set("file", file);
            setPublishState("uploading");
            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: upload
            });
            const uploadPayload = await uploadResponse.json();
            if (!uploadResponse.ok) {
              setError(uploadPayload.error ?? "Upload failed.");
              setPublishState("idle");
              return;
            }
            media = [uploadPayload.file];
            media = [...generatedMedia, uploadPayload.file];
          }

          setPublishState("publishing");
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
            setPublishState("idle");
            return;
          }

          formElement.reset();
          setBody("");
          setError(null);
          setGeneratedMedia([]);
          setImagePrompt("");
          setSuccessMessage(
            postStatus === "draft"
              ? "Draft saved."
              : postStatus === "scheduled"
                ? "Post scheduled."
                : "Post published."
          );
          setPublishState("done");
          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }
          setPreviewUrl(null);
          setSelectedFile(null);
          setImageFocusY(28);
          setImageFitMode("cover");
          setVideoFocusY(28);
          setVideoDuration(0);
          setTrimStart(0);
          setTrimEnd(0);
          setCoverTime(0);
          setVideoMuted(false);
          setAssistantSuggestion(null);
          if (fileRef.current) {
            fileRef.current.value = "";
          }
          if (postStatus === "published") {
            router.push(originalFile?.type.startsWith("video/") ? "/shorts" : "/home");
          } else {
            router.refresh();
          }
        });
      }}
    >
      <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold">Create a post</p>
            <p className="mt-1 text-sm text-white/60">Write something, choose one photo or video, then publish.</p>
          </div>
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
        <div className="mt-4 grid gap-2 text-xs text-white/52 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">1. Write your post</div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">2. Add one photo or video</div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">3. Publish when the preview looks right</div>
        </div>
        <textarea
          className="mt-4 min-h-32 w-full max-w-full rounded-[24px] border border-white/10 bg-black/40 px-4 py-4 outline-none transition focus:border-accent"
          maxLength={500}
          name="body"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Start typing your post here. You can add a photo, video, or poll after."
          value={body}
        />
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
            className="hidden"
            onChange={async (event) => {
              setError(null);
              const file = event.target.files?.[0] ?? null;
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }
              setSelectedFile(file);
              setImageFocusY(28);
              setImageFitMode("cover");
              setVideoFocusY(28);
              setVideoDuration(0);
              setTrimStart(0);
              setTrimEnd(0);
              setCoverTime(0);
              setVideoMuted(false);
              setPreviewUrl(file ? URL.createObjectURL(file) : null);
              if (!file) {
                setAssistantSuggestion(null);
                return;
              }
              try {
                const suggestion = await suggestUploadAssistance(file, body);
                setAssistantSuggestion(suggestion);
                setImageFocusY(suggestion.suggestedFocusY);
                setVideoFocusY(suggestion.suggestedFocusY);
              } catch {
                setAssistantSuggestion(null);
              }
              if (file.type.startsWith("video/")) {
                const { duration } = await getVideoMetadata(file);
                const initialEnd = Math.min(duration, MAX_VIDEO_SECONDS);
                setVideoDuration(duration);
                setTrimStart(0);
                setTrimEnd(initialEnd);
                setCoverTime(Math.min(duration, Math.max(0, initialEnd / 3)));
              }
            }}
            ref={fileRef}
            type="file"
          />
          <div className="min-w-0 flex-1 rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white">Add photo or video</p>
                <p className="mt-1 text-sm text-white/55">
                  Pick one file. The preview below shows exactly what will post.
                </p>
                <p className="mt-2 truncate text-xs text-white/45">
                  {selectedFile ? `Selected: ${selectedFile.name}` : "No file selected"}
                </p>
              </div>
              <button
                className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/80 hover:bg-white/5"
                onClick={() => fileRef.current?.click()}
                type="button"
              >
                <ImagePlus className="h-4 w-4" />
                {selectedFile ? "Change file" : "Choose file"}
              </button>
            </div>
          </div>
          <button
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
            disabled={pending}
            type="submit"
          >
            {pending
              ? publishState === "uploading"
                ? "Uploading..."
                : publishState === "publishing"
                  ? "Publishing..."
                  : "Preparing..."
              : postStatus === "draft"
                ? "Save draft"
                : postStatus === "scheduled"
                  ? "Schedule"
                  : "Publish"}
          </button>
        </div>
        {pending || successMessage ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
            {pending
              ? publishState === "uploading"
                ? "Uploading your media now."
                : publishState === "publishing"
                  ? "Publishing your post now."
                  : "Preparing your post."
              : successMessage}
          </div>
        ) : null}
        {selectedFile && !pending && !successMessage ? (
          <div className="mt-4 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3 text-sm text-white/78">
            Ready to post. Check the preview, then tap
            {" "}
            <span className="font-semibold text-white">
              {postStatus === "draft" ? "Save draft" : postStatus === "scheduled" ? "Schedule" : "Publish"}
            </span>
            .
          </div>
        ) : null}
      </section>

      <section className="mt-4 rounded-[24px] border border-accent/15 bg-accent/5 p-4" id="ai-creation-tools" ref={aiToolsRef}>
        <div className="flex items-center gap-2 text-sm font-medium text-white">
          <Sparkles className="h-4 w-4 text-accent-soft" />
          AI creation tools
        </div>
        <p className="mt-2 text-sm text-white/60">
          Use these only if you want help rewriting text or generating an image concept.
        </p>
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
            <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] sm:aspect-[3/4]">
              <Image alt="Generated concept" className="media-image-focus" fill sizes="720px" src={generatedMedia[0].url} unoptimized />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-sm text-white/60">AI-generated concept attached to this post.</p>
              <button
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/70"
                onClick={() => {
                  setError(null);
                  setGeneratedMedia([]);
                }}
                type="button"
              >
                Remove
              </button>
            </div>
          </div>
        ) : null}
      </section>
      {assistantSuggestion ? (
        <section className="mt-4 rounded-[24px] border border-accent/15 bg-accent/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent-soft">Upload tips</p>
              <p className="mt-2 text-base font-semibold text-white">
                Best fit: {assistantSuggestion.recommendedMode}
              </p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/62">
              {assistantSuggestion.suggestedMood}
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Crop cue</p>
              <p className="mt-2 text-sm font-medium text-white">{assistantSuggestion.cropHint}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Posting tip</p>
              <p className="mt-2 text-sm font-medium text-white">{assistantSuggestion.formatHint}</p>
            </div>
          </div>
          {assistantSuggestion.suggestedTags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {assistantSuggestion.suggestedTags.map((tag) => (
                <button
                  className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/78"
                  key={tag}
                  onClick={() => setBody((current) => (current.includes(tag) ? current : `${current}${current.trim() ? " " : ""}${tag}`))}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>
          ) : null}
          <button
            className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
            onClick={() => {
              setImageFocusY(assistantSuggestion.suggestedFocusY);
              setVideoFocusY(assistantSuggestion.suggestedFocusY);
            }}
            type="button"
          >
            Use suggested framing
          </button>
        </section>
      ) : null}
        {previewUrl ? (
          <section className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-3">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[18px] bg-black sm:aspect-[3/4]">
              {isVideoFile ? (
              <video
                className="h-full w-full object-cover"
                controls
                muted={videoMuted}
                playsInline
                preload="metadata"
                src={previewUrl}
                style={{ objectPosition: `center ${videoFocusY}%` }}
              />
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Selected upload preview"
                  className={imageFitMode === "contain" ? "h-full w-full object-contain" : "h-full w-full object-cover"}
                  src={previewUrl}
                  style={{ objectPosition: `center ${imageFocusY}%` }}
                />
              </>
            )}
            </div>
          {!isVideoFile ? (
            <div className="mt-4">
              <div className="mb-3 flex flex-wrap gap-2">
                <button
                  className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                    imageFitMode === "cover" ? "bg-white text-black" : "bg-white/10 text-white/70"
                  }`}
                  onClick={() => setImageFitMode("cover")}
                  type="button"
                >
                  Fill frame
                </button>
                <button
                  className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                    imageFitMode === "contain" ? "bg-white text-black" : "bg-white/10 text-white/70"
                  }`}
                  onClick={() => setImageFitMode("contain")}
                  type="button"
                >
                  Show full photo
                </button>
              </div>
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/50">
                <span>Move photo up or down</span>
                <span>{Math.round(imageFocusY)}%</span>
              </div>
              <input
                className="w-full accent-red-500"
                max={100}
                min={0}
                onChange={(event) => setImageFocusY(Number(event.target.value))}
                step={1}
                type="range"
                value={imageFocusY}
              />
            </div>
          ) : null}
        </section>
      ) : null}
      {isVideoFile && previewUrl ? (
        <VideoEditorPanel
          aspectRatio={4 / 5}
          coverTime={coverTime}
          focusY={videoFocusY}
          muted={videoMuted}
          onCoverTimeChange={setCoverTime}
          onFocusYChange={setVideoFocusY}
          onMutedChange={setVideoMuted}
          onTrimEndChange={setTrimEnd}
          onTrimStartChange={setTrimStart}
          previewUrl={previewUrl}
          trimEnd={trimEnd}
          trimStart={trimStart}
          videoDuration={videoDuration}
        />
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <p className="mt-3 inline-flex items-center gap-2 text-xs text-white/45">
        <Clapperboard className="h-3.5 w-3.5" />
        Best results: one photo or one video under 60 seconds in `mp4`, `webm`, or `mov`.
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
    const { duration } = await getVideoMetadata(file);
    if (duration > MAX_VIDEO_SECONDS) {
      return "Short videos must be 60 seconds or less.";
    }
  }
  return null;
}

function shouldProcessVideoUpload({
  originalFile,
  trimEnd,
  trimStart,
  videoDuration,
  videoMuted
}: {
  originalFile: File;
  trimEnd: number;
  trimStart: number;
  videoDuration: number;
  videoMuted: boolean;
}) {
  if (videoMuted) {
    return true;
  }

  if (trimStart > 0.05) {
    return true;
  }

  if (videoDuration > 0 && trimEnd < videoDuration - 0.25) {
    return true;
  }

  return originalFile.type === "video/webm";
}
