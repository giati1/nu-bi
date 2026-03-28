import { AppShell } from "@/components/app-shell";
import { NotificationSettingsForm } from "@/components/notification-settings-form";
import { requirePageViewer } from "@/lib/auth/session";
import { getNotificationPreferences } from "@/lib/db/repository";

export default async function NotificationSettingsPage() {
  const viewer = await requirePageViewer("/settings/notifications");

  const preferences = await getNotificationPreferences(viewer.id);

  return (
    <AppShell
      subtitle="Tune likes, comments, follows, messages, and quiet hours."
      title="Notification settings"
    >
      <NotificationSettingsForm initial={preferences} />
    </AppShell>
  );
}
