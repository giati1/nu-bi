import { NextResponse } from "next/server";
import { z } from "zod";
import { generateVideoClip } from "@/lib/ai";
import { requireViewer } from "@/lib/auth/session";

const presetSchema = z.union([
  z.literal("Basic Motion"),
  z.literal("Cinematic Push-In"),
  z.literal("Street Movie Scene"),
  z.literal("Luxury Promo"),
  z.literal("Talking Character"),
  z.literal("Product Ad"),
  z.literal("Custom")
]);

const schema = z.object({
  imageName: z.string().trim().min(1).max(160),
  preset: presetSchema,
  customPrompt: z.string().trim().max(300).optional().default(""),
  durationSeconds: z.union([z.literal(5), z.literal(8), z.literal(10)])
});

export async function POST(request: Request) {
  try {
    await requireViewer();

    const formData = await request.formData();
    const parsed = schema.parse({
      imageName: formData.get("imageName"),
      preset: formData.get("preset"),
      customPrompt: formData.get("customPrompt"),
      durationSeconds: Number(formData.get("durationSeconds"))
    });

    const referenceImage = formData.get("referenceImage");
    if (!(referenceImage instanceof File) || referenceImage.size === 0) {
      throw new Error("Upload an image before starting image-to-video.");
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(referenceImage.type)) {
      throw new Error("Use a JPG, PNG, or WebP image as the video reference.");
    }

    const prompt = buildImageVideoPrompt({
      imageName: parsed.imageName,
      preset: parsed.preset,
      customPrompt: parsed.customPrompt
    });
    const seconds = normalizeDuration(parsed.durationSeconds);
    const size = parsed.preset === "Product Ad" || parsed.preset === "Luxury Promo" ? "1280x720" : "720x1280";
    const video = await generateVideoClip({
      prompt,
      style: parsed.preset,
      mood: "focused",
      seconds,
      size,
      referenceImage
    });

    return NextResponse.json({
      jobId: crypto.randomUUID(),
      status: "completed",
      message: "Video ready.",
      detail: `Your ${parsed.preset.toLowerCase()} render is ready to preview.`,
      provider: "openai-video",
      result: {
        title: `${parsed.imageName} - ${parsed.preset}`,
        aspectRatio: size === "1280x720" ? "16:9" : "9:16",
        posterImageUrl: video.thumbnailUrl ?? "",
        previewMode: "video",
        providerLabel: "OpenAI video",
        videoUrl: video.url,
        downloadUrl: video.url,
        storageKey: video.storageKey,
        mimeType: video.mimeType
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate image-to-video.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}

function normalizeDuration(durationSeconds: 5 | 8 | 10): "4" | "8" {
  return durationSeconds >= 8 ? "8" : "4";
}

function buildImageVideoPrompt(input: { imageName: string; preset: string; customPrompt: string }) {
  const presetPrompts: Record<string, string> = {
    "Basic Motion": "Add subtle subject motion and light camera drift while preserving the original look.",
    "Cinematic Push-In": "Add a smooth cinematic push-in with premium pacing and dramatic depth.",
    "Street Movie Scene": "Turn the still into an urban movie moment with environmental motion and grounded realism.",
    "Luxury Promo": "Turn the still into a polished luxury promo with controlled motion, highlights, and premium framing.",
    "Talking Character": "Animate the subject like a talking character with natural face and body motion.",
    "Product Ad": "Turn the still into a clean product ad with intentional movement and commercial polish.",
    Custom: input.customPrompt.trim() || "Animate the still with natural motion."
  };

  const customDirection = input.customPrompt.trim();
  return [
    `Use the uploaded image "${input.imageName}" as the visual anchor.`,
    presetPrompts[input.preset] ?? presetPrompts.Custom,
    customDirection && input.preset !== "Custom" ? `Additional direction: ${customDirection}` : ""
  ]
    .filter(Boolean)
    .join(" ");
}
