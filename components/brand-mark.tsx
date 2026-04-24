import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  className,
  title = "NU-BI",
  eyebrow,
  wide = false
}: {
  compact?: boolean;
  className?: string;
  title?: string;
  eyebrow?: string;
  wide?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-3", wide ? "w-full" : "", className)}>
      <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_12px_32px_rgba(239,68,68,0.2)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(239,68,68,0.9),transparent_42%),linear-gradient(160deg,#160606,#050505_70%)]" />
        <div className="absolute left-2 top-2 h-3 w-3 rounded-full bg-white/90" />
        <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border border-white/15 bg-accent/80" />
        <div className="absolute inset-x-0 bottom-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
          NU
        </div>
      </div>
      <div className={cn("min-w-0", wide ? "flex-1" : "")}>
        {eyebrow ? <p className="text-[11px] uppercase tracking-[0.34em] text-accent-soft">{eyebrow}</p> : null}
        <p
          className={cn(
            "font-semibold uppercase text-white",
            eyebrow ? "mt-0" : "",
            compact ? "text-base" : "text-lg",
            wide ? "w-full text-[1.9rem] leading-none tracking-[0.34em] sm:text-[2.5rem]" : ""
          )}
        >
          {title}
        </p>
        <div
          className={cn(
            "rounded-full bg-[linear-gradient(90deg,#ef4444,#f87171)]",
            compact ? "mt-2 h-0.5 w-14" : "mt-3 h-0.5 w-20",
            wide ? "w-24 sm:w-32" : ""
          )}
        />
      </div>
    </div>
  );
}
