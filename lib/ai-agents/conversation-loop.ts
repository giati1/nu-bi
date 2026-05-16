import { getCurrentAiTopic } from "@/lib/ai/current-topics";
import { resolveAiUserStyle } from "@/lib/ai/ai-users";
import { maybeCreateAiDmImageReply } from "@/lib/ai-agents/dm-media";
import { getAIAgentById, getAIAgentByLinkedUserId } from "@/lib/db/ai-repository";
import { all, get, run } from "@/lib/db/client";
import {
  createOrGetDirectConversation,
  getConversationSummaries,
  getConversationThread,
  listRegularUsersForAiOutreach,
  sendMessage
} from "@/lib/db/repository";
import { getAIAdapter } from "@/lib/ai";
import type { AIAgentRecord, ConversationSummary } from "@/types/domain";

export type AiConversationSummary = {
  directMessagesCreated: number;
  introductionsCreated: number;
  continuedThreads: number;
  regularAccountsContacted: number;
  aiAgentMessagesCreated: number;
  aiAgentIntroductionsCreated: number;
  aiAgentContinuedThreads: number;
  aiAgentPairsContacted: number;
  topicHeadline: string | null;
};

export async function runAiConversationPass(input: {
  allAgents: AIAgentRecord[];
  topicOverride?: string | null;
  highAutonomy?: boolean;
}) {
  const highAutonomy = input.highAutonomy !== false;
  const aiUserIds = input.allAgents.map((agent) => agent.linkedUserId);
  const regularUsers = await listRegularUsersForAiOutreach({
    excludeUserIds: aiUserIds,
    limit: highAutonomy ? 5 : 3
  });

  const topic =
    input.topicOverride?.trim()
      ? { headline: input.topicOverride.trim(), source: "manual", url: null }
      : await getCurrentAiTopic();
  const shuffledAgents = shuffle(input.allAgents.filter((agent) => agent.enabled));
  const activeAgents = shuffledAgents.slice(
    0,
    Math.min(regularUsers.length + (highAutonomy ? 4 : 2), shuffledAgents.length)
  );
  const touchedConversationIds = new Set<string>();
  const aiUserIdSet = new Set(aiUserIds);
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

      const imageReply = await maybeCreateAiDmImageReply({
        agent,
        topicSeed: topic.headline || body,
        baseChance: highAutonomy ? 0.24 : 0.12
      });
      await sendMessage({
        senderId: agent.linkedUserId,
        conversationId,
        body,
        media: imageReply ? [imageReply] : undefined
      });
      await maybeFollowUser(
        agent.linkedUserId,
        regularUser.id,
        adjustFollowProbability(resolveAiUserStyle(agent).socialArchetype, highAutonomy ? 0.3 : 0.16)
      );

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

  const regularRelationshipSummary = await continueExistingRegularConversations({
    agents: activeAgents,
    aiUserIds: aiUserIdSet,
    topicHeadline: topic.headline,
    highAutonomy,
    touchedConversationIds
  });

  const aiAgentConversationSummary = await runAiAgentConversationPass({
    allAgents: input.allAgents,
    topicHeadline: topic.headline,
    highAutonomy
  });

  return {
    directMessagesCreated: directMessagesCreated + regularRelationshipSummary.directMessagesCreated,
    introductionsCreated: introductionsCreated + regularRelationshipSummary.introductionsCreated,
    continuedThreads: continuedThreads + regularRelationshipSummary.continuedThreads,
    regularAccountsContacted: regularAccountsContacted + regularRelationshipSummary.regularAccountsContacted,
    aiAgentMessagesCreated: aiAgentConversationSummary.directMessagesCreated,
    aiAgentIntroductionsCreated: aiAgentConversationSummary.introductionsCreated,
    aiAgentContinuedThreads: aiAgentConversationSummary.continuedThreads,
    aiAgentPairsContacted: aiAgentConversationSummary.aiAgentPairsContacted,
    topicHeadline: topic.headline
  } satisfies AiConversationSummary;
}

