import Link from "next/link";
import { Bell, Bookmark, Sparkles, UserRoundCog } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requirePageViewer } from "@/lib/auth/session";

const items = [
  {
    href: "/settings/profile",
    title: "Profile",
    description: "Update identity, avatar, bio, links, and profile posture.",
    icon: UserRoundCog
  },
  {
    href: "/settings/notifications",
    title: "Notifications",
    description: "Control likes, comments, follows, messages, and quiet hours.",
    icon: Bell
  },
  {
    href: "/saved",
    title: "Saved Posts",
    description: "Review saved inspiration, research, and creator references.",
    icon: Bookmark
  },
  {
    href: "/ai",
    title: "AI Studio",
    description: "Check provider status, generate visuals, and use caption or reply tools.",
    icon: Sparkles
  }
];

export default async function SettingsPage() {
  const viewer = await requirePageViewer("/settings");

  return (
    <AppShell
      title="Settings"
      subtitle="Core controls for identity, notifications, and account-level product behavior."
    >
      <div className="grid gap-4">
        {items.map(({ href, title, description, icon: Icon }) => (
          <Link
            className="glass-panel flex items-center gap-4 rounded-[28px] p-5 shadow-panel"
            href={href}
            key={href}
          >
            <div className="rounded-2xl bg-white/10 p-3">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-sm text-white/60">{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
