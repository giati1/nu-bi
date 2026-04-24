import Link from "next/link";

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="glass-panel rounded-[28px] p-8 text-center shadow-panel">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-white/60">{description}</p>
      {actionLabel && actionHref ? (
        <div className="mt-5">
          <Link className="inline-flex rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black" href={actionHref}>
            {actionLabel}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
