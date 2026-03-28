"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Variant = "login" | "signup";

export function AuthForm({ variant }: { variant: Variant }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass-panel accent-ring rounded-[32px] p-8 shadow-panel"
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
      <p className="text-xs uppercase tracking-[0.28em] text-accent-soft">
        {variant === "login" ? "Welcome back" : "Create your account"}
      </p>
      <div className="mt-6 space-y-4">
        {variant === "signup" ? (
          <>
            <Field label="Display name" name="displayName" placeholder="Nova Reed" />
            <Field label="Username" name="username" placeholder="novareed" />
          </>
        ) : null}
        <Field label="Email" name="email" placeholder="you@nubi.com" type="email" />
        <Field label="Password" name="password" placeholder="••••••••" type="password" />
      </div>
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <button
        className="mt-6 w-full rounded-2xl bg-accent px-4 py-3 font-medium text-white transition hover:bg-red-500 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Working..." : variant === "login" ? "Log in" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  type = "text"
}: {
  label: string;
  name: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/70">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none transition focus:border-accent"
        name={name}
        placeholder={placeholder}
        required
        type={type}
      />
    </label>
  );
}
