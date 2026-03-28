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

  return (
    <div className="space-y-4">
      <section className="glass-panel rounded-[24px] p-4">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
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
          description="Try a name, username, or phrase from the latest message."
          title="No matching conversations"
        />
      ) : (
        filtered.map((conversation) => (
          <Link
            className="glass-panel flex items-center gap-4 rounded-[28px] p-5 shadow-panel"
            href={`/messages/${conversation.id}`}
            key={conversation.id}
          >
            <Avatar
              className="h-14 w-14"
              name={conversation.counterpart.displayName}
              src={conversation.counterpart.avatarUrl}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-4">
                <p className="truncate font-semibold">
                  {conversation.isPinned ? "Pinned | " : ""}
                  {conversation.isArchived ? "Archived | " : ""}
                  {conversation.isMuted ? "Muted | " : ""}
                  {conversation.counterpart.displayName}
                </p>
                <p className="text-xs text-white/45">{formatRelativeDate(conversation.updatedAt)}</p>
              </div>
              <p className="truncate text-sm text-white/55">
                {conversation.lastMessage?.body ?? "Say hello"}
              </p>
            </div>
            {conversation.unreadCount > 0 ? (
              <span className="rounded-full bg-accent px-2 py-1 text-xs">{conversation.unreadCount}</span>
            ) : null}
          </Link>
        ))
      )}
    </div>
  );
}
