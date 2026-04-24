import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { createStory } from "@/lib/db/repository";
import { storySchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = storySchema.parse(await request.json());
    const story = await createStory({
      userId: viewer.id,
      body: parsed.body.trim(),
      mediaUrl: parsed.media[0]?.url ?? null,
      destinationPath: parsed.destinationPath ?? "/creator",
      destinationLabel: parsed.destinationLabel ?? "Open creator",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    return NextResponse.json({ story });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create story." },
      { status: 400 }
    );
  }
}
