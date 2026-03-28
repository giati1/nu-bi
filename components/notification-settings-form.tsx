"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { NotificationPreferences } from "@/types/domain";

export function NotificationSettingsForm({ initial }: { initial: NotificationPreferences }) {
  const router = useRouter();
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="glass-panel rounded-[32px] p-6 shadow-panel"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          await fetch("/api/settings/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(state)
          });
          router.refresh();
        });
      }}
    >
      <div className="space-y-4">
        {[
          ["likesEnabled", "Likes"],
          ["commentsEnabled", "Comments"],
          ["followsEnabled", "Follows"],
          ["messagesEnabled", "Messages"]
        ].map(([key, label]) => (
          <label className="flex items-center justify-between rounded-2xl border border-white/10 p-4" key={key}>
            <span>{label}</span>
            <input
              checked={Boolean(state[key as keyof NotificationPreferences])}
              onChange={(event) =>
                setState((current) => ({
                  ...current,
                  [key]: event.target.checked
                }))
              }
              type="checkbox"
            />
          </label>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <HoursField
          label="Quiet start"
          onChange={(value) => setState((current) => ({ ...current, quietHoursStart: value }))}
          value={state.quietHoursStart}
        />
        <HoursField
          label="Quiet end"
          onChange={(value) => setState((current) => ({ ...current, quietHoursEnd: value }))}
          value={state.quietHoursEnd}
        />
      </div>
      <button className="mt-6 rounded-2xl bg-accent px-5 py-3 font-medium text-white" disabled={pending} type="submit">
        {pending ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}

function HoursField({
  label,
  value,
  onChange
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/70">{label}</span>
      <input
        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
        max={23}
        min={0}
        onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))}
        type="number"
        value={value ?? ""}
      />
    </label>
  );
}
