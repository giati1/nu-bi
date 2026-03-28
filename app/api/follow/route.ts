import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { toggleFollow } from "@/lib/db/repository";
import { followSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = followSchema.parse(await request.json());
    const result = await toggleFollow(parsed.targetUserId, viewer.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to follow user." },
      { status: 400 }
    );
  }
}
