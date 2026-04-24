"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { EmptyState } from "@/components/empty-state";
import { formatRelativeDate } from "@/lib/utils";
import type { ConversationSummary } from "@/types/domain";

export function MessagesList({ conversations }: { conversations: ConversationSummary[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return conversations;
    }
    return conversations.filter((conversation) =>
      [
        conversation.counterpart.displayName,
        conversation.counterpart.username,
        conversation.lastMessage?.body ?? ""
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized)
    );
  }, [conversations, query]);

  const stats = useMemo(() => {
    return {
      total: conversations.length,
      unread: conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
      pinned: conversations.filter((conversation) => conversation.isPinned).length
    };
  }, [conversations]);

  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Threads", value: stats.total },
          { label: "Unread", value: stats.unread },
          { label: "Pinned", value: stats.pinned }
        ].map((item) => (
          <div className="panel-soft edge-light rounded-[24px] bg-black p-4" key={item.label}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-white">{item.value}</p>
          </div>
        ))}
      </section>
      <section className="panel-soft edge-light rounded-[26px] bg-black p-4">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <Search className="h-4 w-4 text-white/45" />
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people or messages"
            value={query}
          />
        </label>
      </section>
      {filtered.length === 0 ? (
        <EmptyState
          actionHref={conversations.length === 0 ? "/explore" : undefined}
          actionLabel={conversations.length === 0 ? "Find people to follow" : undefined}
          description={
            conversations.length === 0
              ? "You do not have any conversations yet. Follow people from Explore, then message them from their profile."
              : "Try a name, username, or phrase from the latest message."
          }
          title={conversations.length === 0 ? "No messages yet" : "No matching conversations"}
        />
      ) : (
        filtered.map((conversation) => (
          <Link
            className="panel-soft edge-light flex items-start gap-4 rounded-[30px] bg-black p-5 transition hover:border-white/15 hover:bg-white/[0.02]"
            href={`/messages/${conversation.id}`}
            key={conversation.id}
          >
            <Avatar
              className="h-14 w-14"
              name={conversation.counterpart.displayName}
              src={conversation.counterpart.avatarUrl}
            />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold leading-6 text-white">
                    {conversation.counterpart.displayName}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/38">
                    @{conversation.counterpart.username}
                  </p>
                </div>
                <p className="shrink-0 pt-0.5 text-xs uppercase tracking-[0.12em] text-white/40">{formatRelativeDate(conversation.updatedAt)}</p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {conversation.isPinned ? <StatePill label="Pinned" /> : null}
                {conversation.isArchived ? <StatePill label="Archived" /> : null}
                {conversation.isMuted ? <StatePill label="Muted" /> : null}
                {conversation.unreadCount > 0 ? <StatePill accent label={`${conversation.unreadCount} new`} /> : null}
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-white/68">
                {formatConversationPreview(conversation)}
              </p>
            </div>
            {conversation.unreadCount > 0 ? (
              <span className="mt-1 rounded-full border border-accent/40 px-2 py-1 text-xs text-accent-soft">Unread</span>
            ) : null}
          </Link>
        ))
      )}
    </div>
  );
}

function StatePill({ label, accent = false }: { label: string; accent?: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
        accent ? "border border-accent/40 text-accent-soft" : "border border-white/10 bg-white/[0.03] text-white/62"
      }`}
    >
      {label}
    </span>
  );
}

function formatConversationPreview(conversation: ConversationSummary) {
  const message = conversation.lastMessage;
  if (!message) {
    return "Say hello";
  }

  const mine = message.senderId !== conversation.counterpart.id;
  const prefix = mine ? "You: " : "";

  if (message.body) {
    return `${prefix}${message.body}`;
  }

  if (message.mediaMimeType?.startsWith("audio/")) {
    return `${prefix}sent a voice note`;
  }
  if (message.mediaMimeType?.startsWith("video/")) {
    return `${prefix}sent a video`;
  }
  if (message.mediaMimeType) {
    return `${prefix}sent an attachment`;
  }

  return "Say hello";
}
