import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { LiveRefresh } from "@/components/live-refresh";
import { requirePageViewer } from "@/lib/auth/session";
import { getNotifications, markNotificationsRead } from "@/lib/db/repository";
import {
  getNotificationDetail,
  getNotificationHref,
  getNotificationTitle
} from "@/lib/notifications/presenter";
import { formatRelativeDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const viewer = await requirePageViewer("/notifications");

  const notifications = await getNotifications(viewer.id);
  await markNotificationsRead(viewer.id);

  return (
    <AppShell
      subtitle="Likes, comments, follows, and messages show up here."
      title="Notifications"
    >
      <LiveRefresh intervalMs={12000} />
      {notifications.length === 0 ? (
        <EmptyState description="Activity will appear here as people interact with you." title="No notifications yet" />
      ) : (
        notifications.map((notification) => {
          return (
            <Link
              className="glass-panel flex items-center gap-4 rounded-[28px] p-5 shadow-panel"
              href={getNotificationHref(notification)}
              key={notification.id}
            >
              <Avatar
                className="h-12 w-12"
                name={notification.actor?.displayName ?? "NU-BI"}
                src={notification.actor?.avatarUrl}
              />
              <div className="flex-1">
                <p className="text-white/85">
                  {getNotificationTitle(notification)}
                </p>
                <p className="mt-1 text-sm text-white/62">{getNotificationDetail(notification)}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/45">{formatRelativeDate(notification.createdAt)}</p>
              </div>
              {!notification.readAt ? <span className="h-3 w-3 rounded-full bg-accent" /> : null}
            </Link>
          );
        })
      )}
    </AppShell>
  );
}
