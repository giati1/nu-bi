import Link from "next/link";
import { MessageSquare, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { ARENA_FIGHTERS, isAutomatedVoiceUsername } from "@/lib/arena-personas";
import { requirePageViewer } from "@/lib/auth/session";
import { getSuggestedUsers } from "@/lib/db/repository";

export default async function NewConversationPage() {
  const viewer = await requirePageViewer("/messages/new");
  const users = await getSuggestedUsers(viewer.id);
  const visibleUsers = users.filter((user) => !isAutomatedVoiceUsername(user.username));

  return (
    <AppShell
      title="Start conversation"
      subtitle="Open a private 1-on-1 thread with a featured correspondent or community member."
    >
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Featured Correspondents & Insiders
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white">Direct Insider Lines</h2>
          </div>
          <Link className="text-sm text-white/62 transition hover:text-white" href="/tech">
            Open Tech & AI Radar
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {ARENA_FIGHTERS.map((fighter) => (
            <Link
              className="panel-soft edge-light group rounded-[28px] bg-black p-5 transition hover:border-white/25 hover:bg-white/[0.03]"
              href={`/messages/start?username=${encodeURIComponent(fighter.slug)}`}
              key={fighter.slug}
            >
              <div className="flex items-start gap-4">
                <Avatar
                  className="h-16 w-16 rounded-[22px] ring-1 ring-white/20"
                  name={fighter.name}
                  src={fighter.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold text-white group-hover:text-sky-300">
                      {fighter.name}
                    </p>
                    <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/80">
                      {fighter.role}
                    </span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
                    @{fighter.slug}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/70">{fighter.bio}</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Message @{fighter.slug}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Community</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Start with another member</h2>
          </div>
          <Link className="text-sm text-white/62 transition hover:text-white" href="/explore">
            Open explore
          </Link>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleUsers.slice(0, 8).map((user) => (
            <Link
              className="panel-soft edge-light rounded-[26px] bg-black p-4 transition hover:border-white/15 hover:bg-white/[0.02]"
              href={`/messages/start?recipientId=${encodeURIComponent(user.id)}`}
              key={user.id}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14" name={user.displayName} src={user.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-white">{user.displayName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/42">
                    @{user.username}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/64">
                    {user.bio || "Start a direct NU-BI conversation."}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
