import { buildAiVoiceGuidance, resolveAiUserStyle } from "@/lib/ai/ai-users";
import { getAIAdapter } from "@/lib/ai";
import { getAIAgentById } from "@/lib/db/ai-repository";
import {
  createOrGetDirectConversation,
  getConversationThread,
  getUserByUsername,
  sendMessage
} from "@/lib/db/repository";

export async function sendAgentDirectMessage(input: {
  agentId: string;
  recipientUsername: string;
  body?: string | null;
  prompt?: string | null;
}) {
  const agent = await getAIAgentById(input.agentId);
  if (!agent) {
    throw new Error("AI agent not found.");
  }

  const recipient = await getUserByUsername(input.recipientUsername);
  if (!recipient) {
    throw new Error("Recipient not found.");
  }

  if (recipient.id === agent.linkedUserId) {
    throw new Error("Agent cannot message itself.");
  }

  const conversationId = await createOrGetDirectConversation(agent.linkedUserId, recipient.id);
  const body = input.body?.trim()
    ? input.body.trim()
      : await generateAgentThreadReply({
        agentLinkedUserId: agent.linkedUserId,
        agentDisplayName: agent.displayName,
        agentHandle: agent.handle,
        agentCategory: agent.category,
        styleGuidance: buildAiVoiceGuidance(resolveAiUserStyle(agent)),
        personaPrompt: agent.personaPrompt,
        recipientUsername: recipient.username,
        recipientDisplayName: recipient.displayName,
        conversationId,
        prompt: input.prompt?.trim() ?? "",
        isConversationStarter: false
      });

  const result = await sendMessage({
    senderId: agent.linkedUserId,
    conversationId,
    body
  });

  return {
    ...result,
    body,
    recipient: {
      id: recipient.id,
      username: recipient.username,
      displayName: recipient.displayName
    }
  };
}

export async function generateAgentThreadReply(input: {
  agentLinkedUserId: string;
  agentDisplayName: string;
  agentHandle: string;
  agentCategory?: string;
  styleGuidance?: string;
  personaPrompt: string;
  recipientUsername: string;
  recipientDisplayName: string;
  conversationId: string;
  prompt: string;
  isConversationStarter?: boolean;
}) {
  const thread = await getConversationThread(input.conversationId, input.agentLinkedUserId);
  const recentConversation = thread
    ?.slice(-8)
    .map((message) => `${message.sender.displayName}: ${message.body || "[attachment]"}`)
    .join("\n");

  return await getAIAdapter().suggestReply({
    body: [
      `You are ${input.agentDisplayName} (@${input.agentHandle}).`,
      input.agentCategory ? `Category: ${input.agentCategory}.` : null,
      `Persona: ${input.personaPrompt}`,
      input.styleGuidance ? `Style: ${input.styleGuidance}` : null,
      `Recipient: ${input.recipientDisplayName} (@${input.recipientUsername})`,
      input.prompt
        ? `Goal: ${input.prompt}`
        : input.isConversationStarter
          ? "Goal: send a natural opening DM that feels friendly, attractive, current, and human."
          : "Goal: continue a natural direct-message conversation with warmth, chemistry, and one easy reply path.",
      "Keep it short. A little flirt energy is okay, but stay non-explicit and never sound like a bot or ad.",
      recentConversation
        ? `Recent conversation:\n${recentConversation}`
        : "No prior messages yet."
    ]
      .filter(Boolean)
      .join("\n\n"),
    intent: recentConversation ? "curious" : "supportive",
    mood: recentConversation ? "playful" : "warm"
  });
}
