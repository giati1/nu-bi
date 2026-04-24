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
      subtitle="Your conversations live here. Open a thread, search messages, or start one from a profile."
      title="Messages"
    >
      <LiveRefresh intervalMs={12000} />
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
              : "No messages yet");

        return `${conversation.counterpart.displayName}: ${preview}`;
      })
    };
  }
}