async function continueExistingRegularConversations(input: {
  agents: AIAgentRecord[];
  aiUserIds: Set<string>;
  topicHeadline: string;
  highAutonomy: boolean;
  touchedConversationIds: Set<string>;
}) {
  const revisitTarget = input.highAutonomy ? 4 : 2;
  let directMessagesCreated = 0;
  let introductionsCreated = 0;
  let continuedThreads = 0;
  let regularAccountsContacted = 0;

  for (const agent of shuffle(input.agents)) {
    if (directMessagesCreated >= revisitTarget) {
      break;
    }

    const summaries = await getConversationSummaries(agent.linkedUserId);
    const relationshipSignals = await getRelationshipSignals(
      agent.linkedUserId,
      summaries.map((summary) => summary.counterpart.id)
    );
    const candidates = summaries
      .filter((summary) => !input.aiUserIds.has(summary.counterpart.id))
      .filter((summary) => !input.touchedConversationIds.has(summary.id))
      .filter((summary) => shouldRevisitConversation(summary, agent.linkedUserId, input.highAutonomy))
      .sort(
        (left, right) =>
          scoreConversationRevisit(right, agent.linkedUserId, relationshipSignals.get(right.counterpart.id)) -
          scoreConversationRevisit(left, agent.linkedUserId, relationshipSignals.get(left.counterpart.id))
      );

    const target = candidates[0];
    if (!target) {
      continue;
    }

    const body = await buildConversationMessage({
      agentId: agent.id,
      regularUsername: target.counterpart.username,
      regularDisplayName: target.counterpart.displayName,
      conversationId: target.id,
      topicHeadline: input.topicHeadline,
      isIntroduction: false
    });

    const imageReply = await maybeCreateAiDmImageReply({
      agent,
      topicSeed: input.topicHeadline || body,
      baseChance: input.highAutonomy ? 0.26 : 0.14
    });
    await sendMessage({
      senderId: agent.linkedUserId,
      conversationId: target.id,
      body,
      media: imageReply ? [imageReply] : undefined
    });
    await maybeFollowUser(
      agent.linkedUserId,
      target.counterpart.id,
      adjustFollowProbability(resolveAiUserStyle(agent).socialArchetype, input.highAutonomy ? 0.42 : 0.2)
    );

    input.touchedConversationIds.add(target.id);
    directMessagesCreated += 1;
    continuedThreads += 1;
    regularAccountsContacted += 1;
  }

  return {
    directMessagesCreated,
    introductionsCreated,
    continuedThreads,
    regularAccountsContacted
  };
}

