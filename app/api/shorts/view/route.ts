import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { recordPostView } from "@/lib/db/repository";

const schema = z.object({
  postId: z.string().uuid(),
  context: z.string().min(2).max(30).default("shorts")
});

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = schema.parse(await request.json());
    const result = await recordPostView({
      postId: parsed.postId,
      viewerId: viewer.id,
      context: parsed.context
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to record view." },
      { status: 400 }
    );
  }
}
