import { NextResponse } from "next/server";
import { z } from "zod";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { requireViewer } from "@/lib/auth/session";
import { setUserEngagementOverride } from "@/lib/db/repository";

const schema = z.object({
  userId: z.string().uuid(),
  likeCount: z.coerce.number().int().min(0).max(100000000),
  viewCount: z.coerce.number().int().min(0).max(100000000)
});

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    if (!isInternalAdminUsername(viewer.username)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const parsed = schema.parse(await request.json());
    await setUserEngagementOverride(parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile engagement." },
      { status: 400 }
    );
  }
}