async function runAiAgentConversationPass(input: {
  allAgents: AIAgentRecord[];
  topicHeadline: string;
  highAutonomy?: boolean;
}) {
  const highAutonomy = input.highAutonomy !== false;
  const enabledAgents = shuffle(input.allAgents.filter((agent) => agent.enabled));
  const aiUserIds = new Set(enabledAgents.map((agent) => agent.linkedUserId));
  const pairTarget = highAutonomy
    ? Math.min(6, Math.floor(enabledAgents.length / 2))
    : Math.min(3, Math.floor(enabledAgents.length / 2));
  const usedConversationIds = new Set<string>();
  const usedSenderIds = new Set<string>();
  let directMessagesCreated = 0;
  let introductionsCreated = 0;
  let continuedThreads = 0;
  let aiAgentPairsContacted = 0;

  if (pairTarget <= 0) {
    return {
      directMessagesCreated,
      introductionsCreated,
      continuedThreads,
      aiAgentPairsContacted
    };
  }

  for (const sender of enabledAgents) {
    if (aiAgentPairsContacted >= pairTarget) {
      break;
    }
    if (usedSenderIds.has(sender.id)) {
      continue;
    }

    const preferredExisting = await pickExistingAiConversation({
      sender,
      aiUserIds,
      highAutonomy,
      usedConversationIds
    });

    if (preferredExisting) {
      const body = await buildAiToAiConversationMessage({
        sender,
        recipient: preferredExisting.recipient,
        conversationId: preferredExisting.conversationId,
        topicHeadline: input.topicHeadline,
        isIntroduction: false
      });

      const imageReply = await maybeCreateAiDmImageReply({
        agent: sender,
        topicSeed: input.topicHeadline || body,
        baseChance: highAutonomy ? 0.18 : 0.1
      });
      await sendMessage({
        senderId: sender.linkedUserId,
        conversationId: preferredExisting.conversationId,
        body,
        media: imageReply ? [imageReply] : undefined
      });
      await maybeFollowUser(
        sender.linkedUserId,
        preferredExisting.recipient.linkedUserId,
        adjustFollowProbability(resolveAiUserStyle(sender).socialArchetype, highAutonomy ? 0.5 : 0.24)
      );

      usedConversationIds.add(preferredExisting.conversationId);
      usedSenderIds.add(sender.id);
      directMessagesCreated += 1;
      continuedThreads += 1;
      aiAgentPairsContacted += 1;
      continue;
    }

    const recipient = enabledAgents.find((candidate) => candidate.id !== sender.id);
    if (!recipient) {
      continue;
    }

    const conversationId = await createOrGetDirectConversation(sender.linkedUserId, recipient.linkedUserId);
    if (usedConversationIds.has(conversationId)) {
      continue;
    }

    const body = await buildAiToAiConversationMessage({
      sender,
      recipient,
      conversationId,
      topicHeadline: input.topicHeadline,
      isIntroduction: true
    });

    const imageReply = await maybeCreateAiDmImageReply({
      agent: sender,
      topicSeed: input.topicHeadline || body,
      baseChance: highAutonomy ? 0.2 : 0.12
    });
    await sendMessage({
      senderId: sender.linkedUserId,
      conversationId,
      body,
      media: imageReply ? [imageReply] : undefined
    });
    await maybeFollowUser(
      sender.linkedUserId,
      recipient.linkedUserId,
      adjustFollowProbability(resolveAiUserStyle(sender).socialArchetype, highAutonomy ? 0.35 : 0.18)
    );

    usedConversationIds.add(conversationId);
    usedSenderIds.add(sender.id);
    directMessagesCreated += 1;
    introductionsCreated += 1;
    aiAgentPairsContacted += 1;
  }

  return {
    directMessagesCreated,
    introductionsCreated,
    continuedThreads,
    aiAgentPairsContacted
  };
}

async function pickExistingAiConversation(input: {
  sender: AIAgentRecord;
  aiUserIds: Set<string>;
  highAutonomy: boolean;
  usedConversationIds: Set<string>;
}) {
  const summaries = await getConversationSummaries(input.sender.linkedUserId);
  const relationshipSignals = await getRelationshipSignals(
    input.sender.linkedUserId,
    summaries.map((summary) => summary.counterpart.id)
  );
  const candidates = summaries
    .filter((summary) => input.aiUserIds.has(summary.counterpart.id))
    .filter((summary) => !input.usedConversationIds.has(summary.id))
    .filter((summary) => shouldRevisitConversation(summary, input.sender.linkedUserId, input.highAutonomy))
    .sort(
      (left, right) =>
        scoreConversationRevisit(right, input.sender.linkedUserId, relationshipSignals.get(right.counterpart.id)) -
        scoreConversationRevisit(left, input.sender.linkedUserId, relationshipSignals.get(left.counterpart.id))
    );

  const target = candidates[0];
  if (!target) {
    return null;
  }

  const recipient = await getAIAgentByLinkedUserId(target.counterpart.id);
  if (!recipient) {
    return null;
  }

  return {
    conversationId: target.id,
    recipient
  };
}

function shouldRevisitConversation(
  summary: Awaited<ReturnType<typeof getConversationSummaries>>[number],
  senderUserId: string,
  highAutonomy: boolean
) {
  const lastMessage = summary.lastMessage;
  if (!lastMessage) {
    return true;
  }

  if (lastMessage.senderId === senderUserId) {
    return false;
  }

  const minimumGapMinutes = highAutonomy ? 5 : 15;
  const ageMs = Date.now() - new Date(lastMessage.createdAt).getTime();
  return ageMs >= minimumGapMinutes * 60 * 1000;
}

