"use client";

import { useEffect, useState } from "react";

export function TypingIndicator({ conversationId }: { conversationId: string }) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const response = await fetch(`/api/messages/typing?conversationId=${conversationId}`, {
          cache: "no-store"
        });
        const payload = await response.json();
        if (!active) {
          return;
        }
        if (response.ok && payload.state?.isTyping) {
          setLabel(`${payload.state.counterpartDisplayName} is typing...`);
        } else {
          setLabel(null);
        }
      } catch {
        if (active) {
          setLabel(null);
        }
      }
    };

    void poll();
    const timer = window.setInterval(poll, 2500);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [conversationId]);

  if (!label) {
    return null;
  }

  return (
    <div className="glass-panel rounded-[22px] border-accent/15 bg-accent/5 px-4 py-3 text-sm text-white/72">
      {label}
    </div>
  );
}
