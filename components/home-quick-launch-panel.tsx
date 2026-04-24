"use client";

import Link from "next/link";
import { MessageCircleMore, Sparkles, Zap } from "lucide-react";

type QuickAction = {
  label: string;
  detail: string;
  href: string;
  icon: "upload" | "ai" | "messages";
};

const iconMap = {
  upload: Zap,
  ai: Sparkles,
  messages: MessageCircleMore
} as const;

export function HomeQuickLaunchPanel({ actions }: { actions: QuickAction[] }) {
  return (
    <section className="panel-soft edge-light overflow-hidden rounded-[28px] px-4 py-4 md:rounded-[30px] md:px-6 md:py-5">
      <div>
        <p className="text-[11px] uppercase tracking-[0.28em] text-accent-soft">Start here</p>
        <p className="mt-2 text-base font-semibold text-white">Most-used actions</p>
        <p className="mt-2 text-xs text-white/56 md:text-sm md:text-white/60">These are the main things people do first.</p>
      </div>
      <div className="mt-4 grid gap-2.5 md:mt-5 md:gap-3 md:grid-cols-3">
        {actions.map((action) => {
          const Icon = iconMap[action.icon];
          return (
            <Link
              className="flex items-center gap-3 rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-3.5 py-3.5 transition hover:border-white/15 hover:bg-white/[0.05] md:gap-4 md:rounded-[24px] md:px-4 md:py-4"
              href={action.href}
              key={action.label}
            >
              <div className="rounded-2xl bg-white/[0.05] p-2.5 text-accent-soft md:p-3">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white md:text-base">{action.label}</p>
                <p className="mt-1 text-xs leading-5 text-white/58 md:text-sm md:leading-6 md:text-white/62">{action.detail}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
