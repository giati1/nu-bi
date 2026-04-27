import crypto from "crypto";
import { buildAiVoiceGuidance, resolveAiUserStyle } from "@/lib/ai/ai-users";
import { generateReply } from "@/lib/ai/ai-comments";
import { generateAgentThreadReply } from "@/lib/ai-agents/chat";
import { getCloudflareContextAsync } from "@/lib/cloudflare/context";
import { getAIAgentByLinkedUserId } from "@/lib/db/ai-repository";
import { all, get } from "@/lib/db/client";
import {
  addComment,
  getCommentsForPost,
  getConversationThread,
  getPostById,
  getUserById,
  sendMessage
} from "@/lib/db/repository";

type WaitUntilContext = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

type ReplyJobKind = "dm" | "comment";

const queuedJobKeys = new Set<string>();
const lastReplyAtByChannel = new Map<string, number>();

const DM_DELAY_RANGE_MS = { min: 2000, max: 8000 };
const COMMENT_DELAY_RANGE_MS = { min: 5000, max: 15000 };
const CHANNEL_COOLDOWN_RANGE_MS = { min: 5000, max: 10000 };

export function queueAiDmAutoReply(input: {
  conversationId: string;
  triggerMessageId: string;
  humanSenderId: string;
}) {
  const jobId = crypto.randomUUID();
  const jobKey = `dm:${input.conversationId}:${input.triggerMessageId}`;
  scheduleBackgroundTask({
    kind: "dm",
    jobId,
    jobKey,
    channelKey: `conversation:${input.conversationId}`,
    triggerId: input.triggerMessageId
  }, async () => {
    const aiRecipientId = await resolveConversationCounterpart(input.conversationId, input.humanSenderId);
    if (!aiRecipientId) {
      return;
    }

    const agent = await getAIAgentByLinkedUserId(aiRecipientId);
    if (!agent?.enabled || agent.linkedUserId === input.humanSenderId) {
      return;
    }

    if (await getAIAgentByLinkedUserId(input.humanSenderId)) {
      return;
    }

    await delay(randomBetween(DM_DELAY_RANGE_MS.min, DM_DELAY_RANGE_MS.max));

    const [thread, humanSender] = await Promise.all([
      getConversationThread(input.conversationId, agent.linkedUserId),
      getUserById(input.humanSenderId)
    ]);

    if (!thread || !humanSender) {
      return;
    }

    const triggerIndex = thread.findIndex((message) => message.id === input.triggerMessageId);
    if (triggerIndex === -1) {
      return;
    }

    const triggerMessage = thread[triggerIndex];
    if (!triggerMessage || triggerMessage.senderId !== input.humanSenderId) {
      return;
    }

    const alreadyAnswered = thread
      .slice(triggerIndex + 1)
      .some((message) => message.senderId === agent.linkedUserId);
    if (alreadyAnswered) {
      return;
    }

    const replyBody = (
      await generateAgentThreadReply({
        agentLinkedUserId: agent.linkedUserId,
        agentDisplayName: agent.displayName,
        agentHandle: agent.handle,
        agentCategory: agent.category,
        styleGuidance: buildAiVoiceGuidance(resolveAiUserStyle(agent)),
        personaPrompt: agent.personaPrompt,
        recipientUsername: humanSender.username,
        recipientDisplayName: humanSender.displayName,
        conversationId: input.conversationId,
        prompt:
          "Reply to the latest human message naturally. Keep it to 1-3 short sentences, sound like a real person, and end with a conversational follow-up only if it feels natural.",
        isConversationStarter: false
      })
    ).trim();

    if (!replyBody) {
      return;
    }

    await enforceChannelCooldown(`conversation:${input.conversationId}`);
    await sendMessage({
      senderId: agent.linkedUserId,
      conversationId: input.conversationId,
      body: replyBody
    });

    logReplySent({
      kind: "dm",
      jobId,
      channelKey: `conversation:${input.conversationId}`,
      actorId: agent.linkedUserId,
      triggerId: input.triggerMessageId
    });
  });
}

