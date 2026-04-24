export type UploadSuggestion = {
  recommendedMode: "post" | "story";
  suggestedMood: "Bold" | "Soft" | "Late Night" | "Locked In";
  suggestedFocusY: number;
  suggestedTags: string[];
  cropHint: string;
  formatHint: string;
  confidence: "High" | "Medium";
};

export async function suggestUploadAssistance(
  file: File,
  caption: string
): Promise<UploadSuggestion> {
  const lowerCaption = caption.toLowerCase();
  const tokens = tokenize(`${caption} ${file.name}`);
  const isVideo = file.type.startsWith("video/");
  const metrics = isVideo ? await readVideoMetrics(file) : await readImageMetrics(file);
  const aspectRatio = metrics.width > 0 && metrics.height > 0 ? metrics.width / metrics.height : 1;
  const portrait = metrics.height > metrics.width;

  let suggestedMood: UploadSuggestion["suggestedMood"] = "Bold";
  let recommendedMode: UploadSuggestion["recommendedMode"] = isVideo ? "story" : "post";
  let suggestedFocusY = portrait ? 24 : 32;
  let cropHint = portrait
    ? "Portrait detected. Keep the face slightly above center."
    : "Landscape detected. Keep the subject centered to avoid edge crop.";
  let formatHint = isVideo
    ? "Motion-heavy clips usually hit harder in stories first."
    : "Still image looks strong in the feed with a tighter crop.";

  if (matches(tokens, ["night", "late", "midnight", "afterdark", "voice", "mood"])) {
    suggestedMood = "Late Night";
    recommendedMode = "story";
    suggestedFocusY = portrait ? 22 : 30;
    formatHint = isVideo
      ? "Late-night energy is strongest in stories and short replies."
      : "Night shots read better with a story-first treatment.";
  } else if (matches(tokens, ["build", "focus", "studio", "work", "create", "ship"])) {
    suggestedMood = "Locked In";
    recommendedMode = "post";
    suggestedFocusY = portrait ? 26 : 34;
    formatHint = "Process and build updates tend to hold better as feed posts.";
  } else if (matches(tokens, ["soft", "calm", "cozy", "love", "portrait", "morning"])) {
    suggestedMood = "Soft";
    recommendedMode = portrait ? "story" : "post";
    suggestedFocusY = 20;
    formatHint = "Portrait and softer content benefits from a gentler crop and lighter caption.";
  }

  if (isVideo && metrics.duration >= 12) {
    recommendedMode = "story";
  }
  if (!isVideo && !portrait) {
    recommendedMode = "post";
  }

  const suggestedTags = Array.from(
    new Set([
      ...extractKnownTags(tokens),
      ...(suggestedMood === "Bold" ? ["#drop", "#now"] : []),
      ...(suggestedMood === "Soft" ? ["#soft", "#portrait"] : []),
      ...(suggestedMood === "Late Night" ? ["#night", "#mood"] : []),
      ...(suggestedMood === "Locked In" ? ["#build", "#studio"] : [])
    ])
  ).slice(0, 4);

  return {
    recommendedMode,
    suggestedMood,
    suggestedFocusY,
    suggestedTags,
    cropHint,
    formatHint,
    confidence: suggestedTags.length >= 2 ? "High" : "Medium"
  };
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9#]+/)
    .filter(Boolean);
}

function matches(tokens: string[], values: string[]) {
  return values.some((value) => tokens.includes(value));
}

function extractKnownTags(tokens: string[]) {
  const tagMap = new Map<string, string>([
    ["fashion", "#fashion"],
    ["fit", "#fit"],
    ["style", "#style"],
    ["night", "#night"],
    ["music", "#music"],
    ["build", "#build"],
    ["creator", "#creator"],
    ["studio", "#studio"],
    ["portrait", "#portrait"],
    ["vlog", "#vlog"],
    ["launch", "#launch"],
    ["drop", "#drop"]
  ]);

  return tokens.map((token) => tagMap.get(token)).filter((value): value is string => Boolean(value));
}

function readImageMetrics(file: File) {
  return new Promise<{ width: number; height: number; duration: number }>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
        duration: 0
      });
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0, duration: 0 });
    };
    image.src = objectUrl;
  });
}

function readVideoMetrics(file: File) {
  return new Promise<{ width: number; height: number; duration: number }>((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : 0
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ width: 0, height: 0, duration: 0 });
    };
    video.src = objectUrl;
  });
}
