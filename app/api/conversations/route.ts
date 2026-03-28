import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { setConversationState } from "@/lib/db/repository";
import { conversationStateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = conversationStateSchema.parse(await request.json());
    await setConversationState({
      viewerId: viewer.id,
      conversationId: parsed.conversationId,
      isPinned: parsed.isPinned,
      isArchived: parsed.isArchived,
      isMuted: parsed.isMuted
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update conversation." }, { status: 400 });
  }
}
