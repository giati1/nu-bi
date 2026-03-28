import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { getNotificationPreferences, updateNotificationPreferences } from "@/lib/db/repository";
import { notificationPreferencesSchema } from "@/lib/validators";

export async function GET() {
  try {
    const viewer = await requireViewer();
    return NextResponse.json(await getNotificationPreferences(viewer.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load preferences." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = notificationPreferencesSchema.parse(await request.json());
    await updateNotificationPreferences(viewer.id, parsed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save preferences." }, { status: 400 });
  }
}
