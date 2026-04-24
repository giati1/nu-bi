import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { markStorySeen } from "@/lib/db/repository";
import { storySeenSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = storySeenSchema.parse(await request.json());
    await markStorySeen({
      storyId: parsed.storyId,
      viewerId: viewer.id
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to mark story as seen." },
      { status: 400 }
    );
  }
}
