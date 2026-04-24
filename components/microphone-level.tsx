"use client";

import { cn } from "@/lib/utils";

export function MicrophoneLevel({
  level,
  active,
  className
}: {
  level: number;
  active: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {[0, 1, 2, 3, 4].map((index) => {
        const threshold = (index + 1) / 5;
        const lit = active && level >= threshold - 0.14;
        return (
          <span
            className={cn(
              "w-1.5 rounded-full transition-all duration-150",
              lit ? "bg-accent" : "bg-white/14"
            )}
            key={index}
            style={{ height: `${10 + index * 4}px` }}
          />
        );
      })}
    </div>
  );
}
