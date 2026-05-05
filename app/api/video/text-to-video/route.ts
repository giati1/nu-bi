import { NextResponse } from "next/server";
import { z } from "zod";
import { createTextToVideoJob } from "@/lib/ai-tools/video-provider";
import { requireViewer } from "@/lib/auth/session";

const schema = z.object({
  prompt: z.string().trim().min(8).max(800),
  durationSeconds: z.union([z.literal(5), z.literal(8), z.literal(10)])
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());
    const job = await createTextToVideoJob(parsed);
    return NextResponse.json(job);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue video generation.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
