import { NextResponse } from "next/server";
import { z } from "zod";
import { createImageToVideoJob } from "@/lib/ai-tools/video-provider";
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
    const parsed = schema.parse(await request.json());
    const job = await createImageToVideoJob(parsed);
    return NextResponse.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue image-to-video generation.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
