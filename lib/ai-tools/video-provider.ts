import type {
  ImageMotionPreset,
  VideoDuration,
  VideoGenerationMode,
  VideoJobCreateResponse,
  VideoJobResult,
  VideoJobStatus,
  VideoJobStatusResponse
} from "@/lib/ai-tools/contracts";

type EncodedVideoJob = {
  version: 1;
  createdAt: number;
  mode: VideoGenerationMode;
  durationSeconds: VideoDuration;
  title: string;
  preset: string | null;
  aspectRatio: "9:16" | "16:9";
  fail: boolean;
};

const providerName = "mock-video";

export async function createTextToVideoJob(input: {
  prompt: string;
  durationSeconds: VideoDuration;
}): Promise<VideoJobCreateResponse> {
  const trimmedPrompt = input.prompt.trim();
  const jobId = encodeVideoJob({
    version: 1,
    createdAt: Date.now(),
    mode: "text-to-video",
    durationSeconds: input.durationSeconds,
    title: trimmedPrompt,
    preset: null,
    aspectRatio: "9:16",
    fail: shouldForceFailure(trimmedPrompt)
  });

  return {
    jobId,
    status: "queued",
    message: "Generating your video...",
    detail: "Your video will appear here when it's ready.",
    provider: providerName
  };
}

export async function createImageToVideoJob(input: {
  imageName: string;
  preset: ImageMotionPreset;
  customPrompt?: string;
  durationSeconds: VideoDuration;
}): Promise<VideoJobCreateResponse> {
  const descriptor = input.customPrompt?.trim() || input.preset;
  const jobId = encodeVideoJob({
    version: 1,
    createdAt: Date.now(),
    mode: "image-to-video",
    durationSeconds: input.durationSeconds,
    title: `${input.imageName.trim() || "Uploaded image"} - ${descriptor}`,
    preset: input.preset,
    aspectRatio: input.preset === "Product Ad" || input.preset === "Luxury Promo" ? "16:9" : "9:16",
    fail: shouldForceFailure(descriptor)
  });

  return {
    jobId,
    status: "queued",
    message: "Generating your video...",
    detail: "Your video will appear here when it's ready.",
    provider: providerName
  };
}

export async function getVideoJobStatus(jobId: string): Promise<VideoJobStatusResponse> {
  const job = decodeVideoJob(jobId);
  const elapsedMs = Date.now() - job.createdAt;
  const status = resolveVideoStatus(job, elapsedMs);

  return {
    jobId,
    status,
    message: resolveVideoMessage(status),
    detail: resolveVideoDetail(job, status),
    provider: providerName,
    mode: job.mode,
    result: status === "completed" ? buildCompletedResult(job) : null
  };
}

function resolveVideoStatus(job: EncodedVideoJob, elapsedMs: number): Exclude<VideoJobStatus, "idle"> {
  if (job.fail && elapsedMs >= 6500) {
    return "failed";
  }
  if (elapsedMs < 1500) {
    return "queued";
  }
  if (elapsedMs < 5200) {
    return "generating";
  }
  if (elapsedMs < 8600) {
    return "processing";
  }
  return "completed";
}

function resolveVideoMessage(status: Exclude<VideoJobStatus, "idle">) {
  switch (status) {
    case "queued":
      return "Generating your video...";
    case "generating":
      return "Generating your video...";
    case "processing":
      return "Finishing your render...";
    case "completed":
      return "Video ready.";
    case "failed":
      return "Video generation failed.";
  }
}

function resolveVideoDetail(job: EncodedVideoJob, status: Exclude<VideoJobStatus, "idle">) {
  switch (status) {
    case "queued":
      return "Your video will appear here when it's ready.";
    case "generating":
      return job.mode === "image-to-video"
        ? "Applying motion, camera movement, and scene timing."
        : "Blocking the shot, movement, and pacing for mobile playback.";
    case "processing":
      return "Packaging preview assets and finalizing the card.";
    case "completed":
      return "This environment is using the mock provider abstraction. Wire a real provider later without changing the UI contract.";
    case "failed":
      return "Try a simpler prompt or remove fail-test keywords.";
  }
}

