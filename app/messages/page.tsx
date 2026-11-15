import Link from "next/link";
import { MessageSquarePlus, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { InboxBriefPanel } from "@/components/inbox-brief-panel";
import { LiveRefresh } from "@/components/live-refresh";
import { MessagesList } from "@/components/messages-list";
import { ARENA_FIGHTERS } from "@/lib/arena-personas";
import { requirePageViewer } from "@/lib/auth/session";
import { getConversationSummaries } from "@/lib/db/repository";

export default async function MessagesPage() {
  const viewer = await requirePageViewer("/messages");

  const conversations = await getConversationSummaries(viewer.id);
  const summary = buildPrivateInboxSummary(viewer.displayName, conversations);

  return (
    <AppShell
      subtitle="Private direct threads with members and featured NU-BI correspondents."
      title="Messages"
    >
      <LiveRefresh intervalMs={10000} />
      <section className="panel-soft edge-light rounded-[28px] bg-black p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Private Direct Channel
            </div>
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-white/70">
              Message any member or jump directly into a 1-on-1 thread with our featured correspondents below.
            </p>
          </div>
          <Link
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-neutral-200"
            href="/messages/new"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Conversation
          </Link>
        </div>

        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {ARENA_FIGHTERS.map((fighter) => (
            <Link
              key={fighter.slug}
              href={`/messages/start?username=${encodeURIComponent(fighter.slug)}`}
              className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-white/25 hover:bg-white/[0.07]"
            >
              <Avatar
                className="h-10 w-10 shrink-0 ring-1 ring-white/20"
                name={fighter.name}
                src={fighter.avatarUrl}
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white group-hover:text-sky-300">
                  {fighter.name}
                </p>
                <p className="truncate text-[10px] uppercase tracking-[0.14em] text-white/50">
                  {fighter.role}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <InboxBriefPanel bullets={summary.bullets} headline={summary.headline} />
      <MessagesList conversations={conversations} />
    </AppShell>
  );
}

function buildPrivateInboxSummary(
  ownerDisplayName: string,
  conversations: Awaited<ReturnType<typeof getConversationSummaries>>
) {
  if (conversations.length === 0) {
    return {
      headline: `${ownerDisplayName}, your direct inbox is ready.`,
      bullets: [
        "Click any featured correspondent above to open an instant 1-on-1 thread.",
        "Start a conversation from any member profile across the stream.",
        "All direct messages stay private to your conversation participants."
      ]
    };
  }

  const unreadCount = conversations.filter((conversation) => conversation.unreadCount > 0).length;

  return {
    headline:
      unreadCount > 0
        ? `${unreadCount} thread${unreadCount === 1 ? "" : "s"} with unread replies.`
        : "All caught up. Your latest direct threads are ready below.",
    bullets: conversations.slice(0, 3).map((conversation) => {
      const preview =
        conversation.lastMessage?.body ||
        (conversation.lastMessage?.mediaMimeType?.startsWith("audio/")
          ? "Voice note"
          : conversation.lastMessage?.mediaMimeType?.startsWith("video/")
            ? "Video attachment"
            : conversation.lastMessage?.mediaMimeType?.startsWith("image/")
              ? "Photo attachment"
              : "No messages yet");

      return `${conversation.counterpart.displayName}: ${preview}`;
    })
  };
}
