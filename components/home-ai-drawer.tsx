"use client";

import type { ReactNode } from "react";
import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HomeAIDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Open AI sidebar"
        className="fixed bottom-44 left-0 z-[56] inline-flex items-center gap-2 rounded-r-[20px] border border-l-0 border-accent bg-white px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent shadow-[0_14px_32px_rgba(0,0,0,0.32)] transition duration-200 ease-out active:scale-[0.985] md:bottom-24 md:hover:bg-accent md:hover:text-white"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Sparkles className="h-4 w-4" />
        AI
      </button>

      <div className={cn("pointer-events-none fixed inset-0 z-[87] transition", open ? "pointer-events-auto" : "")}>
        <button
          aria-label="Close AI sidebar"
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
          type="button"
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 w-full max-w-[520px] border-r border-accent/20 bg-[#080808] p-5 shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:bg-[#080808]/96 md:backdrop-blur-xl",
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
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent-soft">NU-BI AI</p>
              <p className="mt-2 text-xl font-semibold text-white">Create, chat, and read documents</p>
              <p className="mt-2 text-sm text-white/58">Chat, generate visuals, and scan a page without leaving home.</p>
            </div>
            <button
              aria-label="Close AI sidebar"
              className="rounded-full border border-white/10 p-2 text-white/75"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            className={cn(
              "mt-5 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
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
