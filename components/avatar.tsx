import Image from "next/image";
import { buildInitials, cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  className
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    return (
      <div className={cn("relative aspect-square shrink-0 overflow-hidden rounded-2xl bg-white/10", className)}>
        <Image alt={name} className="object-cover object-center" fill sizes="96px" src={src} unoptimized />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-square shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-red-950 font-semibold text-white",
        className
      )}
    >
      {buildInitials(name)}
    </div>
  );
}
