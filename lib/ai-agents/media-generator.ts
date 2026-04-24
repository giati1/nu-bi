import { getAIAdapter } from "@/lib/ai";
import { saveGeneratedDataUrl } from "@/lib/storage";

export type AgentMediaProvider = {
  generateImage(input: {
    prompt: string;
    agentSlug: string;
    jobId: string;
  }): Promise<
    | {
        storageKey: string;
        url: string;
        mimeType: string | null;
        sourcePrompt: string;
      }
    | null
  >;
};

class DefaultAgentMediaProvider implements AgentMediaProvider {
  async generateImage(input: { prompt: string; agentSlug: string; jobId: string }) {
    if (!input.prompt.trim()) {
      return null;
    }

    const image = await getAIAdapter().generateImage({
      prompt: input.prompt,
      style: "editorial social image",
      mood: "focused"
    });

    if (!image?.url) {
      return null;
    }

    const saved = await saveGeneratedDataUrl({
      filenamePrefix: `${input.agentSlug}-${input.jobId}`,
      dataUrl: image.url
    });

    return {
      storageKey: saved.storageKey,
      url: saved.url,
      mimeType: saved.mimeType,
      sourcePrompt: image.prompt
    };
  }
}

export function createAgentMediaProvider(): AgentMediaProvider {
  return new DefaultAgentMediaProvider();
}
