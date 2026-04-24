"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Variant = "login" | "signup";

export function AuthForm({ variant }: { variant: Variant }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isLogin = variant === "login";

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setError(null);

        startTransition(async () => {
          const response = await fetch(`/api/auth/${variant}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(form))
          });

          const payload = (await response.json()) as { error?: string };
          if (!response.ok) {
            setError(payload.error ?? "Request failed.");
            return;
          }

          router.push(searchParams.get("next") ?? "/home");
          router.refresh();
        });
      }}
    >
      <div className="space-y-4">
        {!isLogin ? (
          <>
            <Field label="Display name" name="displayName" placeholder="Nova Reed" />
            <Field
              label="Username"
              name="username"
              placeholder="novareed"
              hint="Pick almost any username you want. Keep it between 3 and 24 characters."
            />
          </>
        ) : null}
        <Field
          label="Email"
          name="email"
          placeholder="you@nubi.com"
          type="email"
          hint={isLogin ? "Log in with your email address." : undefined}
        />
        <Field label="Password" name="password" placeholder="********" type="password" />
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <button
        className="w-full rounded-2xl border border-accent/55 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-4 py-3 font-medium text-white shadow-[0_16px_40px_rgba(127,29,29,0.35)] transition hover:border-accent hover:brightness-110 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Working..." : isLogin ? "Log in" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text",
  hint
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-white/48">{label}</span>
      <input
        className="w-full rounded-2xl border border-accent/15 bg-[linear-gradient(180deg,rgba(239,68,68,0.06),rgba(255,255,255,0.02))] px-4 py-3.5 text-white outline-none transition placeholder:text-white/22 focus:border-accent focus:bg-[linear-gradient(180deg,rgba(239,68,68,0.1),rgba(255,255,255,0.03))]"
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
      {hint ? <span className="mt-2 block text-xs text-white/45">{hint}</span> : null}
    </label>
  );
}
