import { cn } from "@/lib/utils";

export function BrandMark({
  compact = false,
  className
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-[0_12px_32px_rgba(239,68,68,0.2)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_22%,rgba(239,68,68,0.9),transparent_42%),linear-gradient(160deg,#160606,#050505_70%)]" />
        <div className="absolute left-2 top-2 h-3 w-3 rounded-full bg-white/90" />
        <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full border border-white/15 bg-accent/80" />
        <div className="absolute inset-x-0 bottom-1 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/90">
          KM
        </div>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.34em] text-accent-soft">Know Me</p>
        <p className={cn("font-semibold text-white", compact ? "text-base" : "text-lg")}>NU-BI</p>
      </div>
    </div>
  );
}
