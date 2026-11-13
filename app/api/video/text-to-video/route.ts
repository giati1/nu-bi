import { NextResponse } from "next/server";
import { z } from "zod";
import { generateVideoClip } from "@/lib/ai";
import { requireViewer } from "@/lib/auth/session";

const schema = z.object({
  prompt: z.string().trim().min(8).max(800),
  durationSeconds: z.union([z.literal(5), z.literal(8), z.literal(10)])
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());
    const seconds = normalizeDuration(parsed.durationSeconds);
    const video = await generateVideoClip({
      prompt: parsed.prompt,
      style: "cinematic social launch",
      mood: "focused",
      seconds,
      size: "720x1280",
      referenceImage: null
    });

    return NextResponse.json({
      jobId: crypto.randomUUID(),
      status: "completed",
      message: "Video ready.",
      detail: `Your ${parsed.durationSeconds}-second video is ready to preview.`,
      provider: "openai-video",
      result: {
        title: parsed.prompt,
        aspectRatio: "9:16",
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
    const message = error instanceof Error ? error.message : "Failed to generate video.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}

function normalizeDuration(durationSeconds: 5 | 8 | 10): "4" | "8" {
  return durationSeconds >= 8 ? "8" : "4";
}
