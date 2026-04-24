import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

const builtInVoices = ["alloy", "ash", "ballad", "coral", "echo", "fable", "nova", "onyx", "sage", "shimmer", "verse", "marin", "cedar"] as const;

const schema = z.object({
  input: z.string().min(1).max(4096),
  voice: z.string().min(2).max(120),
  customVoiceId: z.string().min(4).max(160).optional().nullable(),
  instructions: z.string().max(400).optional().nullable()
});

export async function POST(request: Request) {
  try {
    await requireViewer();

    if (!env.openAiApiKey) {
      return NextResponse.json({ error: "AI voice is not configured." }, { status: 400 });
    }

    const parsed = schema.parse(await request.json());
    const useCustomVoice = parsed.voice === "custom" && parsed.customVoiceId?.trim();
    const voice = useCustomVoice
      ? { id: parsed.customVoiceId!.trim() }
      : builtInVoices.includes(parsed.voice as (typeof builtInVoices)[number])
        ? parsed.voice
        : "marin";

    const response = await fetch(`${env.openAiBaseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice,
        input: parsed.input,
        instructions: parsed.instructions ?? "Speak clearly, naturally, and like a helpful AI assistant.",
        response_format: "mp3"
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.text();
      return NextResponse.json({ error: payload || "Failed to generate speech." }, { status: 400 });
    }

    const audio = await response.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate speech." }, { status: 400 });
  }
}
