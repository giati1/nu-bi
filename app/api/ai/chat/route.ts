import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { getAIAdapter } from "@/lib/ai";

const schema = z.object({
  body: z.string().min(1).max(4000),
  mood: z.string().min(2).max(40).optional()
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());
    const reply = await getAIAdapter().suggestReply({
      body: parsed.body,
      intent: "assistant",
      mood: parsed.mood ?? "warm"
    });
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to chat." }, { status: 400 });
  }
}
