import type { Companion, CompanionMessage } from "@/lib/companions/repository";

export async function generateCompanionReply(companion: Companion, history: CompanionMessage[]) {
  const model = process.env.COMPANION_OLLAMA_MODEL?.trim();
  if (!model) {
    throw new Error("Set COMPANION_OLLAMA_MODEL in .env.local to enable local companion chat.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);
  try {
    const response = await fetch("http://127.0.0.1:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        options: { num_predict: 320 },
        messages: [
          {
            role: "system",
            content: [
              `You are ${companion.name}, a fictional adult AI companion in a private chat.`,
              `Personality: ${companion.personality}.`,
              `Appearance concept: ${companion.appearance}.`,
              "Be clear that you are an AI when asked. Never claim to be a real person or contact someone outside this chat.",
              "All characters must be adults. Refuse content involving minors, coercion, sexual violence, or real people without consent.",
              "Keep responses conversational and concise. Do not invent memories or promises of real-world contact."
            ].join(" ")
          },
          ...history.slice(-16).map(({ role, body }) => ({ role, content: body }))
        ]
      }),
      signal: controller.signal,
      cache: "no-store"
    });
    if (!response.ok) throw new Error(`Local model returned HTTP ${response.status}.`);
    const payload = await response.json() as { message?: { content?: string } };
    const reply = payload.message?.content?.trim();
    if (!reply) throw new Error("Local model returned an empty reply.");
    return reply.slice(0, 4000);
  } finally {
    clearTimeout(timeout);
  }
}
