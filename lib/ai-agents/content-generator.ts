import { getAIAdapter } from "@/lib/ai";
import type { AgentGeneratedContent } from "@/lib/ai/contracts";
import type { AIAgentContentMode } from "@/types/domain";

export async function generateAgentContent(input: {
  systemPrompt: string;
  userPrompt: string;
  contentMode: AIAgentContentMode;
  topicSeed: string;
}): Promise<AgentGeneratedContent> {
  return await getAIAdapter().generateAgentContent({
    systemPrompt: input.systemPrompt,
    userPrompt: input.userPrompt,
    contentMode: input.contentMode,
    topicSeed: input.topicSeed
  });
}
