"use client";

import type { ReactNode } from "react";
import { PanelLeft, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HomeUtilityDrawer({
  children
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Open extras sidebar"
        className="fixed bottom-28 left-0 z-[55] inline-flex items-center gap-2 rounded-r-[20px] border border-l-0 border-accent/25 bg-[linear-gradient(180deg,rgba(239,68,68,0.18),rgba(9,9,9,0.96))] px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_12px_28px_rgba(0,0,0,0.28)] transition duration-200 ease-out active:scale-[0.985] md:bottom-8 md:shadow-[0_18px_40px_rgba(0,0,0,0.35)] md:hover:bg-[linear-gradient(180deg,#f87171,#ef4444)]"
        onClick={() => setOpen(true)}
        type="button"
      >
        <PanelLeft className="h-4 w-4" />
        Extras
      </button>

      <div className={cn("pointer-events-none fixed inset-0 z-[86] transition", open ? "pointer-events-auto" : "")}>
        <button
          aria-label="Close home sidebar"
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
          type="button"
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-full max-w-[440px] border-r border-accent/20 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.16),transparent_24%),#080808] p-5 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.16),transparent_24%),rgba(8,8,8,0.96)] md:backdrop-blur-xl",
            open ? "translate-x-0 scale-100 opacity-100" : "-translate-x-10 scale-[0.985] opacity-0"
          )}
        >
          <div
            className={cn(
              "flex items-start justify-between gap-4 transition-all duration-500 delay-75",
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            )}
          >
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent-soft">Extras</p>
              <p className="mt-2 text-xl font-semibold text-white">Quick access</p>
              <p className="mt-2 text-sm text-white/58">Setup, shortcuts, and the lower-priority tools live here now.</p>
            </div>
            <button
              aria-label="Close home sidebar"
              className="rounded-full border border-white/10 p-2 text-white/75"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className={cn(
              "mt-5 max-h-[calc(100vh-8rem)] space-y-5 overflow-y-auto pr-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            )}
            style={{ transitionDelay: "140ms" }}
          >
            {children}
          </div>
        </aside>
      </div>
    </>
  );
}
