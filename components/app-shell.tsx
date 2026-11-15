import type { ReactNode } from "react";
import Link from "next/link";
import { Clapperboard, Compass, Cpu, Flame, Search, Sparkles } from "lucide-react";
import { AmbientSoundButton } from "@/components/ambient-sound-button";
import { AuthModalProvider } from "@/components/auth-modal";
import { BackgroundVideo } from "@/components/background-video";
import { InstallNubiPrompt } from "@/components/install-nubi-prompt";
import { SiteNav } from "@/components/site-nav";
import { getViewer } from "@/lib/auth/session";

const TOP_SURFACE_LINKS = [
  { href: "/home", label: "Live Feed", icon: Flame },
  { href: "/tech", label: "Tech & AI", icon: Cpu },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/shorts", label: "Shorts", icon: Clapperboard },
  { href: "/creator", label: "Create", icon: Sparkles }
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
      <main className="mx-auto min-h-screen w-full max-w-[1400px] overflow-x-hidden px-4 pb-28 pt-5 md:px-6 lg:px-8">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
          <SiteNav />
          <section className="min-w-0">
            <header className="group relative overflow-hidden rounded-[28px] border border-white/15 bg-black p-4 shadow-[0_20px_60px_rgba(0,0,0,0.75)] md:p-5">
              <BackgroundVideo
                src="/cinematic/pulse-loop.mp4"
                poster="/cinematic/shot-2.jpg"
                overlayStyle="banner"
              />

              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Link
                      className="font-display text-sm font-black uppercase tracking-[0.28em] text-white transition hover:text-rose-300"
                      href="/home"
                    >
                      NU-BI
                    </Link>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
                      Live World
                    </span>
                  </div>

                  <div className="flex flex-1 items-center justify-end gap-2">
                    <form action="/search" className="relative flex-1 sm:max-w-[230px]" method="GET">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/55" />
                      <input
                        className="w-full rounded-full border border-white/15 bg-black/65 py-1.5 pl-8 pr-3 text-xs text-white placeholder-white/50 outline-none backdrop-blur-md transition focus:border-white/45"
                        name="q"
                        placeholder="Search people, #topics..."
                        type="search"
                      />
                    </form>
                    <AmbientSoundButton compact />
                  </div>
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
                  {TOP_SURFACE_LINKS.map(({ href, label, icon: Icon }) => (
                    <Link
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-white/85 backdrop-blur-md transition hover:border-white/40 hover:bg-white hover:text-black"
                      href={href}
                      key={href}
                    >
                      <Icon className="h-3.5 w-3.5 text-rose-400" />
                      {label}
                    </Link>
                  ))}
                </div>

                {headerMode === "default" ? (
                  <div className="mt-4 border-t border-white/10 pt-3.5">
                    <h1 className="font-display text-xl font-black uppercase tracking-tight text-white md:text-2xl">
                      {title}
                    </h1>
                    {subtitle ? (
                      <p className="mt-1 max-w-2xl text-xs text-white/70 md:text-sm">{subtitle}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
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
