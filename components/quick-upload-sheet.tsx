"use client";

import { Camera, ImagePlus, Scissors, StopCircle, Video, VideoOff, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

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

export function QuickUploadSheet({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [body, setBody] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [imageFilter, setImageFilter] = useState<(typeof imageFilters)[number]["id"]>("none");
  const [videoPreviewFilter, setVideoPreviewFilter] = useState<(typeof videoPreviewFilters)[number]["id"]>("none");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const selectedFilter = imageFilters.find((filter) => filter.id === imageFilter) ?? imageFilters[0];
  const selectedVideoFilter =
    videoPreviewFilters.find((filter) => filter.id === videoPreviewFilter) ?? videoPreviewFilters[0];
  const isVideoFile = Boolean(selectedFile?.type.startsWith("video/"));
  const isImageFile = Boolean(selectedFile?.type.startsWith("image/"));
  const trimmedDuration = Math.max(0, trimEnd - trimStart);

  useEffect(() => {
    if (!open) {
      setError(null);
      setBody("");
      void stopCamera();
      clearSelectedFile();
      resetMediaControls();
    }
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={async () => {
          await stopCamera();
          onClose();
        }}
        type="button"
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[32px] border border-white/10 bg-[#090909] p-5 shadow-[0_-24px_80px_rgba(0,0,0,0.45)] animate-[slideUp_.24s_ease-out]">
        <div className="mx-auto h-1.5 w-14 rounded-full bg-white/15" />
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Quick upload</p>
            <h3 className="mt-2 text-2xl font-semibold">Post from anywhere</h3>
            <p className="mt-2 text-sm text-white/60">
              Add a short video or image without leaving the current page.
            </p>
          </div>
          <button
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/65"
            onClick={async () => {
              await stopCamera();
              onClose();
            }}
            type="button"
          >
            Close
          </button>
        </div>

        <textarea
          className="mt-5 min-h-28 w-full rounded-[24px] border border-white/10 bg-black/40 px-4 py-4 outline-none focus:border-accent"
          maxLength={500}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Caption this drop, product moment, or short video..."
          value={body}
        />

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <button
            className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/85"
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <Video className="h-4 w-4 text-accent-soft" />
            Choose short video
          </button>
          <button
            className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-white/85"
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <ImagePlus className="h-4 w-4 text-accent-soft" />
            Choose image
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
            {cameraOpen ? "Close camera" : "Record video"}
          </button>
        </div>

        <input
          accept="image/*,video/mp4,video/webm,video/quicktime"
          className="mt-4 block w-full text-sm text-white/60 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-black"
          onChange={async (event) => {
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
              <p className="text-xs text-white/50">Record up to 30 seconds using your camera and microphone.</p>
            </div>
          </section>
        ) : null}

        {previewUrl ? (
          <section className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[18px] bg-black">
              {isVideoFile ? (
                <video
                  className="h-full w-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                  src={previewUrl}
                  style={{ filter: selectedVideoFilter.css }}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="Upload preview" className="h-full w-full object-cover" src={previewUrl} style={{ filter: selectedFilter.css }} />
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

        {isImageFile ? (
          <section className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Wand2 className="h-4 w-4 text-accent-soft" />
              Photo filters
            </div>
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

        {isVideoFile ? (
          <section className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Scissors className="h-4 w-4 text-accent-soft" />
              Video trimmer
            </div>
            <p className="mt-2 text-sm text-white/55">
              Trim the start and end before publishing. Final clip must stay within 30 seconds.
            </p>
            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-white/45">
                <span>Timeline</span>
                <span>{videoDuration.toFixed(1)}s total</span>
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
            </div>
            <div className="mt-4 space-y-4">
              <label className="block">
                <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.14em] text-white/50">
                  <span>Start</span>
                  <span>{trimStart.toFixed(1)}s</span>
                </div>
                <input
                  className="w-full accent-red-500"
                  max={Math.max(0, trimEnd - 1)}
                  min={0}
                  onChange={(event) => setTrimStart(Number(event.target.value))}
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
                  min={Math.min(videoDuration, trimStart + 1)}
                  onChange={(event) => setTrimEnd(Number(event.target.value))}
                  step={0.1}
                  type="range"
                  value={trimEnd}
                />
              </label>
              <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
                Clip length: {trimmedDuration.toFixed(1)} seconds
              </div>
            </div>
          </section>
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
          Videos: max 30 seconds, up to 50MB, `mp4`, `webm`, or `mov`.
        </p>
        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}

        <button
          className="mt-5 w-full rounded-[22px] bg-accent px-5 py-4 text-sm font-semibold text-white disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              let file = selectedFile;
              if (!file && !body.trim()) {
                setError("Add a caption or choose media before posting.");
                return;
              }

              if (file && isImageFile && imageFilter !== "none") {
                file = await applyImageFilter(file, selectedFilter.css);
              }

              if (file && isVideoFile) {
                if (trimmedDuration <= 0) {
                  setError("Choose a valid video clip.");
                  return;
                }
                if (trimmedDuration > 30) {
                  setError("Trim the video down to 30 seconds or less.");
                  return;
                }
                if (trimStart > 0 || trimEnd < videoDuration) {
                  file = await trimVideoFile(file, trimStart, trimEnd);
                }
              }

              let media: UploadedMedia[] = [];

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
              }

              const response = await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  body,
                  media,
                  contentType: "standard",
                  status: "published"
                })
              });
              const payload = await response.json();
              if (!response.ok) {
                setError(payload.error ?? "Failed to publish.");
                return;
              }

              setBody("");
              clearSelectedFile();
              resetMediaControls();
              await stopCamera();
              onClose();
              router.push(file?.type.startsWith("video/") ? "/shorts" : "/home");
              router.refresh();
            })
          }
          type="button"
        >
          {pending ? "Publishing..." : "Publish now"}
        </button>
      </div>
    </div>
  );

  async function setSelectedFileWithPreview(file: File) {
    clearSelectedFile();
    resetMediaControls();
    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    if (file.type.startsWith("video/")) {
      const duration = await getVideoDuration(file);
      setVideoDuration(duration);
      setTrimStart(0);
      setTrimEnd(Math.min(duration, 30));
    }
  }

  function resetMediaControls() {
    setImageFilter("none");
    setVideoPreviewFilter("none");
    setVideoDuration(0);
    setTrimStart(0);
    setTrimEnd(0);
  }

  function clearSelectedFile() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
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
    }, 30000);
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

async function applyImageFilter(file: File, cssFilter: string) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      return file;
    }
    context.filter = cssFilter;
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) {
      return file;
    }
    return new File([blob], file.name.replace(/\.\w+$/, "") + "-filtered.jpg", {
      type: "image/jpeg"
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function trimVideoFile(file: File, start: number, end: number) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.src = objectUrl;
    video.muted = false;
    video.preload = "auto";
    await waitForEvent(video, "loadedmetadata");
    video.currentTime = Math.max(0, start);
    await waitForEvent(video, "seeked");

    const captureVideo = video as HTMLVideoElement & {
      captureStream?: () => MediaStream;
      mozCaptureStream?: () => MediaStream;
    };
    const stream =
      typeof captureVideo.captureStream === "function"
        ? captureVideo.captureStream()
        : typeof captureVideo.mozCaptureStream === "function"
          ? captureVideo.mozCaptureStream()
          : null;

    if (!stream) {
      return file;
    }

    const recorderMimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";
    const recorder = new MediaRecorder(stream, { mimeType: recorderMimeType });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    const done = new Promise<File>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" });
        resolve(new File([blob], file.name.replace(/\.\w+$/, "") + "-trimmed.webm", { type: "video/webm" }));
      };
    });

    recorder.start();
    await video.play();

    await new Promise<void>((resolve) => {
      const check = () => {
        if (video.currentTime >= end || video.ended) {
          resolve();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });

    video.pause();
    recorder.stop();
    return await done;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function waitForEvent(target: HTMLVideoElement, eventName: "loadedmetadata" | "seeked") {
  return new Promise<void>((resolve) => {
    const handler = () => {
      target.removeEventListener(eventName, handler);
      resolve();
    };
    target.addEventListener(eventName, handler);
  });
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load image."));
    image.src = src;
  });
}
