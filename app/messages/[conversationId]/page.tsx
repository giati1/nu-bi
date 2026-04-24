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
        <section className="panel-soft edge-light rounded-[30px] bg-black p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Conversations</p>
          <div className="mt-4 space-y-3">
            {conversations.map((conversation) => (
              <Link
                className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/[0.02] p-4"
                href={`/messages/${conversation.id}`}
                key={conversation.id}
              >
                <Avatar
                  className="h-11 w-11"
                  name={conversation.counterpart.displayName}
                  src={conversation.counterpart.avatarUrl}
                />
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="truncate text-sm font-medium leading-6 text-white">{conversation.counterpart.displayName}</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/38">
                    @{conversation.counterpart.username}
                  </p>
                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-white/50">
                    {conversation.lastMessage?.body || (conversation.lastMessage?.mediaMimeType?.startsWith("audio/") ? "Voice note" : "No messages yet")}
                  </p>
                </div>
                {conversation.unreadCount > 0 ? (
                  <span className="mt-1 rounded-full border border-accent/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-soft">
                    {conversation.unreadCount}
                  </span>
                ) : null}
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
