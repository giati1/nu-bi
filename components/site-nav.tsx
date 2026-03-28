"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType } from "react";
import { useState } from "react";
import {
  Bell,
  Bookmark,
  Clapperboard,
  Compass,
  House,
  LogOut,
  Menu,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  UserRoundCog,
  BarChart3,
  X
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { QuickUploadSheet } from "@/components/quick-upload-sheet";
import { cn } from "@/lib/utils";

const desktopLinks = [
  { href: "/home", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/search", label: "Search", icon: Search },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Alerts", icon: Bell },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/creator", label: "Creator", icon: BarChart3 },
  { href: "/ai", label: "AI Studio", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: UserRoundCog }
];

const mobileMoreLinks = [
  { href: "/explore", label: "Explore", description: "Find new people and posts", icon: Compass },
  { href: "/search", label: "Search", description: "Search users, posts, and tags", icon: Search },
  { href: "/notifications", label: "Alerts", description: "Notifications and updates", icon: Bell },
  { href: "/saved", label: "Saved", description: "Your saved references", icon: Bookmark },
  { href: "/creator", label: "Creator", description: "Drafts, insights, and media", icon: BarChart3 },
  { href: "/ai", label: "AI Studio", description: "Captions, replies, and visuals", icon: Sparkles },
  { href: "/settings", label: "Settings", description: "Profile and app controls", icon: UserRoundCog }
];

export function SiteNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <>
      <nav className="glass-panel hidden h-fit rounded-[28px] p-3 lg:block">
        <div className="rounded-[22px] border border-accent/20 bg-mesh-red px-5 py-6">
          <BrandMark />
          <h1 className="mt-5 text-3xl font-bold">Signal-first identity.</h1>
          <p className="mt-2 text-sm text-white/65">
            NU-BI brings feed, shorts, messages, creator tools, and AI into one social layer.
          </p>
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black"
            onClick={() => setUploadOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Quick upload
          </button>
        </div>
        <div className="mt-4 space-y-1">
          {desktopLinks.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                  active ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
                href={href}
                key={href}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
          <button
            className="mt-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            type="button"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </nav>

      <nav className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <div className="glass-panel rounded-[30px] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.3)]">
          <div className="grid grid-cols-5 gap-2">
            <MobileNavLink active={pathname === "/home" || pathname.startsWith("/home/")} href="/home" icon={House} label="Home" />
            <MobileNavLink active={pathname === "/shorts" || pathname.startsWith("/shorts/")} href="/shorts" icon={Clapperboard} label="Shorts" />
            <button
              className="flex flex-col items-center justify-center gap-1 rounded-[22px] bg-accent px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_12px_28px_rgba(239,68,68,0.35)]"
              onClick={() => setUploadOpen(true)}
              type="button"
            >
              <Plus className="h-5 w-5" />
              <span>Upload</span>
            </button>
            <MobileNavLink active={pathname === "/messages" || pathname.startsWith("/messages/")} href="/messages" icon={MessageCircle} label="Inbox" />
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-[22px] px-3 py-3 text-[10px] font-medium uppercase tracking-[0.16em] transition",
                moreOpen ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
              onClick={() => setMoreOpen((value) => !value)}
              type="button"
            >
              {moreOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              <span>More</span>
            </button>
          </div>
        </div>
      </nav>

      <QuickUploadSheet onClose={() => setUploadOpen(false)} open={uploadOpen} />
      <MobileMoreSheet open={moreOpen} pathname={pathname} onClose={() => setMoreOpen(false)} />
    </>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  active
}: {
  href: string;
  icon: ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      className={cn(
        "flex flex-col items-center justify-center gap-1 rounded-[22px] px-3 py-3 text-[10px] font-medium uppercase tracking-[0.16em] transition",
        active ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white"
      )}
      href={href}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </Link>
  );
}

function MobileMoreSheet({
  open,
  onClose,
  pathname
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
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
          "absolute inset-x-0 bottom-24 mx-4 rounded-[30px] border border-white/10 bg-[#090909] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-[120%]"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <BrandMark compact />
          <button
            className="rounded-full border border-white/10 p-2 text-white/70"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {mobileMoreLinks.map(({ href, label, description, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                className={cn(
                  "flex items-center gap-4 rounded-[24px] px-4 py-4 transition",
                  active ? "bg-white text-black" : "bg-white/[0.03] text-white/82 hover:bg-white/5"
                )}
                href={href}
                key={href}
                onClick={onClose}
              >
                <div className={cn("rounded-2xl p-3", active ? "bg-black/10" : "bg-white/5")}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium">{label}</p>
                  <p className={cn("text-sm", active ? "text-black/60" : "text-white/50")}>{description}</p>
                </div>
              </Link>
            );
          })}
          <button
            className="flex w-full items-center gap-4 rounded-[24px] bg-white/[0.03] px-4 py-4 text-left text-white/82 hover:bg-white/5"
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
              <p className="text-sm text-white/50">End this session</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
