import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProfileEditor } from "@/components/profile-editor";
import { requirePageViewer } from "@/lib/auth/session";

export default async function SettingsProfilePage() {
  const viewer = await requirePageViewer("/settings/profile");

  return (
    <AppShell
      subtitle="Update identity, avatar, bio, and profile metadata without breaking feed or message references."
      title="Profile settings"
    >
      <Link className="inline-flex rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70" href="/settings/notifications">
        Manage notification settings
      </Link>
      <ProfileEditor
        profile={{
          username: viewer.username,
          displayName: viewer.displayName,
          bio: viewer.bio ?? "",
          website: viewer.website,
          location: viewer.location,
          avatarUrl: viewer.avatarUrl,
          isPrivate: Boolean(viewer.isPrivate)
        }}
      />
    </AppShell>
  );
}