function buildCompletedResult(job: EncodedVideoJob): VideoJobResult {
  return {
    title: job.title,
    aspectRatio: job.aspectRatio,
    posterImageUrl: buildPosterDataUrl(job),
    previewMode: "placeholder",
    providerLabel: "Mock provider preview",
    videoUrl: null,
    downloadUrl: null,
    storageKey: null,
    mimeType: null
  };
}

function buildPosterDataUrl(job: EncodedVideoJob) {
  const label = escapeSvg(job.mode === "text-to-video" ? "TEXT TO VIDEO" : "IMAGE TO VIDEO");
  const preset = escapeSvg(job.preset ?? `${job.durationSeconds} second clip`);
  const title = escapeSvg(job.title.slice(0, 96));
  const size = job.aspectRatio === "16:9" ? { width: 1280, height: 720 } : { width: 900, height: 1600 };
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#050505" />
          <stop offset="55%" stop-color="#7f1d1d" />
          <stop offset="100%" stop-color="#120505" />
        </linearGradient>
        <radialGradient id="glow" cx="80%" cy="15%" r="40%">
          <stop offset="0%" stop-color="#ef4444" stop-opacity="0.75" />
          <stop offset="100%" stop-color="#ef4444" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="${size.width}" height="${size.height}" fill="url(#bg)" />
      <rect width="${size.width}" height="${size.height}" fill="url(#glow)" />
      <circle cx="${Math.floor(size.width * 0.22)}" cy="${Math.floor(size.height * 0.18)}" r="${Math.floor(size.width * 0.1)}" fill="#ffffff" fill-opacity="0.06" />
      <circle cx="${Math.floor(size.width * 0.76)}" cy="${Math.floor(size.height * 0.76)}" r="${Math.floor(size.width * 0.16)}" fill="#ef4444" fill-opacity="0.16" />
      <text x="72" y="96" fill="#fca5a5" font-size="34" font-family="Arial, sans-serif" letter-spacing="6">${label}</text>
      <text x="72" y="154" fill="#ffffff" font-size="82" font-family="Arial, sans-serif" font-weight="700">${title}</text>
      <text x="72" y="220" fill="#ffffff" fill-opacity="0.75" font-size="30" font-family="Arial, sans-serif">${preset}</text>
      <rect x="72" y="${size.height - 184}" width="${size.width - 144}" height="112" rx="28" fill="rgba(0,0,0,0.42)" stroke="rgba(255,255,255,0.14)" />
      <text x="112" y="${size.height - 118}" fill="#ffffff" font-size="32" font-family="Arial, sans-serif">Preview placeholder - connect provider for rendered video output</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function shouldForceFailure(value: string) {
  const normalized = value.toLowerCase();
  return normalized.includes("[fail]") || normalized.includes("fail-test");
}

function encodeVideoJob(job: EncodedVideoJob) {
  return Buffer.from(JSON.stringify(job), "utf8").toString("base64url");
}

function decodeVideoJob(token: string): EncodedVideoJob {
  try {
    const decoded = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as Partial<EncodedVideoJob>;
    if (
      decoded.version !== 1 ||
      typeof decoded.createdAt !== "number" ||
      (decoded.mode !== "text-to-video" && decoded.mode !== "image-to-video") ||
      (decoded.durationSeconds !== 5 && decoded.durationSeconds !== 8 && decoded.durationSeconds !== 10) ||
      typeof decoded.title !== "string" ||
      (decoded.aspectRatio !== "9:16" && decoded.aspectRatio !== "16:9") ||
      typeof decoded.fail !== "boolean"
    ) {
      throw new Error("Invalid job payload.");
    }

    return {
      version: 1,
      createdAt: decoded.createdAt,
      mode: decoded.mode,
      durationSeconds: decoded.durationSeconds,
      title: decoded.title,
      preset: typeof decoded.preset === "string" ? decoded.preset : null,
      aspectRatio: decoded.aspectRatio,
      fail: decoded.fail
    };
  } catch {
    throw new Error("Invalid video job id.");
  }
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
