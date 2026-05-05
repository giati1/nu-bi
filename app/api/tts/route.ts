import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

const schema = z.object({
  text: z.string().trim().min(1).max(4096),
  voice: z.union([z.literal("EchoX1"), z.literal("EchoX2"), z.literal("EchoRaw")]),
  messageId: z.string().trim().optional().nullable()
});

const voiceProfiles = {
  EchoX1: {
    voice: "onyx",
    instructions: "Speak with dry confidence, sharp timing, gritty humor, and direct delivery."
  },
  EchoX2: {
    voice: "marin",
    instructions: "Speak clearly, politely, naturally, and like a polished assistant."
  },
  EchoRaw: {
    voice: "sage",
    instructions: "Speak calmly, reflectively, and with a grounded spiritual tone."
  }
} as const;

export async function POST(request: Request) {
  try {
    await requireViewer();

    if (!env.openAiApiKey) {
      return NextResponse.json({ error: "AI voice is not configured." }, { status: 400 });
    }

    const parsed = schema.parse(await request.json());
    const voiceProfile = voiceProfiles[parsed.voice];

    const response = await fetch(`${env.openAiBaseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: voiceProfile.voice,
        input: parsed.text,
        instructions: voiceProfile.instructions,
        response_format: "mp3"
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.text();
      return NextResponse.json({ error: payload || "Failed to generate speech." }, { status: 400 });
    }

    const audio = Buffer.from(await response.arrayBuffer()).toString("base64");
    return NextResponse.json({
      audioUrl: `data:audio/mpeg;base64,${audio}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate TTS audio.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
