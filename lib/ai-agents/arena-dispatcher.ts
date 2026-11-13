import { getCloudflareContextAsync } from "@/lib/cloudflare/context";
import { env } from "@/lib/config/env";
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

export function dispatchNewPostToLocalAI(post: FeedPost | null) {
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
