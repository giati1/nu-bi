import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { ConversationActions } from "@/components/conversation-actions";
import { ConversationThread } from "@/components/conversation-thread";
import { LiveRefresh } from "@/components/live-refresh";
import { SharedMediaPanel } from "@/components/shared-media-panel";
import { TypingIndicator } from "@/components/typing-indicator";
import { requirePageViewer } from "@/lib/auth/session";
import { getConversationReadState, getConversationSummaries, getConversationThread } from "@/lib/db/repository";

export default async function ConversationPage({
  params
}: {
  params: { conversationId: string };
}) {
  const viewer = await requirePageViewer(`/messages/${params.conversationId}`);

  const [conversations, thread, readState] = await Promise.all([
    getConversationSummaries(viewer.id),
    getConversationThread(params.conversationId, viewer.id),
    getConversationReadState(params.conversationId, viewer.id)
  ]);

  if (!thread) {
    notFound();
  }

  const currentConversation = conversations.find((item) => item.id === params.conversationId) ?? null;

  return (
    <AppShell
      aside={
        <section className="glass-panel rounded-[28px] p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Conversations</p>
          <div className="mt-4 space-y-3">
            {conversations.map((conversation) => (
              <Link
                className="flex items-center gap-3 rounded-2xl border border-white/10 p-3"
                href={`/messages/${conversation.id}`}
                key={conversation.id}
              >
                <Avatar
                  className="h-11 w-11"
                  name={conversation.counterpart.displayName}
                  src={conversation.counterpart.avatarUrl}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{conversation.counterpart.displayName}</p>
                  <p className="truncate text-xs text-white/50">
                    {conversation.lastMessage?.body ?? "No messages yet"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      }
      subtitle={
        currentConversation
          ? `Thread with ${currentConversation.counterpart.displayName}`
          : "Conversation thread"
      }
      title="Direct message"
    >
      <LiveRefresh intervalMs={8000} />
      {currentConversation ? (
        <ConversationActions
          conversationId={params.conversationId}
          isArchived={currentConversation.isArchived}
          isMuted={currentConversation.isMuted}
          isPinned={currentConversation.isPinned}
          targetUserId={currentConversation.counterpart.id}
        />
      ) : null}
      <TypingIndicator conversationId={params.conversationId} />
      <SharedMediaPanel thread={thread} />
      <ConversationThread
        conversationId={params.conversationId}
        readState={readState}
        thread={thread}
        viewerId={viewer.id}
      />
    </AppShell>
  );
}
