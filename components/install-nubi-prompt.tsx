"use client";

import { Download, Share, X } from "lucide-react";
import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const STORAGE_KEY = "nubi-install-prompt-dismissed";

export function InstallNubiPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isIosSafari, setIsIosSafari] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const dismissedPrompt = window.localStorage.getItem(STORAGE_KEY) === "1";
    const userAgent = window.navigator.userAgent;
    const iPhoneOrIPad = /iPhone|iPad|iPod/i.test(userAgent);
    const safari = /^((?!chrome|android).)*safari/i.test(userAgent);

    setIsStandalone(standalone);
    setDismissed(dismissedPrompt);
    setIsIosSafari(iPhoneOrIPad && safari && !standalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
      if (!dismissedPrompt && !standalone) {
        setDismissed(false);
      }
    };

    const handleInstalled = () => {
      setPromptEvent(null);
      setDismissed(true);
      window.localStorage.setItem(STORAGE_KEY, "1");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (dismissed || isStandalone) {
    return null;
  }

  const showInstallButton = Boolean(promptEvent);

  return (
    <section className="panel-soft edge-light overflow-hidden rounded-[28px] border border-accent/25 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.14),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent-soft">Install NU-BI</p>
          <p className="mt-2 text-base font-semibold text-white">Put NU-BI on your home screen</p>
          <p className="mt-2 text-sm text-white/62">
            {showInstallButton
              ? "Install it like a browser app for faster access and a cleaner full-screen view."
              : isIosSafari
                ? "On iPhone, tap Share and then Add to Home Screen."
                : "Your browser can install NU-BI as an app when supported."}
          </p>
        </div>
        <button
          aria-label="Dismiss install prompt"
          className="rounded-full border border-white/10 p-2 text-white/70"
          onClick={() => {
            window.localStorage.setItem(STORAGE_KEY, "1");
            setDismissed(true);
          }}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {showInstallButton ? (
          <button
            className="inline-flex items-center gap-2 rounded-2xl border border-accent/35 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-4 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(127,29,29,0.32)]"
            onClick={async () => {
              if (!promptEvent) {
                return;
              }
              await promptEvent.prompt();
              const choice = await promptEvent.userChoice;
              if (choice.outcome === "accepted") {
                window.localStorage.setItem(STORAGE_KEY, "1");
                setDismissed(true);
              }
            }}
            type="button"
          >
            <Download className="h-4 w-4" />
            Install NU-BI
          </button>
        ) : null}
        {isIosSafari ? (
          <div className="inline-flex items-center gap-2 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-white/76">
            <Share className="h-4 w-4" />
            Share then Add to Home Screen
          </div>
        ) : null}
      </div>
    </section>
  );
}
