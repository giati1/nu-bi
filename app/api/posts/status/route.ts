import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { updatePostStatus } from "@/lib/db/repository";
import { z } from "zod";

const schema = z.object({
  postId: z.string().uuid(),
  status: z.enum(["published", "draft", "scheduled"]),
  scheduledFor: z.string().nullable().optional()
});

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = schema.parse(await request.json());
    await updatePostStatus({
      postId: parsed.postId,
      viewerId: viewer.id,
      status: parsed.status,
      scheduledFor: parsed.scheduledFor ?? null,
      canUpdateAnyPost: isInternalAdminUsername(viewer.username)
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to update post state." }, { status: 400 });
  }
}
