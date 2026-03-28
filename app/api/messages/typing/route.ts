import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { getConversationTypingState, setConversationTypingState } from "@/lib/db/repository";

const schema = z.object({
  conversationId: z.string().uuid(),
  isTyping: z.boolean().optional()
});

export async function GET(request: Request) {
  try {
    const viewer = await requireViewer();
    const { searchParams } = new URL(request.url);
    const parsed = schema.parse({
      conversationId: searchParams.get("conversationId")
    });
    const state = await getConversationTypingState(parsed.conversationId, viewer.id);
    return NextResponse.json({ state });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load typing state." },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = schema.parse(await request.json());
    await setConversationTypingState({
      conversationId: parsed.conversationId,
      viewerId: viewer.id,
      isTyping: parsed.isTyping ?? false
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update typing state." },
      { status: 400 }
    );
  }
}
