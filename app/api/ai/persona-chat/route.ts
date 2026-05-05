import { NextResponse } from "next/server";
import { z } from "zod";
import { generatePersonaReply } from "@/lib/ai-tools/persona-provider";
import { requireViewer } from "@/lib/auth/session";

const schema = z.object({
  personaId: z.union([z.literal("EchoX1"), z.literal("EchoX2"), z.literal("EchoRaw")]),
  message: z.string().trim().min(1).max(3000),
  history: z.array(
    z.object({
      role: z.union([z.literal("user"), z.literal("assistant")]),
      body: z.string().trim().min(1).max(3000)
    })
  ).max(10).default([])
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());
    const reply = await generatePersonaReply(parsed);
    return NextResponse.json(reply);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate persona reply.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
