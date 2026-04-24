"use client";

import { Camera, ImagePlus, StopCircle, Video, VideoOff, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { VideoEditorPanel } from "@/components/video-editor-panel";
import { processImageUpload } from "@/lib/media/image-framing";
import { suggestUploadAssistance, type UploadSuggestion } from "@/lib/media/upload-assistant";
import { getVideoMetadata, processVideoUpload } from "@/lib/media/video-editor";

type UploadedMedia = {
  storageKey: string;
  url: string;
  mimeType: string | null;
};

const imageFilters = [
  { id: "none", label: "Original", css: "none" },
  { id: "cinema", label: "Cinema", css: "contrast(1.08) saturate(1.12) brightness(0.96)" },
  { id: "glow", label: "Glow", css: "brightness(1.08) saturate(1.25) hue-rotate(-8deg)" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.1)" },
  { id: "crimson", label: "Crimson", css: "sepia(0.2) saturate(1.4) hue-rotate(-12deg) contrast(1.05)" }
] as const;

const videoPreviewFilters = [
  { id: "none", label: "Clean", css: "none" },
  { id: "night", label: "Night", css: "brightness(0.82) contrast(1.12) saturate(1.18)" },
  { id: "pop", label: "Pop", css: "saturate(1.35) contrast(1.08) brightness(1.04)" },
  { id: "mono", label: "Mono", css: "grayscale(1) contrast(1.12)" }
] as const;

const MAX_VIDEO_SECONDS = 60;

export function QuickUploadSheet({
  open,
  onClose,
  defaultMode = "post"
}: {
  open: boolean;
  onClose: () => void;
  defaultMode?: "post" | "story";
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [body, setBody] = useState("");
  const [publishMode, setPublishMode] = useState<"post" | "story">("post");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [videoFocusY, setVideoFocusY] = useState(28);
  const [coverTime, setCoverTime] = useState(0);
  const [videoMuted, setVideoMuted] = useState(false);
  const [imageFilter, setImageFilter] = useState<(typeof imageFilters)[number]["id"]>("none");
  const [imageFocusY, setImageFocusY] = useState(28);
  const [videoPreviewFilter, setVideoPreviewFilter] = useState<(typeof videoPreviewFilters)[number]["id"]>("none");
  const [assistantSuggestion, setAssistantSuggestion] = useState<UploadSuggestion | null>(null);
  const [panelActive, setPanelActive] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [publishState, setPublishState] = useState<"idle" | "preparing" | "uploading" | "publishing">("idle");

  const selectedFilter = imageFilters.find((filter) => filter.id === imageFilter) ?? imageFilters[0];
  const selectedVideoFilter =
    videoPreviewFilters.find((filter) => filter.id === videoPreviewFilter) ?? videoPreviewFilters[0];
  const isVideoFile = Boolean(selectedFile?.type.startsWith("video/"));
  const isImageFile = Boolean(selectedFile?.type.startsWith("image/"));
  const trimmedDuration = Math.max(0, trimEnd - trimStart);
  const videoAspectRatio = publishMode === "story" ? 9 / 16 : 4 / 5;

  useEffect(() => {
    if (!open) {
      setError(null);
      setPublishState("idle");
      setBody("");
      setPublishMode(defaultMode);
      void stopCamera();
      clearSelectedFile();
      resetMediaControls();
      setAssistantSuggestion(null);
    }
  }, [defaultMode, open]);

  useEffect(() => {
    if (open) {
      setPublishMode(defaultMode);
    }
  }, [defaultMode, open]);

  useEffect(() => {
    if (!open) {
      setPanelActive(false);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setPanelActive(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!cameraOpen || !cameraVideoRef.current || !cameraStreamRef.current) {
      return;
    }
    cameraVideoRef.current.srcObject = cameraStreamRef.current;
  }, [cameraOpen]);

  useEffect(() => {
    return () => {
      clearSelectedFile();
      void stopCamera();
    };
  }, []);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Close upload sheet"
        className={`overlay-backdrop absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          panelActive ? "opacity-100" : "opacity-0"
        }`}
        onClick={async () => {
          setPanelActive(false);
          await stopCamera();
          onClose();
        }}
        type="button"
      />
      <div
        className={`overlay-panel overlay-panel-ease absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[32px] p-5 ${
          panelActive ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.985] opacity-0"
        }`}
      >
        <div className="mx-auto h-1.5 w-14 rounded-full bg-white/15" />
        <div
          className={`mt-5 flex items-start justify-between gap-4 transition-all duration-500 delay-75 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            panelActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">
              {publishMode === "story" ? "Create story" : "Create post"}
            </p>
            <h3 className="mt-2 text-2xl font-semibold">
              {publishMode === "story" ? "Share a story fast" : "Post from anywhere"}
            </h3>
            <p className="mt-2 text-sm text-white/60">
              {publishMode === "story"
                ? "Choose one photo or video, check the preview, and publish it to stories."
                : "Choose one photo or short video, check the preview, and publish it here."}
            </p>
          </div>
          <button
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/65"
            onClick={async () => {
              setPanelActive(false);
              await stopCamera();
              onClose();
            }}
            type="button"
          >
            Close
          </button>
        </div>

        <div
          className={`mt-5 flex flex-wrap gap-2 transition-all duration-500 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            panelActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          {[
            { id: "post", label: "Post" },
            { id: "story", label: "Story" }
          ].map((option) => (
            <button
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
                publishMode === option.id ? "bg-white text-black" : "bg-white/8 text-white/70"
              }`}
              key={option.id}
              onClick={() => setPublishMode(option.id as "post" | "story")}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        <div
          className={`mt-4 grid gap-2 text-xs text-white/52 transition-all duration-500 delay-100 ease-[cubic-bezier(0.22,1,0.36,1)] md:grid-cols-3 ${
            panelActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">1. Choose media</div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">2. Check the preview</div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">3. Publish</div>
        </div>

        <textarea
          className={`mt-5 min-h-28 w-full rounded-[24px] border border-white/10 bg-black/40 px-4 py-4 outline-none transition-all duration-500 delay-150 ease-[cubic-bezier(0.22,1,0.36,1)] focus:border-accent ${
            panelActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
          maxLength={publishMode === "story" ? 280 : 500}
          onChange={(event) => setBody(event.target.value)}
          placeholder={
            publishMode === "story"
              ? "Say something quick, sharp, and worth tapping into..."
              : "Caption this drop, product moment, or short video..."
          }
          value={body}
        />

        <div
          className={`mt-4 grid gap-3 md:grid-cols-3 transition-all duration-500 delay-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            panelActive ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <button
            className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/85"
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <Video className="h-4 w-4 text-accent-soft" />
            Video
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/85"
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <ImagePlus className="h-4 w-4 text-accent-soft" />
            Photo
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/85"
            onClick={async () => {
              if (cameraOpen) {
                await stopCamera();
                return;
              }
              setError(null);
              try {
                const stream = await navigator.mediaDevices.getUserMedia({
                  audio: true,
                  video: { facingMode: "user" }
                });
                cameraStreamRef.current = stream;
                setCameraOpen(true);
                clearSelectedFile();
                resetMediaControls();
              } catch {
                setError("Camera access was blocked or not available on this device.");
              }
            }}
            type="button"
          >
            {cameraOpen ? <VideoOff className="h-4 w-4 text-accent-soft" /> : <Camera className="h-4 w-4 text-accent-soft" />}
            {cameraOpen ? "Close camera" : "Camera"}
          </button>
        </div>

        <input
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="mt-4 block w-full text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-black"
          onChange={async (event) => {
            setError(null);
            const file = event.target.files?.[0] ?? null;
            if (!file) {
              return;
            }
            await setSelectedFileWithPreview(file);
          }}
          ref={fileRef}
          type="file"
        />

        {cameraOpen ? (
          <section className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/60 p-3">
            <div className="relative aspect-[9/16] overflow-hidden rounded-[20px] bg-black">
              <video autoPlay className="h-full w-full object-cover" muted playsInline ref={cameraVideoRef} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {!recording ? (
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white"
                  onClick={() => startRecording()}
                  type="button"
                >
                  <Camera className="h-4 w-4" />
                  Start recording
                </button>
              ) : (
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                  onClick={() => stopRecording()}
                  type="button"
                >
                  <StopCircle className="h-4 w-4" />
                  Stop recording
                </button>
              )}
              <p className="text-xs text-white/50">Record up to 60 seconds using your camera and microphone.</p>
            </div>
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
                  style={{ filter: selectedVideoFilter.css, objectPosition: `center ${videoFocusY}%` }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt="Upload preview"
                  className="h-full w-full object-cover"
                  src={previewUrl}
                  style={{ filter: selectedFilter.css, objectPosition: `center ${imageFocusY}%` }}
                />
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{selectedFile?.name ?? "Selected media"}</p>
                <p className="text-xs text-white/50">{selectedFile?.type || "Ready to publish"}</p>
              </div>
              <button
                className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70"
                onClick={() => {
                  setError(null);
                  clearSelectedFile();
                  resetMediaControls();
                }}
                type="button"
              >
                Remove
              </button>
            </div>
          </section>
        ) : null}

        {assistantSuggestion ? (
          <section className="mt-4 rounded-[24px] border border-accent/15 bg-accent/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-accent-soft">Smart upload assistant</p>
              <p className="mt-2 text-base font-semibold text-white">
                  Best fit: {assistantSuggestion.recommendedMode}
              </p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/62">
                {assistantSuggestion.confidence} confidence
              </span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Mood</p>
                <p className="mt-2 text-sm font-medium text-white">{assistantSuggestion.suggestedMood}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">{assistantSuggestion.formatHint}</p>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/45">Crop cue</p>
                <p className="mt-2 text-sm font-medium text-white">{assistantSuggestion.cropHint}</p>
                <p className="mt-2 text-sm leading-6 text-white/62">Suggested focus: {Math.round(assistantSuggestion.suggestedFocusY)}%</p>
              </div>
            </div>
            {assistantSuggestion.suggestedTags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {assistantSuggestion.suggestedTags.map((tag) => (
                  <button
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs uppercase tracking-[0.14em] text-white/78"
                    key={tag}
                    onClick={() =>
                      setBody((current) => (current.includes(tag) ? current : `${current}${current.trim() ? " " : ""}${tag}`))
                    }
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black"
                onClick={() => {
                  setPublishMode(assistantSuggestion.recommendedMode);
                  setImageFocusY(assistantSuggestion.suggestedFocusY);
                  setVideoFocusY(assistantSuggestion.suggestedFocusY);
                }}
                type="button"
              >
                Apply suggestion
              </button>
              <button
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/72"
                onClick={() => setAssistantSuggestion(null)}
                type="button"
              >
                Dismiss
              </button>
            </div>
          </section>
        ) : null}

        {isImageFile ? (
          <section className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Wand2 className="h-4 w-4 text-accent-soft" />
              Photo framing
            </div>
            <p className="mt-2 text-sm text-white/55">
              {publishMode === "story"
                ? "Slide the image until the subject sits correctly in the story frame."
                : "Slide the photo until it looks right in the feed crop."}
            </p>
            <label className="mt-4 block">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/50">
                <span>Vertical position</span>
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
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              {imageFilters.map((filter) => (
                <button
                  className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em] ${
                    imageFilter === filter.id ? "border-accent bg-accent/15 text-accent-soft" : "border-white/10 text-white/60"
                  }`}
                  key={filter.id}
                  onClick={() => setImageFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {isVideoFile && previewUrl ? (
          <VideoEditorPanel
            aspectRatio={videoAspectRatio}
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

        {isVideoFile ? (
          <section className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Wand2 className="h-4 w-4 text-accent-soft" />
              Video look preview
            </div>
            <p className="mt-2 text-sm text-white/55">
              Preview the visual tone before posting. Export still uses the original video file.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {videoPreviewFilters.map((filter) => (
                <button
                  className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em] ${
                    videoPreviewFilter === filter.id ? "border-accent bg-accent/15 text-accent-soft" : "border-white/10 text-white/60"
                  }`}
                  key={filter.id}
                  onClick={() => setVideoPreviewFilter(filter.id)}
                  type="button"
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <p className="mt-3 text-xs text-white/45">
          {publishMode === "story"
            ? "Stories support one image or one video up to 60 seconds in `mp4`, `webm`, or `mov`."
            : "Videos: max 60 seconds, up to 50MB, `mp4`, `webm`, or `mov`."}
        </p>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        {pending ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/72">
            {publishState === "uploading"
              ? "Uploading your media now."
              : publishState === "publishing"
                ? "Publishing now."
              : "Preparing your upload."}
          </div>
        ) : null}
        {selectedFile && !pending ? (
          <div className="mt-3 rounded-2xl border border-accent/20 bg-accent/8 px-4 py-3 text-sm text-white/78">
            Ready to publish. If the preview looks right, tap
            {" "}
            <span className="font-semibold text-white">
              {publishMode === "story" ? "Publish story" : "Publish now"}
            </span>
            .
          </div>
        ) : null}

        <button
          className="mt-5 w-full rounded-[22px] bg-accent px-5 py-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              setPublishState("preparing");
              let file = selectedFile;
              const originalFile = selectedFile;
              if (!file && !body.trim()) {
                setError(
                  publishMode === "story"
                    ? "Add a caption or choose media before publishing the story."
                    : "Add a caption or choose media before posting."
                );
                setPublishState("idle");
                return;
              }

              if (file && isImageFile) {
                file = await processImageUpload(file, {
                  cssFilter: selectedFilter.css,
                  focusY: imageFocusY
                });
              }

              if (file && isVideoFile) {
                if (trimmedDuration <= 0) {
                  setError("Choose a valid video clip.");
                  setPublishState("idle");
                  return;
                }
                if (trimmedDuration > MAX_VIDEO_SECONDS) {
                  setError("Trim the video down to 60 seconds or less.");
                  setPublishState("idle");
                  return;
                }
                if (
                  shouldProcessVideoUpload({
                    originalFile: file,
                    trimEnd,
                    trimStart,
                    videoDuration,
                    videoMuted
                  })
                ) {
                  file = await processVideoUpload(file, {
                    aspectRatio: videoAspectRatio,
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

              let media: UploadedMedia[] = [];

              if (file) {
                const mediaValidationError = await validateMediaFile(file);
                if (mediaValidationError) {
                  setError(mediaValidationError);
                  setPublishState("idle");
                  return;
                }

                const upload = new FormData();
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
              }

              setPublishState("publishing");
              const response = await fetch(publishMode === "story" ? "/api/stories" : "/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  body,
                  media,
                  ...(publishMode === "story"
                    ? {
                        destinationPath: "/creator",
                        destinationLabel: "Create post"
                      }
                    : {
                        contentType: "standard",
                        status: "published"
                      })
                })
              });
              const payload = await response.json();
              if (!response.ok) {
                setError(payload.error ?? "Failed to publish.");
                setPublishState("idle");
                return;
              }

              setBody("");
              setPublishMode("post");
              setError(null);
              setPublishState("idle");
              clearSelectedFile();
              resetMediaControls();
              await stopCamera();
              onClose();
              router.push(publishMode === "story" ? "/home" : file?.type.startsWith("video/") ? "/shorts" : "/home");
              router.refresh();
            })
          }
          type="button"
        >
          {pending
            ? publishState === "uploading"
              ? "Uploading..."
              : publishState === "publishing"
                ? "Publishing..."
                : "Preparing..."
            : publishMode === "story"
              ? "Publish story"
              : "Publish now"}
        </button>
      </div>
    </div>
  );

  async function setSelectedFileWithPreview(file: File) {
    setError(null);
    clearSelectedFile();
    resetMediaControls();
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    try {
      const suggestion = await suggestUploadAssistance(file, body);
      setAssistantSuggestion(suggestion);
      setImageFocusY(suggestion.suggestedFocusY);
      setVideoFocusY(suggestion.suggestedFocusY);
      setPublishMode(suggestion.recommendedMode);
    } catch {
      setAssistantSuggestion(null);
    }
    if (file.type.startsWith("video/")) {
      const { duration } = await getVideoMetadata(file);
      setVideoDuration(duration);
      setTrimStart(0);
      const initialEnd = Math.min(duration, MAX_VIDEO_SECONDS);
      setTrimEnd(initialEnd);
      setCoverTime(Math.min(duration, Math.max(0, initialEnd / 3)));
    }
  }

  function resetMediaControls() {
    setImageFilter("none");
    setImageFocusY(28);
    setVideoPreviewFilter("none");
    setVideoDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
    setVideoFocusY(28);
    setCoverTime(0);
    setVideoMuted(false);
  }

  function clearSelectedFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    setAssistantSuggestion(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  }

  async function stopCamera() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (cameraStreamRef.current) {
      for (const track of cameraStreamRef.current.getTracks()) {
        track.stop();
      }
      cameraStreamRef.current = null;
    }
    if (cameraVideoRef.current) {
      cameraVideoRef.current.srcObject = null;
    }
    setRecording(false);
    setCameraOpen(false);
  }

  function startRecording() {
    if (!cameraStreamRef.current) {
      setError("Open the camera before recording.");
      return;
    }
    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    recordedChunksRef.current = [];
    const recorder = new MediaRecorder(cameraStreamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = async () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const file = new File([blob], `nubi-recording-${Date.now()}.webm`, { type: "video/webm" });
      await setSelectedFileWithPreview(file);
      await stopCamera();
    };
    recorder.start();
    setRecording(true);
    window.setTimeout(() => {
      if (recorder.state === "recording") {
        recorder.stop();
      }
    }, MAX_VIDEO_SECONDS * 1000);
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }
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
