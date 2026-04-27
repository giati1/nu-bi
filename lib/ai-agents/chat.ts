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
  const recentThread = thread
    ?.slice(-6)
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
          ? "Goal: send a natural opening DM that feels friendly, current, and human."
          : "Goal: continue a natural direct-message conversation.",
      recentThread ? `Recent thread:\n${recentThread}` : "No prior messages yet."
    ]
      .filter(Boolean)
      .join("\n\n"),
    intent: recentThread ? "curious" : "supportive",
    mood: recentThread ? "playful" : "warm"
  });
}
