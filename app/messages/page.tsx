import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { LiveRefresh } from "@/components/live-refresh";
import { MessagesList } from "@/components/messages-list";
import { getAIAdapter } from "@/lib/ai";
import { getViewer } from "@/lib/auth/session";
import { getConversationSummaries } from "@/lib/db/repository";

export default async function MessagesPage() {
  const viewer = await getViewer();
  if (!viewer) {
    return null;
  }

  const conversations = await getConversationSummaries(viewer.id);
  const summary = await getAIAdapter().summarizeInbox({
    ownerDisplayName: viewer.displayName,
    conversations: conversations.slice(0, 6).map((conversation) => ({
      counterpart: conversation.counterpart.displayName,
      unreadCount: conversation.unreadCount,
      lastMessage: conversation.lastMessage?.body ?? null,
      updatedAt: conversation.updatedAt
    }))
  });

  return (
    <AppShell
      subtitle="One-to-one conversations with unread state, replies, attachments, and smarter controls."
      title="Messages"
    >
      <LiveRefresh intervalMs={12000} />
      <section className="glass-panel rounded-[28px] border-accent/15 bg-accent/5 p-5 shadow-panel">
        <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">AI inbox brief</p>
        <p className="mt-3 text-lg font-semibold">{summary.headline}</p>
        <div className="mt-4 space-y-2 text-sm text-white/70">
          {summary.bullets.map((bullet) => (
            <p key={bullet}>{bullet}</p>
          ))}
        </div>
      </section>
      <MessagesList conversations={conversations} />
    </AppShell>
  );
}
