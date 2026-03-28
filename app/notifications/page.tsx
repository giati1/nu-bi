import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { LiveRefresh } from "@/components/live-refresh";
import { requirePageViewer } from "@/lib/auth/session";
import { getNotifications, markNotificationsRead } from "@/lib/db/repository";
import { formatRelativeDate } from "@/lib/utils";

export default async function NotificationsPage() {
  const viewer = await requirePageViewer("/notifications");

  const notifications = await getNotifications(viewer.id);
  await markNotificationsRead(viewer.id);

  return (
    <AppShell
      subtitle="Likes, comments, follows, and messages all converge here with simple read-state support."
      title="Notifications"
    >
      <LiveRefresh intervalMs={12000} />
      {notifications.length === 0 ? (
        <EmptyState description="Activity will appear here as your graph grows." title="No notifications yet" />
      ) : (
        notifications.map((notification) => {
          const href =
            notification.entityType === "post" && notification.entityId
              ? `/post/${notification.entityId}`
              : notification.entityType === "conversation" && notification.entityId
                ? `/messages/${notification.entityId}`
                : notification.actor
                  ? `/profile/${notification.actor.username}`
                  : "#";

          return (
            <Link
              className="glass-panel flex items-center gap-4 rounded-[28px] p-5 shadow-panel"
              href={href}
              key={notification.id}
            >
              <Avatar
                className="h-12 w-12"
                name={notification.actor?.displayName ?? "NOMI"}
                src={notification.actor?.avatarUrl}
              />
              <div className="flex-1">
                <p className="text-white/85">
                  <span className="font-medium">{notification.actor?.displayName ?? "NOMI"}</span>{" "}
                  triggered a {notification.type}.
                </p>
                <p className="mt-1 text-sm text-white/45">{formatRelativeDate(notification.createdAt)}</p>
              </div>
              {!notification.readAt ? <span className="h-3 w-3 rounded-full bg-accent" /> : null}
            </Link>
          );
        })
      )}
    </AppShell>
  );
}
