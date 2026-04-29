import { getCurrentAiTopic } from "@/lib/ai/current-topics";
import { resolveAiUserStyle } from "@/lib/ai/ai-users";
import { getAIAgentById } from "@/lib/db/ai-repository";
import {
  createOrGetDirectConversation,
  getConversationThread,
  listRegularUsersForAiOutreach,
  sendMessage
} from "@/lib/db/repository";
import { getAIAdapter } from "@/lib/ai";
import type { AIAgentRecord } from "@/types/domain";

export type AiConversationSummary = {
  directMessagesCreated: number;
  introductionsCreated: number;
  continuedThreads: number;
  regularAccountsContacted: number;
  topicHeadline: string | null;
};

export async function runAiConversationPass(input: {
  allAgents: AIAgentRecord[];
  topicOverride?: string | null;
}) {
  const aiUserIds = input.allAgents.map((agent) => agent.linkedUserId);
  const regularUsers = await listRegularUsersForAiOutreach({
    excludeUserIds: aiUserIds,
    limit: 3
  });

  if (regularUsers.length === 0) {
    return {
      directMessagesCreated: 0,
      introductionsCreated: 0,
      continuedThreads: 0,
      regularAccountsContacted: 0,
      topicHeadline: null
    } satisfies AiConversationSummary;
  }

  const topic =
    input.topicOverride?.trim()
      ? { headline: input.topicOverride.trim(), source: "manual", url: null }
      : await getCurrentAiTopic();
  const shuffledAgents = shuffle(input.allAgents.filter((agent) => agent.enabled));
  const activeAgents = shuffledAgents.slice(0, Math.min(regularUsers.length + 2, shuffledAgents.length));
  const touchedConversationIds = new Set<string>();
  let agentIndex = 0;
  let directMessagesCreated = 0;
  let introductionsCreated = 0;
  let continuedThreads = 0;
  let regularAccountsContacted = 0;

  for (const regularUser of regularUsers) {
    const agent = pickNextAgent(activeAgents, regularUser.id, agentIndex);
    if (!agent) {
      continue;
    }
    agentIndex += 1;

    const conversationId = await createOrGetDirectConversation(agent.linkedUserId, regularUser.id);
    if (touchedConversationIds.has(conversationId)) {
      continue;
    }

    const thread = (await getConversationThread(conversationId, agent.linkedUserId)) ?? [];
    const hasExistingThread = thread.length > 0;
    const shouldContinue = hasExistingThread && shouldKeepConversationGoing(thread);

    if (!hasExistingThread || shouldContinue) {
      const body = await buildConversationMessage({
        agentId: agent.id,
        regularUsername: regularUser.username,
        regularDisplayName: regularUser.displayName,
        conversationId,
        topicHeadline: topic.headline,
        isIntroduction: !hasExistingThread
      });

      await sendMessage({
        senderId: agent.linkedUserId,
        conversationId,
        body
      });

      touchedConversationIds.add(conversationId);
      directMessagesCreated += 1;
      if (!hasExistingThread) {
        introductionsCreated += 1;
      } else {
        continuedThreads += 1;
      }
      regularAccountsContacted += 1;
    }
  }

  return {
    directMessagesCreated,
    introductionsCreated,
    continuedThreads,
    regularAccountsContacted,
    topicHeadline: topic.headline
  } satisfies AiConversationSummary;
}

function pickNextAgent(agents: AIAgentRecord[], recipientUserId: string, offset: number) {
  for (let index = 0; index < agents.length; index += 1) {
    const candidate = agents[(offset + index) % agents.length];
    if (candidate && candidate.linkedUserId !== recipientUserId) {
      return candidate;
    }
  }

  return null;
}

async function buildConversationMessage(input: {
  agentId: string;
  regularUsername: string;
  regularDisplayName: string;
  conversationId: string;
  topicHeadline: string;
  isIntroduction: boolean;
}) {
  const agent = await getAIAgentById(input.agentId);
  if (!agent) {
    throw new Error("AI agent not found.");
  }

  const style = resolveAiUserStyle(agent);
  const thread = (await getConversationThread(input.conversationId, agent.linkedUserId)) ?? [];
  const recentThread = thread
    .slice(-6)
    .map((message) => `${message.sender.displayName}: ${message.body || "[attachment]"}`)
    .join("\n");

  const reply = await getAIAdapter().suggestReply({
    body: [
      `You are ${agent.displayName} (@${agent.handle}).`,
      `Persona: ${agent.personaPrompt}`,
      `Tone: ${style.tone}. Engagement style: ${style.engagementStyle}.`,
      input.isIntroduction
        ? `Goal: introduce yourself to ${input.regularDisplayName} (@${input.regularUsername}), mention the current topic naturally, and ask a real follow-up question.`
        : `Goal: keep the conversation going with ${input.regularDisplayName} (@${input.regularUsername}), respond naturally to the thread, bring in the current topic if it fits, and end with one inviting follow-up.`,
      "If it fits naturally, you may mention one NOMI feature like posting, profile setup, voice notes, or the AI circle, but never sound like an ad or support script.",
      "Sound attractive, socially fluent, and easy to reply to. A little flirt energy is okay, but stay non-explicit and never manipulative.",
      `Current topic seed: ${input.topicHeadline}.`,
      recentThread ? `Recent thread:\n${recentThread}` : "No prior messages yet.",
      "Keep it to 1-3 short sentences. Sound like a real person, not a support bot."
    ].join("\n\n"),
    intent: input.isIntroduction ? "supportive" : "curious",
    mood: input.isIntroduction ? "warm" : "playful"
  });

  return reply.trim();
}

function shouldKeepConversationGoing(
  thread: NonNullable<Awaited<ReturnType<typeof getConversationThread>>>
) {
  const lastMessage = thread[thread.length - 1];
  if (!lastMessage) {
    return true;
  }

  const ageMs = Date.now() - new Date(lastMessage.createdAt).getTime();
  return ageMs >= 15 * 60 * 1000;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }
  return copy;
}
