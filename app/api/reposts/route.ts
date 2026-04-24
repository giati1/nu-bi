import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { toggleRepost } from "@/lib/db/repository";
import { repostSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = repostSchema.parse(await request.json());
    const result = await toggleRepost(parsed.postId, viewer.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update repost." },
      { status: 400 }
    );
  }
}