export function queueAiCommentAutoReply(input: {
  postId: string;
  triggerCommentId: string;
  humanCommenterId: string;
}) {
  const jobId = crypto.randomUUID();
  const jobKey = `comment:${input.postId}:${input.triggerCommentId}`;
  scheduleBackgroundTask({
    kind: "comment",
    jobId,
    jobKey,
    channelKey: `post:${input.postId}`,
    triggerId: input.triggerCommentId
  }, async () => {
    const postAuthor = await get<{ user_id: string }>(
      `SELECT user_id FROM posts WHERE id = ? AND deleted_at IS NULL`,
      [input.postId]
    );

    if (!postAuthor || postAuthor.user_id === input.humanCommenterId) {
      return;
    }

    const agent = await getAIAgentByLinkedUserId(postAuthor.user_id);
    if (!agent?.enabled) {
      return;
    }

    if (await getAIAgentByLinkedUserId(input.humanCommenterId)) {
      return;
    }

    await delay(randomBetween(COMMENT_DELAY_RANGE_MS.min, COMMENT_DELAY_RANGE_MS.max));

    const comments = await getCommentsForPost(input.postId);
    const triggerComment = comments.find((comment) => comment.id === input.triggerCommentId);
    if (!triggerComment || triggerComment.author.id !== input.humanCommenterId) {
      return;
    }

    if (triggerComment.depth >= 2) {
      return;
    }

    const alreadyAnswered = comments.some(
      (comment) =>
        comment.parentCommentId === triggerComment.id && comment.author.id === agent.linkedUserId
    );
    if (alreadyAnswered) {
      return;
    }

    const post = await getPostById(input.postId, agent.linkedUserId);
    if (!post) {
      return;
    }

    const replyBody = (await generateReply({
      post,
      parentComment: triggerComment,
      user: agent
    })).trim();

    if (!replyBody) {
      return;
    }

    await enforceChannelCooldown(`post:${input.postId}`);
    await addComment({
      postId: input.postId,
      viewerId: agent.linkedUserId,
      body: replyBody,
      parentCommentId: triggerComment.id
    });

    logReplySent({
      kind: "comment",
      jobId,
      channelKey: `post:${input.postId}`,
      actorId: agent.linkedUserId,
      triggerId: input.triggerCommentId
    });
  });
}

function scheduleBackgroundTask(
  meta: {
    kind: ReplyJobKind;
    jobId: string;
    jobKey: string;
    channelKey: string;
    triggerId: string;
  },
  taskFactory: () => Promise<void>
) {
  if (queuedJobKeys.has(meta.jobKey)) {
    console.log(
      `[ai-auto-reply:${meta.kind}] skipped duplicate queue jobId=${meta.jobId} trigger=${meta.triggerId}`
    );
    return;
  }

  queuedJobKeys.add(meta.jobKey);
  console.log(
    `[ai-auto-reply:${meta.kind}] queued jobId=${meta.jobId} channel=${meta.channelKey} trigger=${meta.triggerId}`
  );

  const task = taskFactory()
    .catch((error) => {
      console.error(`[ai-auto-reply:${meta.kind}] failed jobId=${meta.jobId}`, error);
    })
    .finally(() => {
      queuedJobKeys.delete(meta.jobKey);
    });

  void attachToCloudflareWaitUntil(task);
}

async function enforceChannelCooldown(channelKey: string) {
  const previousReplyAt = lastReplyAtByChannel.get(channelKey);
  if (!previousReplyAt) {
    lastReplyAtByChannel.set(channelKey, Date.now());
    return;
  }

  const cooldownMs = randomBetween(
    CHANNEL_COOLDOWN_RANGE_MS.min,
    CHANNEL_COOLDOWN_RANGE_MS.max
  );
  const elapsedMs = Date.now() - previousReplyAt;
  if (elapsedMs < cooldownMs) {
    await delay(cooldownMs - elapsedMs);
  }

  lastReplyAtByChannel.set(channelKey, Date.now());
}

function logReplySent(input: {
  kind: ReplyJobKind;
  jobId: string;
  channelKey: string;
  actorId: string;
  triggerId: string;
}) {
  console.log(
    `[ai-auto-reply:${input.kind}] sent jobId=${input.jobId} channel=${input.channelKey} actor=${input.actorId} trigger=${input.triggerId}`
  );
}

async function attachToCloudflareWaitUntil(task: Promise<void>) {
  try {
    const context = await getCloudflareContextAsync();
    const runtime = (context?.ctx ?? null) as WaitUntilContext | null;
    runtime?.waitUntil?.(task);
  } catch {}
}

async function resolveConversationCounterpart(conversationId: string, senderId: string) {
  const rows = await all<{ user_id: string }>(
    `SELECT user_id
     FROM conversation_members
     WHERE conversation_id = ?
       AND user_id <> ?
     LIMIT 2`,
    [conversationId, senderId]
  );

  if (rows.length !== 1) {
    return null;
  }

  return rows[0]?.user_id ?? null;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
