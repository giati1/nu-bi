"use client";

import Link from "next/link";
import { Sparkles, Wand2, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function HomeAIToolsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="panel-soft edge-light overflow-hidden rounded-[26px] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.26em] text-accent-soft">AI tools</p>
            <p className="mt-2 text-base font-semibold text-white">Create faster</p>
          </div>
          <button
            className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm font-medium text-black transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-white/90 active:translate-y-0.5 active:scale-[0.985]"
            onClick={() => setOpen(true)}
            type="button"
          >
            Open
          </button>
        </div>
      </section>

      <div className={cn("pointer-events-none fixed inset-0 z-[82] transition", open ? "pointer-events-auto" : "")}>
        <button
          className={cn(
            "absolute inset-0 bg-black/60 backdrop-blur-md transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
          type="button"
        />
        <aside
          className={cn(
            "absolute inset-y-0 right-0 w-full max-w-[420px] border-l border-white/10 bg-[#080808]/96 p-5 shadow-2xl backdrop-blur-xl transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            open ? "translate-x-0 scale-100 opacity-100" : "translate-x-10 scale-[0.985] opacity-0"
          )}
        >
          <div className={cn("flex items-start justify-between gap-4 transition-all duration-500 delay-75", open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0")}>
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-accent-soft">AI tools</p>
              <p className="mt-2 text-xl font-semibold text-white">Create without leaving the feed</p>
            </div>
            <button
              className="rounded-full border border-white/10 p-2 text-white/75"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {[
              "Rewrite captions",
              "Shape replies",
              "Generate visuals"
            ].map((item, index) => (
              <div className="rounded-[24px] border border-white/[0.08] bg-white/[0.03] px-4 py-4" key={item}>
                <div
                  className={cn(
                    "flex items-center gap-3 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
                  )}
                  style={{ transitionDelay: `${120 + index * 55}ms` }}
                >
                  <div className="rounded-2xl bg-white/[0.05] p-3 text-accent-soft">
                    {item === "Generate visuals" ? <Wand2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                  </div>
                  <p className="font-medium text-white">{item}</p>
                </div>
              </div>
            ))}
          </div>

          <Link
            className={cn(
              "mt-5 inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-white/90 active:translate-y-0.5 active:scale-[0.985]",
              open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            )}
            href="/ai"
            onClick={() => setOpen(false)}
            style={{ transitionDelay: "280ms" }}
          >
            Open AI Studio
          </Link>
        </aside>
      </div>
    </>
  );
}
