import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { getActivitySummary, markNotificationsRead } from "@/lib/db/repository";
import {
  getNotificationDetail,
  getNotificationHref,
  getNotificationTitle
} from "@/lib/notifications/presenter";

export async function GET() {
  try {
    const viewer = await requireViewer();
    const summary = await getActivitySummary(viewer.id);

    return NextResponse.json({
      unreadNotificationCount: summary.unreadNotificationCount,
      unreadMessageCount: summary.unreadMessageCount,
      items: summary.notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        createdAt: notification.createdAt,
        readAt: notification.readAt,
        href: getNotificationHref(notification),
        title: getNotificationTitle(notification),
        detail: getNotificationDetail(notification),
        actorAvatarUrl: notification.actor?.avatarUrl ?? null
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load notifications." },
      { status: 400 }
    );
  }
}

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