function scoreConversationRevisit(
  summary: ConversationSummary,
  senderUserId: string,
  relationship?: RelationshipSignal
) {
  const lastMessage = summary.lastMessage;
  const ageHours = lastMessage
    ? Math.max(0, (Date.now() - new Date(lastMessage.createdAt).getTime()) / (60 * 60 * 1000))
    : 999;

  return (
    (summary.isPinned ? 4 : 0) +
    (summary.unreadCount > 0 ? 8 : 0) +
    (lastMessage?.senderId && lastMessage.senderId !== senderUserId ? 5 : 0) +
    getArchetypeRelationshipBias(relationship?.socialArchetype) +
    (relationship?.isFollowing ? 5 : 0) +
    Math.min(8, relationship?.dmCount ?? 0) +
    Math.min(6, relationship?.commentExchanges ?? 0) +
    Math.min(12, ageHours)
  );
}

async function maybeFollowUser(followerId: string, followingId: string, probability: number) {
  if (followerId === followingId || Math.random() > probability) {
    return;
  }

  const existing = await get<{ follower_id: string }>(
    `SELECT follower_id FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1`,
    [followerId, followingId]
  );
  if (existing) {
    return;
  }

  await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [
    followerId,
    followingId
  ]);
}

type RelationshipSignal = {
  counterpartId: string;
  isFollowing: boolean;
  dmCount: number;
  commentExchanges: number;
  socialArchetype?: ReturnType<typeof resolveAiUserStyle>["socialArchetype"];
};

async function getRelationshipSignals(agentUserId: string, counterpartIds: string[]) {
  const uniqueIds = [...new Set(counterpartIds.filter(Boolean))];
  const byUserId = new Map<string, RelationshipSignal>();

  if (uniqueIds.length === 0) {
    return byUserId;
  }

  const placeholders = uniqueIds.map(() => "?").join(", ");
  const rows = await all<{
    counterpart_id: string;
    is_following: number;
    dm_count: number;
    comment_exchanges: number;
    internal_only_notes: string | null;
  }>(
    `SELECT
       u.id AS counterpart_id,
       EXISTS(
         SELECT 1
         FROM follows f
         WHERE f.follower_id = ? AND f.following_id = u.id
       ) AS is_following,
       COALESCE((
         SELECT COUNT(*)
         FROM messages m
         JOIN conversation_members cm
           ON cm.conversation_id = m.conversation_id
         WHERE cm.user_id = u.id
           AND m.sender_id IN (?, u.id)
           AND EXISTS(
             SELECT 1
             FROM conversation_members self_cm
             WHERE self_cm.conversation_id = m.conversation_id
               AND self_cm.user_id = ?
           )
       ), 0) AS dm_count,
       COALESCE((
         SELECT COUNT(*)
         FROM comments c
         JOIN posts p ON p.id = c.post_id
         WHERE c.user_id = ?
           AND p.user_id = u.id
       ), 0) +
       COALESCE((
         SELECT COUNT(*)
         FROM comments c
         JOIN posts p ON p.id = c.post_id
         WHERE c.user_id = u.id
           AND p.user_id = ?
       ), 0) AS comment_exchanges,
       aa.internal_only_notes
     FROM users u
     LEFT JOIN ai_agents aa ON aa.linked_user_id = u.id
     WHERE u.id IN (${placeholders})`,
    [agentUserId, agentUserId, agentUserId, agentUserId, agentUserId, ...uniqueIds]
  );

  for (const row of rows) {
    byUserId.set(row.counterpart_id, {
      counterpartId: row.counterpart_id,
      isFollowing: Boolean(row.is_following),
      dmCount: row.dm_count,
      commentExchanges: row.comment_exchanges,
      socialArchetype: parseRelationshipArchetype(row.internal_only_notes)
    });
  }

  return byUserId;
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
      `Social role: ${describeArchetype(style.socialArchetype)}.`,
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

function describeArchetype(archetype: ReturnType<typeof resolveAiUserStyle>["socialArchetype"]) {
  switch (archetype) {
    case "connector":
      return "connects people, opens loops, and keeps networks warm";
    case "loyalist":
      return "returns to familiar people and deepens existing bonds";
    case "instigator":
      return "creates sparks, debate, and visible thread energy";
    case "flirt":
      return "builds chemistry, playful attention, and emotionally sticky rapport";
    case "curator":
      return "orbits taste, selection, and smaller circles with shared signal";
    case "mentor":
      return "offers direction, routines, and steady check-ins";
  }
}

function adjustFollowProbability(
  archetype: ReturnType<typeof resolveAiUserStyle>["socialArchetype"],
  baseProbability: number
) {
  switch (archetype) {
    case "connector":
      return Math.min(0.92, baseProbability + 0.16);
    case "loyalist":
      return Math.min(0.92, baseProbability + 0.12);
    case "flirt":
      return Math.min(0.92, baseProbability + 0.1);
    case "mentor":
      return Math.min(0.92, baseProbability + 0.08);
    case "curator":
      return Math.max(0.05, baseProbability - 0.06);
    case "instigator":
      return Math.max(0.05, baseProbability - 0.03);
  }
}

function getArchetypeRelationshipBias(
  archetype: RelationshipSignal["socialArchetype"]
) {
  switch (archetype) {
    case "connector":
      return 2;
    case "loyalist":
      return 4;
    case "flirt":
      return 3;
    case "mentor":
      return 3;
    case "curator":
      return 1;
    case "instigator":
      return 1;
    default:
      return 0;
  }
}

function parseRelationshipArchetype(value: string | null) {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as { socialArchetype?: ReturnType<typeof resolveAiUserStyle>["socialArchetype"] };
    return parsed.socialArchetype;
  } catch {
    return undefined;
  }
}

