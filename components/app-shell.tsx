import type { ReactNode } from "react";
import Link from "next/link";
import { Clapperboard, Compass, Flame, Search, Sparkles } from "lucide-react";
import { AuthModalProvider } from "@/components/auth-modal";
import { InstallNubiPrompt } from "@/components/install-nubi-prompt";
import { SiteNav } from "@/components/site-nav";
import { getViewer } from "@/lib/auth/session";

const TOP_SURFACE_LINKS = [
  { href: "/home", label: "Pulse Feed", icon: Flame },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/ai-tools", label: "Studio", icon: Sparkles }
];

export async function AppShell({
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
  const viewer = await getViewer();

  return (
    <AuthModalProvider viewerId={viewer?.id ?? ""}>
      <main className="mx-auto min-h-screen w-full max-w-7xl overflow-x-hidden px-4 pb-28 pt-5 md:px-6 lg:px-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[270px_minmax(0,1fr)_320px]">
          <SiteNav />
          <section className="min-w-0">
            <header className="panel-soft edge-light rounded-[28px] border border-white/10 p-4 md:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Link
                    className="text-sm font-bold uppercase tracking-[0.28em] text-white transition hover:text-cyan-300"
                    href="/home"
                  >
                    NU-BI
                  </Link>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Live Pulse
                  </span>
                </div>

                <form action="/search" className="relative flex-1 sm:max-w-[240px]" method="GET">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
                  <input
                    className="w-full rounded-full border border-white/10 bg-black/45 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/45 outline-none transition focus:border-cyan-400/50"
                    name="q"
                    placeholder="Search people, #topics, posts..."
                    type="search"
                  />
                </form>
              </div>

              <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-white/[0.07] pt-3">
                {TOP_SURFACE_LINKS.map(({ href, label, icon: Icon }) => (
                  <Link
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/80 transition hover:border-purple-400/45 hover:bg-purple-500/15 hover:text-white"
                    href={href}
                    key={href}
                  >
                    <Icon className="h-3.5 w-3.5 text-cyan-300" />
                    {label}
                  </Link>
                ))}
              </div>

              {headerMode === "default" ? (
                <div className="mt-4 border-t border-white/[0.07] pt-3.5">
                  <h1 className="text-xl font-semibold text-white md:text-2xl">{title}</h1>
                  {subtitle ? (
                    <p className="mt-1 max-w-2xl text-xs text-white/60 md:text-sm">{subtitle}</p>
                  ) : null}
                </div>
              ) : null}
            </header>
            <div className="mt-5 min-w-0 space-y-5">
              {showInstallPrompt ? <InstallNubiPrompt /> : null}
              {children}
            </div>
          </section>
          <aside className="hidden lg:block">
            <div className="sticky top-5">{aside}</div>
          </aside>
        </div>
      </main>
    </AuthModalProvider>
  );
}
