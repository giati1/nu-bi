"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { useState } from "react";
import { Bell, Bookmark, Clapperboard, Compass, House, LogOut, Menu, MessageCircle, Plus, Search, Sparkles, UserRoundCog, X } from "lucide-react";
import { ActivityAlerts, type ActivityToast } from "@/components/activity-alerts";
import { BrandMark } from "@/components/brand-mark";
import { QuickUploadSheet } from "@/components/quick-upload-sheet";
import { cn } from "@/lib/utils";

const desktopLinks = [
  { href: "/home", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/creator", label: "Create post", icon: Plus },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings/profile", label: "Profile", icon: UserRoundCog }
];

const desktopSecondaryLinks = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/ai", label: "AI Tools", icon: Sparkles }
];

const mobileMoreLinks = [
  { href: "/notifications", label: "Notifications", icon: Bell, badge: true },
  { href: "/creator", label: "Create post", icon: Plus },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/settings/profile", label: "Profile", icon: UserRoundCog },
  { href: "/ai", label: "AI tools", icon: Sparkles }
];

export function SiteNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [alerts, setAlerts] = useState<ActivityToast[]>([]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const dismissAlert = (id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id));
  };

  return (
    <>
      <ActivityAlerts alerts={alerts} onDismiss={dismissAlert} />
      <nav className="panel-soft edge-light hidden h-fit rounded-[32px] p-3 lg:block">
        <div className="rounded-[26px] border border-white/[0.08] bg-black/30 px-5 py-5">
          <BrandMark compact />
          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-accent/35 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-4 py-3 text-sm font-semibold text-white"
            onClick={() => setUploadOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Create post
          </button>
        </div>
        <div className="mt-4 space-y-1.5">
          <p className="px-4 pb-1 text-[11px] uppercase tracking-[0.2em] text-white/40">Main</p>
          {desktopLinks.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const badgeCount =
              href === "/messages"
                ? unreadMessageCount
                : href === "/notifications"
                  ? unreadNotificationCount
                  : 0;

            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-[22px] border px-4 py-3 text-sm transition",
                  active
                    ? "border-accent/45 bg-[linear-gradient(180deg,#f87171,#ef4444)] text-white shadow-[0_18px_36px_rgba(127,29,29,0.28)]"
                    : "border-transparent text-white/72 hover:border-accent/25 hover:bg-accent/10 hover:text-white"
                )}
                href={href}
                key={href}
              >
                <div className={cn("rounded-2xl p-2", active ? "bg-black/12" : "bg-white/[0.04]")}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex-1">{label}</span>
                {badgeCount > 0 ? <UnreadBadge count={badgeCount} /> : null}
              </Link>
            );
          })}
          <p className="px-4 pt-3 text-[11px] uppercase tracking-[0.2em] text-white/40">More</p>
          {desktopSecondaryLinks.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-[22px] border px-4 py-3 text-sm transition",
                  active
                    ? "border-accent/45 bg-[linear-gradient(180deg,#f87171,#ef4444)] text-white shadow-[0_18px_36px_rgba(127,29,29,0.28)]"
                    : "border-transparent text-white/72 hover:border-accent/25 hover:bg-accent/10 hover:text-white"
                )}
                href={href}
                key={href}
              >
                <div className={cn("rounded-2xl p-2", active ? "bg-black/12" : "bg-white/[0.04]")}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex-1">{label}</span>
              </Link>
            );
          })}
          <button
            className="mt-2 flex w-full items-center gap-3 rounded-[22px] border border-transparent px-4 py-3 text-sm text-white/72 transition hover:border-accent/25 hover:bg-accent/10 hover:text-white"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            type="button"
          >
            <div className="rounded-2xl bg-white/[0.04] p-2">
              <LogOut className="h-4 w-4" />
            </div>
            Log out
          </button>
        </div>
      </nav>

      <nav className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <div className="panel-soft edge-light rounded-[24px] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-5 gap-2">
            <MobileNavLink active={pathname === "/home" || pathname.startsWith("/home/")} href="/home" icon={House} label="Home" />
            <MobileNavLink active={pathname === "/shorts" || pathname.startsWith("/shorts/")} href="/shorts" icon={Clapperboard} label="Shorts" />
            <button
              className="flex flex-col items-center justify-center gap-1 rounded-[18px] border border-accent/35 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
              onClick={() => setUploadOpen(true)}
              type="button"
            >
              <Plus className="h-4 w-4" />
              <span>Create</span>
            </button>
            <MobileNavLink
              active={pathname === "/messages" || pathname.startsWith("/messages/")}
              badgeCount={unreadMessageCount}
              href="/messages"
              icon={MessageCircle}
              label="Inbox"
            />
            <button
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 rounded-[18px] px-3 py-3 text-[10px] font-medium uppercase tracking-[0.16em] transition",
                moreOpen ? "bg-[linear-gradient(180deg,#f87171,#ef4444)] text-white" : "text-white/80 hover:bg-accent/10 hover:text-white"
              )}
              onClick={() => setMoreOpen((value) => !value)}
              type="button"
            >
              {unreadNotificationCount > 0 ? <MobileDot /> : null}
              {moreOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span>More</span>
            </button>
          </div>
        </div>
      </nav>

      <QuickUploadSheet onClose={() => setUploadOpen(false)} open={uploadOpen} />
      <MobileMoreSheet
        open={moreOpen}
        pathname={pathname}
        unreadNotificationCount={unreadNotificationCount}
        onClose={() => setMoreOpen(false)}
      />
    </>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  active,
  badgeCount = 0
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  badgeCount?: number;
}) {
  return (
    <Link
      className={cn(
        "relative flex flex-col items-center justify-center gap-1 rounded-[18px] border px-3 py-3 text-[10px] font-medium uppercase tracking-[0.16em] transition",
        active
          ? "border-accent/45 bg-[linear-gradient(180deg,#f87171,#ef4444)] text-white"
          : "border-transparent text-white/80 hover:border-accent/25 hover:bg-accent/10 hover:text-white"
      )}
      href={href}
    >
      {badgeCount > 0 ? <MobileDot /> : null}
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function MobileMoreSheet({
  open,
  onClose,
  pathname,
  unreadNotificationCount
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
  unreadNotificationCount: number;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[70] transition",
        open ? "pointer-events-auto" : ""
      )}
    >
      <button
        aria-hidden={!open}
        className={cn(
          "absolute inset-0 bg-black/55 transition",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
        type="button"
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-24 mx-4 max-h-[calc(100vh-7.5rem)] overflow-hidden rounded-[30px] border border-accent/28 bg-[linear-gradient(180deg,rgba(10,10,10,0.98),rgba(8,8,8,0.995)),radial-gradient(circle_at_top_right,rgba(239,68,68,0.28),transparent_26%)] p-4 shadow-[0_24px_72px_rgba(0,0,0,0.58)] backdrop-blur-xl transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-[120%]"
        )}
      >
        <div className="flex max-h-[calc(100vh-9.5rem)] flex-col overflow-y-auto pr-1">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <BrandMark compact />
              <p className="mt-3 text-lg font-semibold text-white">More</p>
            </div>
            <button
              className="rounded-full border border-white/10 p-2 text-white/80"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-2">
            {mobileMoreLinks.map(({ href, label, icon: Icon, badge }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              const badgeCount = badge ? unreadNotificationCount : 0;

              return (
                <Link
                  className={cn(
                    "flex items-center gap-4 rounded-[22px] border px-4 py-4 transition",
                    active
                      ? "border-accent/45 bg-[linear-gradient(180deg,#f87171,#ef4444)] text-white"
                      : "border-white/10 bg-black/35 text-white/90 hover:border-accent/25 hover:bg-accent/10"
                  )}
                  href={href}
                  key={href}
                  onClick={onClose}
                >
                  <div className={cn("rounded-2xl p-3", active ? "bg-black/12" : "bg-white/5")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 font-medium">{label}</span>
                  {badgeCount > 0 ? <UnreadBadge count={badgeCount} compact /> : null}
                </Link>
              );
            })}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.02] p-2">
            <button
              className="flex w-full items-center gap-4 rounded-[20px] px-4 py-4 text-left text-white/90 transition hover:bg-white/5"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              type="button"
            >
              <div className="rounded-2xl bg-white/5 p-3">
                <LogOut className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium">Log out</p>
              </div>
            </button>
          </div>
  
          <div className="h-2 shrink-0" />
        </div>
      </div>
    </div>
  );
}

function UnreadBadge({ count, compact = false }: { count: number; compact?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white",
        compact ? "min-w-[1rem] px-1 py-0.5 text-[9px]" : ""
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function MobileDot() {
  return <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-accent" />;
}
