import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { toggleMessageReaction } from "@/lib/db/repository";
import { messageReactionSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = messageReactionSchema.parse(await request.json());
    return NextResponse.json(await toggleMessageReaction(parsed.messageId, viewer.id, parsed.emoji));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to react." }, { status: 400 });
  }
}
