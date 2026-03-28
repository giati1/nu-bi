import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { markNotificationsRead } from "@/lib/db/repository";

export async function POST() {
  try {
    const viewer = await requireViewer();
    await markNotificationsRead(viewer.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update notifications." },
      { status: 400 }
    );
  }
}
