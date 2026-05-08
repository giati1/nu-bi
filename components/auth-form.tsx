"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useTransition } from "react";

type Variant = "login" | "signup";

export function AuthForm({ variant }: { variant: Variant }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLFormElement>(null);
  const oauthError = searchParams.get("error");
  const [error, setError] = useState<string | null>(oauthError);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isLogin = variant === "login";
  const defaultNext = isLogin ? "/home" : "/onboarding/ai-circle";
  const googleParams = new URLSearchParams({
    mode: variant,
    next: searchParams.get("next") ?? defaultNext
  });
  const googleUrl = `/api/auth/google/start?${googleParams.toString()}`;

  return (
    <div className="space-y-4">
      <a
        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 font-medium text-white transition hover:border-white/30 hover:bg-white/10"
        href={googleUrl}
      >
        <GoogleMark />
        Continue with Google
      </a>

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-white/28">
        <span className="h-px flex-1 bg-white/10" />
        or
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          setError(null);
          setSuggestion(null);

          startTransition(async () => {
            const response = await fetch(`/api/auth/${variant}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(Object.fromEntries(form))
            });

            const payload = (await response.json()) as { error?: string; suggestion?: string | null };
            if (!response.ok) {
              setError(payload.error ?? "Request failed.");
              setSuggestion(payload.suggestion ?? null);
              return;
            }

            router.push(searchParams.get("next") ?? defaultNext);
            router.refresh();
          });
        }}
        ref={formRef}
      >
        <div className="space-y-4">
          {!isLogin ? (
            <>
              <Field label="Display name" name="displayName" placeholder="Nova Reed" />
              <Field
                label="Username"
                name="username"
                placeholder="Nova-Reed"
                autoCapitalize="none"
                autoComplete="username"
                hint="3 to 24 characters. Letters, numbers, dots, underscores, and hyphens are allowed. Uppercase is fine; it will be saved in lowercase."
              />
            </>
          ) : null}
          <Field
            label="Email"
            name="email"
            placeholder="you@nubi.com"
            autoCapitalize="none"
            autoComplete="email"
            type="email"
            hint={isLogin ? "Log in with your email address." : undefined}
          />
          <Field
            label="Password"
            name="password"
            placeholder="********"
            autoCapitalize="none"
            autoComplete={isLogin ? "current-password" : "new-password"}
            type="password"
          />
        </div>
        {error ? (
          <div className="mt-4 space-y-2 text-sm text-red-300">
            <p>{error}</p>
            {suggestion && !isLogin ? (
              <button
                className="text-left text-xs font-medium text-red-200 underline underline-offset-4 transition hover:text-white"
                onClick={() => {
                  const usernameInput = formRef.current?.elements.namedItem("username");
                  if (usernameInput instanceof HTMLInputElement) {
                    usernameInput.value = suggestion;
                    usernameInput.focus();
                    usernameInput.select();
                  }
                  setError(null);
                  setSuggestion(null);
                }}
                type="button"
              >
                Use @{suggestion} instead
              </button>
            ) : null}
          </div>
        ) : null}
        <button
          className="w-full rounded-2xl border border-accent/55 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-4 py-3 font-medium text-white shadow-[0_16px_40px_rgba(127,29,29,0.35)] transition hover:border-accent hover:brightness-110 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Working..." : isLogin ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
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

function Field({
  label,
  name,
  placeholder,
  type = "text",
  hint,
  autoCapitalize = "none",
  autoCorrect = "off",
  spellCheck = false,
  autoComplete
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  hint?: string;
  autoCapitalize?: string;
  autoCorrect?: string;
  spellCheck?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/48">{label}</span>
      <input
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={autoCorrect}
        className="w-full rounded-2xl border border-accent/15 bg-[linear-gradient(180deg,rgba(239,68,68,0.06),rgba(255,255,255,0.02))] px-4 py-3.5 text-white outline-none transition placeholder:text-white/22 focus:border-accent focus:bg-[linear-gradient(180deg,rgba(239,68,68,0.1),rgba(255,255,255,0.03))]"
        name={name}
        placeholder={placeholder}
        required
        spellCheck={spellCheck}
        type={type}
      />
      {hint ? <span className="mt-2 block text-xs text-white/45">{hint}</span> : null}
    </label>
  );
}
