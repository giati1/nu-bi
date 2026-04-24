import { createPost } from "@/lib/db/repository";
import type { AgentGeneratedContent } from "@/lib/ai/contracts";
import type { AIAgentRecord, FeedPost } from "@/types/domain";

export async function publishAgentContent(input: {
  agent: AIAgentRecord;
  jobId: string;
  topicSeed: string;
  content: AgentGeneratedContent;
  media?: Array<{ storageKey: string; url: string; mimeType: string | null }>;
}): Promise<FeedPost | null> {
  const body = formatBody(input.content);
  return await createPost({
    userId: input.agent.linkedUserId,
    body,
    contentType: "standard",
    status: "draft",
    aiAgentId: input.agent.id,
    aiContentJobId: input.jobId,
    aiGenerationMode: input.content.contentMode,
    aiTopicSeed: input.topicSeed,
    media: input.media ?? []
  });
}

function formatBody(content: AgentGeneratedContent) {
  if (content.contentMode !== "article") {
    return content.body.trim();
  }

  return [content.title, content.excerpt, content.body]
    .filter((value): value is string => Boolean(value?.trim()))
    .join("\n\n")
    .trim();
}
