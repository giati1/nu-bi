export function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="glass-panel rounded-[28px] p-8 text-center shadow-panel">
      <p className="text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-white/60">{description}</p>
    </div>
  );
}
