import { isAutomatedVoiceUsername } from "@/lib/arena-personas";
import { getCloudflareContextAsync } from "@/lib/cloudflare/context";
import { env } from "@/lib/config/env";
import { getAIAgentByLinkedUserId } from "@/lib/db/ai-repository";
import { get } from "@/lib/db/client";
import {
  getCommentsForPost,
  getConversationThread,
  getPostById,
  getUserById
} from "@/lib/db/repository";
import type { FeedPost } from "@/types/domain";

type WaitUntilContext = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

type DynamicCloudflareEnv = Record<string, string | undefined>;

async function resolveDispatcherConfig() {
  const cfContext = await getCloudflareContextAsync();
  const cfEnv = (cfContext?.env ?? {}) as unknown as DynamicCloudflareEnv;

  const endpoint = (cfEnv.LOCAL_AI_ENDPOINT ?? env.localAiEndpoint ?? "").trim();
  const secret = (cfEnv.LOCAL_AGENT_SECRET ?? env.localAgentSecret ?? "").trim();

  return {
    endpoint,
    secret,
    ctx: (cfContext?.ctx ?? null) as WaitUntilContext | null
  };
}

export function dispatchNewPostToLocalAI(
  post: FeedPost | null,
  options?: { targetPersonaSlug?: string | null; singlePersona?: boolean }
) {
  if (!post || post.status !== "published") {
    return;
  }

  const task = (async () => {
    try {
      const { endpoint, secret } = await resolveDispatcherConfig();
      if (!endpoint) {
        return;
      }

      const payload = {
        event: "post.created",
        postId: post.id,
        body: post.body,
        createdAt: post.createdAt,
        targetPersonaSlug: options?.targetPersonaSlug ?? null,
        singlePersona: Boolean(options?.singlePersona),
        author: {
          id: post.author.id,
          username: post.author.username,
          displayName: post.author.displayName
        },
        tags: post.tags,
        media: post.media,
        callbackUrl: `${env.appUrl.replace(/\/$/, "")}/api/internal/local-agent/comment`
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (secret) {
        headers["x-nubi-agent-secret"] = secret;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn("[arena-dispatcher] LOCAL_AI_ENDPOINT returned non-OK status", {
          postId: post.id,
          status: response.status
        });
      }
    } catch (error) {
      console.error("[arena-dispatcher] failed to dispatch post to LOCAL_AI_ENDPOINT", {
        postId: post.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  })();

  void (async () => {
    try {
      const { ctx } = await resolveDispatcherConfig();
      ctx?.waitUntil?.(task);
    } catch {
      // Non-Cloudflare runtime: promise continues asynchronously in Node.
    }
  })();
}

export async function dispatchArenaSparkToLocalAI(options?: {
  topic?: string | null;
  agentSlug?: string;
}): Promise<boolean> {
  try {
    const { endpoint, secret, ctx } = await resolveDispatcherConfig();
    if (!endpoint) {
      return false;
    }

    const baseUrl = endpoint.replace(/\/webhook\/new-post\/?$/i, "").replace(/\/$/, "");
    const sparkUrl = `${baseUrl}/assistant/spark?async=1`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (secret) {
      headers["x-nubi-agent-secret"] = secret;
    }

    const task = fetch(sparkUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        topic: options?.topic ?? null,
        agentSlug: options?.agentSlug ?? "nova_director",
        triggerPersonaDebate: true
      })
    });

    ctx?.waitUntil?.(task);
    const response = await task;
    return response.ok;
  } catch (error) {
    console.error("[arena-dispatcher] failed to dispatch spark to LOCAL_AI_ENDPOINT", {
      error: error instanceof Error ? error.message : String(error)
    });
    return false;
  }
}

export function dispatchNewCommentToLocalAI(input: {
  postId: string;
  commentId: string;
  body: string;
  parentCommentId?: string | null;
  author: {
    id: string;
    username: string;
    displayName: string;
  };
}) {
  if (!input.body.trim()) {
    return;
  }

  // Prevent infinite loop if an automated voice account hits this path
  if (isAutomatedVoiceUsername(input.author.username)) {
    return;
  }

  const task = (async () => {
    try {
      const { endpoint, secret } = await resolveDispatcherConfig();
      if (!endpoint) {
        return;
      }

      const [post, comments] = await Promise.all([
        getPostById(input.postId, ""),
        getCommentsForPost(input.postId)
      ]);

      const parentComment = input.parentCommentId
        ? comments.find((c) => c.id === input.parentCommentId) ?? null
        : null;

      let targetPersonaSlug: string | null = null;
      const mentionMatch = input.body.match(
        /@(kairosterling|marcusvance|elenarostova|jaxmercer|sorenvale|nova_[a-z0-9_]+)/i
      );
      if (mentionMatch?.[1]) {
        targetPersonaSlug = mentionMatch[1].toLowerCase();
      } else if (parentComment && isAutomatedVoiceUsername(parentComment.author.username)) {
        targetPersonaSlug = parentComment.author.username.toLowerCase();
      }

      const payload = {
        event: "comment.created",
        postId: input.postId,
        body: post?.body ?? "",
        commentId: input.commentId,
        commentBody: input.body,
        parentCommentId: input.parentCommentId ?? null,
        parentCommentBody: parentComment?.body ?? null,
        targetPersonaSlug,
        author: input.author,
        tags: post?.tags ?? [],
        media: [],
        callbackUrl: `${env.appUrl.replace(/\/$/, "")}/api/internal/local-agent/comment`
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (secret) {
        headers["x-nubi-agent-secret"] = secret;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn("[arena-dispatcher] LOCAL_AI_ENDPOINT comment dispatch returned non-OK status", {
          postId: input.postId,
          commentId: input.commentId,
          status: response.status
        });
      }
    } catch (error) {
      console.error("[arena-dispatcher] failed to dispatch comment to LOCAL_AI_ENDPOINT", {
        postId: input.postId,
        commentId: input.commentId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  })();

  void (async () => {
    try {
      const { ctx } = await resolveDispatcherConfig();
      ctx?.waitUntil?.(task);
    } catch {
      // Non-Cloudflare runtime: promise continues asynchronously in Node.
    }
  })();
}

export function dispatchDirectMessageToLocalAI(input: {
  conversationId: string;
  messageId: string;
  body: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
  };
}) {
  if (!input.body.trim()) {
    return;
  }

  if (isAutomatedVoiceUsername(input.sender.username)) {
    return;
  }

  const task = (async () => {
    try {
      const { endpoint, secret } = await resolveDispatcherConfig();
      if (!endpoint) {
        return;
      }

      const counterpartRow = await get<{ user_id: string }>(
        `SELECT user_id
         FROM conversation_members
         WHERE conversation_id = ? AND user_id <> ?
         LIMIT 1`,
        [input.conversationId, input.sender.id]
      );
      if (!counterpartRow?.user_id) {
        return;
      }

      const [counterpartUser, counterpartAgent, thread] = await Promise.all([
        getUserById(counterpartRow.user_id),
        getAIAgentByLinkedUserId(counterpartRow.user_id),
        getConversationThread(input.conversationId, input.sender.id)
      ]);

      if (!counterpartUser) {
        return;
      }

      const isVoiceCounterpart =
        isAutomatedVoiceUsername(counterpartUser.username) || Boolean(counterpartAgent?.enabled);
      if (!isVoiceCounterpart) {
        return;
      }

      const baseUrl = endpoint.replace(/\/webhook\/new-post\/?$/i, "").replace(/\/$/, "");
      const dmReplyUrl = `${baseUrl}/assistant/dm-reply?async=1`;

      const recentHistory = (thread ?? []).slice(-6).map((msg) => ({
        senderUsername: msg.sender.username,
        senderDisplayName: msg.sender.displayName,
        body: msg.body
      }));

      const payload = {
        event: "dm.created",
        conversationId: input.conversationId,
        messageId: input.messageId,
        body: input.body,
        personaSlug: counterpartUser.username.toLowerCase(),
        personaDisplayName: counterpartUser.displayName,
        personaBio: counterpartUser.bio ?? counterpartAgent?.description ?? "",
        sender: input.sender,
        history: recentHistory,
        callbackUrl: `${env.appUrl.replace(/\/$/, "")}/api/internal/local-agent/dm`
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (secret) {
        headers["x-nubi-agent-secret"] = secret;
      }

      const response = await fetch(dmReplyUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        console.warn("[arena-dispatcher] LOCAL_AI_ENDPOINT dm dispatch returned non-OK status", {
          conversationId: input.conversationId,
          status: response.status
        });
      }
    } catch (error) {
      console.error("[arena-dispatcher] failed to dispatch DM to LOCAL_AI_ENDPOINT", {
        conversationId: input.conversationId,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  })();

  void (async () => {
    try {
      const { ctx } = await resolveDispatcherConfig();
      ctx?.waitUntil?.(task);
    } catch {
      // Non-Cloudflare runtime: promise continues asynchronously in Node.
    }
  })();
}
