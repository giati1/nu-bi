"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const lastRefreshAt = useRef(0);

  useEffect(() => {
    const refresh = (force = false) => {
      if (pending) {
        return;
      }
      if (document.visibilityState !== "visible") {
        return;
      }
      if (!document.hasFocus()) {
        return;
      }
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (!force && (activeTag === "input" || activeTag === "textarea")) {
        return;
      }
      const now = Date.now();
      if (now - lastRefreshAt.current < 5000) {
        return;
      }
      lastRefreshAt.current = now;
      startTransition(() => {
        router.refresh();
      });
    };

    const timer = window.setInterval(() => {
      refresh(false);
    }, intervalMs);

    const onFocus = () => refresh(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh(true);
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, pending, router]);

  return null;
}
