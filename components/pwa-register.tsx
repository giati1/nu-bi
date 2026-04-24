"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/service-worker.js").catch(() => {
      // Keep app startup quiet if service worker registration fails.
    });
  }, []);

  return null;
}
