"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Bell, Heart, MessageCircle, MessageSquareMore } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActivityToast = {
  id: string;
  href: string;
  title: string;
  detail: string;
  type: string;
};

const iconByType = {
  comment: MessageSquareMore,
  like: Heart,
  message: MessageCircle,
  default: Bell
} as const;

export function ActivityAlerts({
  alerts,
  onDismiss
}: {
  alerts: ActivityToast[];
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    if (alerts.length === 0) {
      return;
    }

    const timers = alerts.map((alert) =>
      window.setTimeout(() => {
        onDismiss(alert.id);
      }, 6000)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [alerts, onDismiss]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-[80] flex flex-col gap-3 sm:left-auto sm:right-4 sm:w-[360px]">
      {alerts.map((alert) => {
        const Icon = iconByType[alert.type as keyof typeof iconByType] ?? iconByType.default;

        return (
          <div
            className="pointer-events-auto glass-panel flex items-start gap-3 rounded-[24px] border border-white/[0.08] bg-[#0a0a0b]/95 p-4 shadow-panel"
            key={alert.id}
          >
            <Link className="flex min-w-0 flex-1 items-start gap-3" href={alert.href} onClick={() => onDismiss(alert.id)}>
              <div
                className={cn(
                  "mt-0.5 rounded-2xl p-2.5",
                  alert.type === "message" ? "bg-accent/15 text-accent-soft" : "bg-white/[0.05] text-white/82"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{alert.title}</p>
                <p className="mt-1 text-sm text-white/68">{alert.detail}</p>
              </div>
            </Link>
            <button
              aria-label="Dismiss alert"
              className="text-xs uppercase tracking-[0.16em] text-white/45 transition hover:text-white"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDismiss(alert.id);
              }}
              type="button"
            >
              Close
            </button>
          </div>
        );
      })}
    </div>
  );
}
