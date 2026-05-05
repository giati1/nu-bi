export const videoDurations = [5, 8, 10] as const;
export const imageMotionPresets = [
  "Basic Motion",
  "Cinematic Push-In",
  "Street Movie Scene",
  "Luxury Promo",
  "Talking Character",
  "Product Ad",
  "Custom"
] as const;
export const personaReplyModes = ["text", "voice-note", "both"] as const;

export const aiPersonas = [
  {
    id: "EchoX1",
    name: "EchoX1",
    style: "sarcastic, gritty, funny, direct",
    summary: "Sharp delivery with edge, jokes, and blunt clarity."
  },
  {
    id: "EchoX2",
    name: "EchoX2",
    style: "polite, helpful, clean assistant",
    summary: "Calm, practical answers with a polished assistant tone."
  },
  {
    id: "EchoRaw",
    name: "EchoRaw",
    style: "calm, spiritual, reflective",
    summary: "Measured replies that feel reflective without losing usefulness."
  }
] as const;

export type VideoDuration = (typeof videoDurations)[number];
export type ImageMotionPreset = (typeof imageMotionPresets)[number];
export type PersonaId = (typeof aiPersonas)[number]["id"];
export type PersonaReplyMode = (typeof personaReplyModes)[number];
export type VideoGenerationMode = "text-to-video" | "image-to-video";
export type VideoJobStatus = "idle" | "queued" | "generating" | "processing" | "completed" | "failed";

export type VideoJobCreateResponse = {
  jobId: string;
  status: Extract<VideoJobStatus, "queued" | "generating">;
  message: string;
  detail: string;
  provider: string;
};

export type VideoJobResult = {
  title: string;
  aspectRatio: "9:16" | "16:9";
  posterImageUrl: string;
  previewMode: "placeholder" | "video";
  providerLabel: string;
  videoUrl: string | null;
  downloadUrl: string | null;
  storageKey: string | null;
  mimeType: string | null;
};

export type VideoJobStatusResponse = {
  jobId: string;
  status: Exclude<VideoJobStatus, "idle">;
  message: string;
  detail: string;
  provider: string;
  mode: VideoGenerationMode;
  result: VideoJobResult | null;
};
