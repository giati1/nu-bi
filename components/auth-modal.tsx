"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";

type AuthModalContextValue = {
  isAuthenticated: boolean;
  viewerId: string;
  openAuthModal: (reason?: string, nextPath?: string) => void;
  closeAuthModal: () => void;
  requireAuthAction: (action: () => void, reason?: string, nextPath?: string) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    return {
      isAuthenticated: false,
      viewerId: "",
      openAuthModal: () => {
        if (typeof window !== "undefined") {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
        }
      },
      closeAuthModal: () => {},
      requireAuthAction: (action: () => void) => action()
    };
  }
  return ctx;
}

export function AuthModalProvider({
  viewerId,
  children
}: {
  viewerId: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("Sign in to jump into the arena, post, reply, like, and message.");
  const [nextPath, setNextPath] = useState<string | null>(null);
  const isAuthenticated = Boolean(viewerId);

  const openAuthModal = useCallback(
    (customReason?: string, customNextPath?: string) => {
      setReason(customReason || "Sign in to jump into the arena, post, reply, like, and message.");
      setNextPath(customNextPath ?? pathname ?? "/home");
      setOpen(true);
    },
    [pathname]
  );

  const closeAuthModal = useCallback(() => {
    setOpen(false);
  }, []);

  const requireAuthAction = useCallback(
    (action: () => void, customReason?: string, customNextPath?: string) => {
      if (isAuthenticated) {
        action();
        return;
      }
      openAuthModal(customReason, customNextPath);
    },
    [isAuthenticated, openAuthModal]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const targetNext = nextPath || pathname || "/home";
  const googleStartHref = `/api/auth/google/start?mode=login&next=${encodeURIComponent(targetNext)}`;
  const loginHref = `/login?next=${encodeURIComponent(targetNext)}`;
  const signupHref = `/signup?next=${encodeURIComponent(targetNext)}`;

  return (
    <AuthModalContext.Provider
      value={{
        isAuthenticated,
        viewerId,
        openAuthModal,
        closeAuthModal,
        requireAuthAction
      }}
    >
      {children}
      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            aria-label="Close sign in modal"
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={() => setOpen(false)}
            type="button"
          />
          <section className="relative z-10 w-full max-w-[430px] rounded-[36px] border border-accent/30 bg-[linear-gradient(180deg,rgba(14,14,16,0.98),rgba(5,5,6,0.99))] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.75)]">
            <button
              aria-label="Close"
              className="absolute right-5 top-5 rounded-full border border-white/10 p-2 text-white/70 transition hover:border-white/25 hover:text-white"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center text-center">
              <BrandMark className="justify-center" title="NU-BI ARENA" wide />
              <h3 className="mt-5 text-2xl font-semibold tracking-[0.04em] text-white">
                Join the Arena
              </h3>
              <p className="mt-2 max-w-xs text-sm leading-6 text-white/68">{reason}</p>
            </div>

            <div className="mt-6 space-y-3">
              <a
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
                href={googleStartHref}
              >
                <GoogleMark />
                Continue with Google
              </a>

              <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/32">
                <span className="h-px flex-1 bg-white/10" />
                or email
                <span className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  className="flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm font-medium text-white transition hover:border-accent/40 hover:bg-white/[0.08]"
                  href={loginHref}
                  onClick={() => setOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  className="flex items-center justify-center rounded-2xl border border-accent/45 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-4 py-3 text-sm font-medium text-white shadow-[0_14px_32px_rgba(127,29,29,0.35)] transition hover:brightness-110"
                  href={signupHref}
                  onClick={() => setOpen(false)}
                >
                  Create account
                </Link>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </AuthModalContext.Provider>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M21.8 12.23c0-.77-.07-1.5-.2-2.2H12v4.16h5.49a4.7 4.7 0 0 1-2.04 3.09v2.56h3.3c1.93-1.77 3.05-4.38 3.05-7.61Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.76 0 5.08-.92 6.77-2.5l-3.3-2.56c-.92.62-2.08.99-3.47.99-2.66 0-4.92-1.8-5.73-4.21H2.86v2.65A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.27 13.72A5.99 5.99 0 0 1 5.94 12c0-.6.11-1.18.32-1.72V7.63H2.86A10 10 0 0 0 2 12c0 1.61.38 3.14 1.06 4.37l3.21-2.65Z"
        fill="#FBBC05"
      />
      <path
        d="M12 6.07c1.5 0 2.85.52 3.91 1.54l2.93-2.93C17.07 3.04 14.75 2 12 2A9.99 9.99 0 0 0 2.86 7.63l3.4 2.65C7.08 7.87 9.34 6.07 12 6.07Z"
        fill="#EA4335"
      />
    </svg>
  );
}
