import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { createReport } from "@/lib/db/repository";
import { reportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = reportSchema.parse(await request.json());
    await createReport({
      reporterId: viewer.id,
      targetUserId: parsed.targetUserId,
      targetPostId: parsed.targetPostId,
      reason: parsed.reason,
      details: parsed.details
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit report." },
      { status: 400 }
    );
  }
}
