import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProfileEditor } from "@/components/profile-editor";
import { requirePageViewer } from "@/lib/auth/session";

export default async function SettingsProfilePage() {
  const viewer = await requirePageViewer("/settings/profile");

  return (
    <AppShell
      subtitle="Set the basics people need first: photo, name, bio, and one clear way to understand who you are."
      title="Profile settings"
    >
      <div className="flex flex-wrap gap-3">
        <Link className="inline-flex rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70" href="/settings/notifications">
          Manage notification settings
        </Link>
        <Link className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black" href="/creator">
          Create a post
        </Link>
      </div>
      <ProfileEditor
        profile={{
          username: viewer.username,
          displayName: viewer.displayName,
          bio: viewer.bio ?? "",
          website: viewer.website,
          location: viewer.location,
          avatarUrl: viewer.avatarUrl,
          voiceIntroUrl: viewer.voiceIntroUrl ?? null,
          voiceIntroMimeType: viewer.voiceIntroMimeType ?? null,
          isPrivate: Boolean(viewer.isPrivate)
        }}
      />
    </AppShell>
  );
}
