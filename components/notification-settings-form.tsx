"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, MonitorSmartphone, ShieldAlert } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import type { NotificationPreferences } from "@/types/domain";

export function NotificationSettingsForm({ initial }: { initial: NotificationPreferences }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | "unsupported">("default");
  const [permissionPending, setPermissionPending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setBrowserPermission("unsupported");
      return;
    }

    setBrowserPermission(Notification.permission);
  }, []);

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[32px] p-6 shadow-panel">
        <div className="flex items-start gap-4">
          <div className="rounded-[22px] bg-white/[0.04] p-3">
            <Bell className="h-5 w-5 text-accent-soft" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Browser alerts</p>
                <p className="mt-1 text-sm text-white/68">
                  Turn on desktop notifications for new messages and activity when this tab is in the background.
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                  browserPermission === "granted"
                    ? "bg-white text-black"
                    : browserPermission === "denied"
                      ? "bg-accent/15 text-accent-soft"
                      : "bg-white/[0.05] text-white/72"
                )}
              >
                {getPermissionLabel(browserPermission)}
              </span>
            </div>
            <div className="mt-4 rounded-[24px] border border-white/[0.08] bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-black/30 p-2.5">
                  {browserPermission === "granted" ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : browserPermission === "denied" ? (
                    <ShieldAlert className="h-4 w-4 text-accent-soft" />
                  ) : (
                    <MonitorSmartphone className="h-4 w-4 text-white/80" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white/88">{getPermissionDetail(browserPermission)}</p>
                  <p className="mt-2 text-xs text-white/50">
                    Browser permission is separate from the in-app notification toggles below.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-50"
                disabled={
                  permissionPending ||
                  browserPermission === "granted" ||
                  browserPermission === "unsupported"
                }
                onClick={async () => {
                  if (typeof window === "undefined" || !("Notification" in window)) {
                    setBrowserPermission("unsupported");
                    return;
                  }

                  setPermissionPending(true);
                  try {
                    const result = await Notification.requestPermission();
                    setBrowserPermission(result);
                  } finally {
                    setPermissionPending(false);
                  }
                }}
                type="button"
              >
                {permissionPending ? "Requesting..." : browserPermission === "granted" ? "Enabled" : "Enable browser alerts"}
              </button>
              {browserPermission === "denied" ? (
                <p className="self-center text-sm text-white/60">
                  Re-enable this in your browser site settings to receive desktop alerts again.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <form
        className="glass-panel rounded-[32px] p-6 shadow-panel"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            await fetch("/api/settings/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(state)
            });
            router.refresh();
          });
        }}
      >
        <div className="space-y-4">
          {[
            ["likesEnabled", "Likes"],
            ["commentsEnabled", "Comments"],
            ["followsEnabled", "Follows"],
            ["messagesEnabled", "Messages"]
          ].map(([key, label]) => (
            <label className="flex items-center justify-between rounded-2xl border border-white/10 p-4" key={key}>
              <span>{label}</span>
              <input
                checked={Boolean(state[key as keyof NotificationPreferences])}
                onChange={(event) =>
                  setState((current) => ({
                    ...current,
                    [key]: event.target.checked
                  }))
                }
                type="checkbox"
              />
            </label>
          ))}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <HoursField
            label="Quiet start"
            onChange={(value) => setState((current) => ({ ...current, quietHoursStart: value }))}
            value={state.quietHoursStart}
          />
          <HoursField
            label="Quiet end"
            onChange={(value) => setState((current) => ({ ...current, quietHoursEnd: value }))}
            value={state.quietHoursEnd}
          />
        </div>
        <button className="mt-6 rounded-2xl bg-accent px-5 py-3 font-medium text-white" disabled={pending} type="submit">
          {pending ? "Saving..." : "Save preferences"}
        </button>
      </form>
    </div>
  );
}

function getPermissionLabel(permission: NotificationPermission | "unsupported") {
  switch (permission) {
    case "granted":
      return "Enabled";
    case "denied":
      return "Blocked";
    case "unsupported":
      return "Unavailable";
    default:
      return "Off";
  }
}

function getPermissionDetail(permission: NotificationPermission | "unsupported") {
  switch (permission) {
    case "granted":
      return "Desktop notifications are active. New messages and activity can reach you when the app is in the background.";
    case "denied":
      return "Desktop notifications are blocked at the browser level. You will still see in-app badges and alerts here.";
    case "unsupported":
      return "This browser does not support desktop notifications for the current session.";
    default:
      return "Desktop notifications are not enabled yet. Turn them on if you want alerts outside the active tab.";
  }
}

function HoursField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/70">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
        max={23}
        min={0}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        type="number"
        value={value ?? ""}
      />
    </label>
  );
}
