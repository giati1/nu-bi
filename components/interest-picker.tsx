"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

const suggested = ["ai", "design", "founders", "gaming", "fashion", "music", "sports", "finance"];

export function InterestPicker({ active }: { active: string[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {suggested.map((interest) => {
        const enabled = active.includes(interest);
        return (
          <button
            className={`rounded-full px-3 py-2 text-sm ${enabled ? "bg-accent text-white" : "bg-white/10 text-white/70"}`}
            disabled={pending}
            key={interest}
            onClick={() =>
              startTransition(async () => {
                await fetch("/api/interests", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ interest, enabled: !enabled })
                });
                router.refresh();
              })
            }
            type="button"
          >
            {interest}
          </button>
        );
      })}
    </div>
  );
}
