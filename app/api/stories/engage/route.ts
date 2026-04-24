import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { createStoryEngagement } from "@/lib/db/repository";
import { storyEngagementSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = storyEngagementSchema.parse(await request.json());
    await createStoryEngagement({
      storyId: parsed.storyId,
      viewerId: viewer.id,
      kind: parsed.kind,
      emoji: parsed.emoji ?? null,
      body: parsed.body ?? null,
      media: parsed.media
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save story engagement." },
      { status: 400 }
    );
  }
}
