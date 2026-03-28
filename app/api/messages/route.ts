import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { sendMessage } from "@/lib/db/repository";
import { messageSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = messageSchema.parse(await request.json());
    const result = await sendMessage({
      senderId: viewer.id,
      conversationId: parsed.conversationId,
      recipientId: parsed.recipientId,
      body: parsed.body,
      replyToMessageId: parsed.replyToMessageId ?? null,
      media: parsed.media
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message." },
      { status: 400 }
    );
  }
}
