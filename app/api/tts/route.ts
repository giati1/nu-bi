import { NextResponse } from "next/server";
import { z } from "zod";
import { generateTtsAudio } from "@/lib/ai-tools/tts-provider";
import { requireViewer } from "@/lib/auth/session";

const schema = z.object({
  text: z.string().trim().min(1).max(4096),
  voice: z.union([z.literal("EchoX1"), z.literal("EchoX2"), z.literal("EchoRaw")]),
  messageId: z.string().trim().optional().nullable()
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());
    const response = await generateTtsAudio(parsed);
    return NextResponse.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate TTS audio.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
