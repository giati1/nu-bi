import type { PersonaId } from "@/lib/ai-tools/contracts";
import { aiPersonas } from "@/lib/ai-tools/contracts";
import { env } from "@/lib/config/env";

type ConversationMessage = {
  role: "user" | "assistant";
  body: string;
};

export async function generatePersonaReply(input: {
  personaId: PersonaId;
  message: string;
  history: ConversationMessage[];
}) {
  const persona = aiPersonas.find((entry) => entry.id === input.personaId);
  if (!persona) {
    throw new Error("Unknown persona.");
  }

  if (!env.openAiApiKey) {
    return {
      reply: buildFallbackPersonaReply(persona.id, input.message),
      provider: "mock-persona"
    };
  }

  const response = await fetch(`${env.openAiBaseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: env.openAiTextModel,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are NOMI AI chat.",
                "The chosen persona changes tone only, not capability or intelligence.",
                "Answer normal questions clearly and directly.",
                `Persona name: ${persona.name}.`,
                `Persona style: ${persona.style}.`,
                persona.id === "EchoX1"
                  ? "Use sarcastic, gritty, funny, direct phrasing without becoming hostile or useless."
                  : persona.id === "EchoRaw"
                    ? "Use calm, reflective, spiritually grounded phrasing without becoming vague."
                    : "Use polite, helpful, clean assistant phrasing.",
                "Keep replies concise, helpful, and app-friendly.",
                "Do not mention model names, providers, or backend systems."
              ].join(" ")
            }
          ]
        },
        ...input.history.slice(-6).map((message) => ({
          role: message.role,
          content: [{ type: "input_text", text: message.body }]
        })),
        {
          role: "user",
          content: [{ type: "input_text", text: input.message }]
        }
      ]
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "Failed to generate persona reply.");
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const reply = extractOutputText(payload) || buildFallbackPersonaReply(persona.id, input.message);
  return {
    reply,
    provider: "openai-persona"
  };
}

function buildFallbackPersonaReply(personaId: PersonaId, message: string) {
  const trimmed = message.trim();
  const lower = trimmed.toLowerCase();
  const core =
    lower.includes("idea") || lower.includes("brainstorm")
      ? "Start tighter. Pick one clear angle, one visual, and one action so the answer actually lands."
      : lower.includes("how") || lower.includes("?")
        ? "Short answer: define the goal first, strip the fluff second, then ship the clearest version."
        : "The useful move is to turn that into one direct next step instead of letting it stay vague.";

  switch (personaId) {
    case "EchoX1":
      return `${core} That is the part people usually dodge because chaos feels smarter than clarity.`;
    case "EchoRaw":
      return `${core} Let it be simple enough that the next move feels calm, not forced.`;
    case "EchoX2":
    default:
      return `${core} If you want, I can turn that into a cleaner plan or a stronger message draft.`;
  }
}

function extractOutputText(response: Record<string, unknown>) {
  const outputText = response.output_text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText.trim();
  }

  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object" || !("content" in item)) {
      continue;
    }
    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? ((item as { content?: unknown[] }).content as Array<Record<string, unknown>>)
      : [];
    for (const part of content) {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
}
