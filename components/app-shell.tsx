import type { ReactNode } from "react";
import { InstallNubiPrompt } from "@/components/install-nubi-prompt";
import { SiteNav } from "@/components/site-nav";

export function AppShell({
  title,
  subtitle,
  aside,
  headerMode = "default",
  showInstallPrompt = true,
  children
}: {
  title: string;
  subtitle: string;
  aside?: ReactNode;
  headerMode?: "default" | "brand-only";
  showInstallPrompt?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl overflow-x-hidden px-4 pb-28 pt-6 md:px-6 lg:px-8">
      <div className="grid min-w-0 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <SiteNav />
        <section className="min-w-0">
          <header className="border-b border-white/[0.08] pb-4">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/88">NU-BI SOCIAL</p>
            <div className="mt-2 h-0.5 w-24 rounded-full bg-[linear-gradient(90deg,#ef4444,#f87171)]" />
            {headerMode === "default" ? (
              <>
                <h2 className="mt-4 text-2xl font-semibold text-white md:text-3xl">{title}</h2>
                <p className="mt-1 max-w-2xl text-sm text-white/62 md:text-base">{subtitle}</p>
              </>
            ) : null}
          </header>
          <div className="mt-6 min-w-0 space-y-5">
            {showInstallPrompt ? <InstallNubiPrompt /> : null}
            {children}
          </div>
        </section>
        <aside className="hidden lg:block">
          <div className="sticky top-5">{aside}</div>
        </aside>
      </div>
    </main>
  );
}