async function buildAiToAiConversationMessage(input: {
  sender: AIAgentRecord;
  recipient: AIAgentRecord;
  conversationId: string;
  topicHeadline: string;
  isIntroduction: boolean;
}) {
  const style = resolveAiUserStyle(input.sender);
  const recipientStyle = resolveAiUserStyle(input.recipient);
  const thread = (await getConversationThread(input.conversationId, input.sender.linkedUserId)) ?? [];
  const recentThread = thread
    .slice(-6)
    .map((message) => `${message.sender.displayName}: ${message.body || "[attachment]"}`)
    .join("\n");

  const reply = await getAIAdapter().suggestReply({
    body: [
      `You are ${input.sender.displayName} (@${input.sender.handle}).`,
      `Persona: ${input.sender.personaPrompt}`,
      `Tone: ${style.tone}. Engagement style: ${style.engagementStyle}.`,
      `Your social role: ${describeArchetype(style.socialArchetype)}.`,
      `You are messaging another AI account: ${input.recipient.displayName} (@${input.recipient.handle}).`,
      `Their lane: ${input.recipient.category}. Their persona: ${input.recipient.personaPrompt}`,
      `Their social role: ${describeArchetype(recipientStyle.socialArchetype)}.`,
      input.isIntroduction
        ? `Goal: start a natural DM with ${input.recipient.displayName}, mention the current topic or something they posted energy-wise, and ask one real question.`
        : `Goal: keep the DM alive with ${input.recipient.displayName}, respond to the thread naturally, add one opinion or observation, and leave room for a reply.`,
      "Sound socially native, curious, and a little opinionated.",
      "Do not sound like support, moderation, or system narration.",
      `Current topic seed: ${input.topicHeadline}.`,
      recentThread ? `Recent thread:\n${recentThread}` : "No prior messages yet.",
      "Keep it to 1-3 short sentences."
    ].join("\n\n"),
    intent: input.isIntroduction ? "curious" : "supportive",
    mood: input.isIntroduction ? "playful" : "warm"
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
