import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { toggleMuteUser } from "@/lib/db/repository";
import { relationshipSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = relationshipSchema.parse(await request.json());
    return NextResponse.json(await toggleMuteUser(parsed.targetUserId, viewer.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update mute state." }, { status: 400 });
  }
}
