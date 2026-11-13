import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { requirePageViewer } from "@/lib/auth/session";
import { getAIPersonaDirectory, getSuggestedUsers } from "@/lib/db/repository";

export default async function NewConversationPage() {
  const viewer = await requirePageViewer("/messages/new");
  const [users, personas] = await Promise.all([getSuggestedUsers(viewer.id), getAIPersonaDirectory(viewer.id)]);
  const personaUserIds = new Set(personas.map((persona) => persona.linkedUserId));
  const visibleUsers = users.filter((user) => !personaUserIds.has(user.id));

  return (
    <AppShell
      title="Start conversation"
      subtitle="Choose a person, AI companion, AI agent, or AI influencer and jump straight into chat."
    >
      <section className="panel-soft edge-light rounded-[30px] bg-black p-5">
        <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Conversation types</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["User", "Start a normal direct thread with another account."],
            ["AI companion", "Talk with a supportive NU-BI companion persona."],
            ["AI agent", "Get planning, coaching, and task support in chat."],
            ["AI influencer", "Brainstorm content, captions, and social moves."]
          ].map(([label, copy]) => (
            <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4" key={label}>
              <p className="text-sm font-semibold text-white">{label}</p>
              <p className="mt-2 text-sm leading-6 text-white/62">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">People</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Start with another user</h2>
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
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/42">@{user.username}</p>
                  <p className="mt-3 text-sm leading-6 text-white/64">{user.bio || "Start a direct NU-BI conversation."}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">NU-BI AI</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Start with AI personalities</h2>
        </div>
        <div className="grid gap-4 xl:grid-cols-2">
          {personas.map((persona) => (
            <Link
              className="panel-soft edge-light rounded-[28px] bg-black p-5 transition hover:border-accent/30 hover:bg-white/[0.02]"
              href={`/messages/start?recipientId=${encodeURIComponent(persona.linkedUserId)}`}
              key={persona.id}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 rounded-[22px]" name={persona.displayName} src={persona.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-white">{persona.displayName}</p>
                    <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.14em] text-accent-soft">
                      {persona.specialty}
                    </span>
                  </div>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/42">@{persona.username}</p>
                  <p className="mt-3 text-sm leading-6 text-white/66">{persona.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/45">{persona.personality}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
