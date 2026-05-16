import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { InboxBriefPanel } from "@/components/inbox-brief-panel";
import { LiveRefresh } from "@/components/live-refresh";
import { MessagesList } from "@/components/messages-list";
import { getAIAdapter } from "@/lib/ai";
import { requirePageViewer } from "@/lib/auth/session";
import { getConversationSummaries } from "@/lib/db/repository";

export default async function MessagesPage() {
  const viewer = await requirePageViewer("/messages");

  const conversations = await getConversationSummaries(viewer.id);
  const summary = await getInboxSummary(viewer.displayName, conversations);

  return (
    <AppShell
      subtitle="Your conversations live here. Start a thread with a user, AI companion, AI agent, or AI influencer."
      title="Messages"
    >
      <LiveRefresh intervalMs={12000} />
      <section className="panel-soft edge-light rounded-[28px] bg-black p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">New conversation</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/64">
              Launch a thread with people or NU-BI AI personalities without leaving the app.
            </p>
          </div>
          <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black" href="/messages/new">
            Start conversation
          </Link>
        </div>
      </section>
      <InboxBriefPanel bullets={summary.bullets} headline={summary.headline} />
      <MessagesList conversations={conversations} />
    </AppShell>
  );
}

async function getInboxSummary(
  ownerDisplayName: string,
  conversations: Awaited<ReturnType<typeof getConversationSummaries>>
) {
  try {
    return await getAIAdapter().summarizeInbox({
      ownerDisplayName,
      conversations: conversations.slice(0, 6).map((conversation) => ({
        counterpart: conversation.counterpart.displayName,
        unreadCount: conversation.unreadCount,
        lastMessage: conversation.lastMessage?.body ?? null,
        updatedAt: conversation.updatedAt
      }))
    });
  } catch {
    if (conversations.length === 0) {
      return {
        headline: `${ownerDisplayName}, your inbox is clear right now.`,
        bullets: [
          "No active threads yet.",
          "Start a conversation from a profile.",
          "New replies will show up here."
        ]
      };
    }

    const unreadCount = conversations.filter((conversation) => conversation.unreadCount > 0).length;

    return {
      headline:
        unreadCount > 0
          ? `${unreadCount} thread${unreadCount === 1 ? "" : "s"} need attention.`
          : "All caught up. Your latest conversations are still within reach.",
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
}
