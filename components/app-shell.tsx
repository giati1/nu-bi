import type { ReactNode } from "react";
import { BrandMark } from "@/components/brand-mark";
import { SiteNav } from "@/components/site-nav";

export function AppShell({
  title,
  subtitle,
  aside,
  children
}: {
  title: string;
  subtitle: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl overflow-x-hidden px-4 pb-28 pt-6 md:px-6 lg:px-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <SiteNav />
        <section className="min-w-0">
          <header className="glass-panel overflow-hidden rounded-[32px] border-accent/15 bg-mesh-red p-6 shadow-panel">
            <BrandMark compact />
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/65 md:text-base">{subtitle}</p>
          </header>
          <div className="mt-6 min-w-0 space-y-5">{children}</div>
        </section>
        <aside className="hidden lg:block">{aside}</aside>
      </div>
    </main>
  );
}
