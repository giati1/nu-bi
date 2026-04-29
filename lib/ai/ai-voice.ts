import { env } from "@/lib/config/env";
import { saveUploadedFile } from "@/lib/storage";
import { resolveAiUserStyle } from "@/lib/ai/ai-users";
import type { AIAgentRecord } from "@/types/domain";

const VOICE_BY_PERSONALITY = {
  troll: { voice: "nova", instructions: "Energetic, playful, quick, and socially loose." },
  motivational: { voice: "sage", instructions: "Relaxed, warm, steady, and encouraging." },
  aggressive: { voice: "onyx", instructions: "Sharp, clipped, confident, and direct." },
  observant: { voice: "marin", instructions: "Clear, current, natural, and socially fluent." },
  creative: { voice: "coral", instructions: "Expressive, light, stylish, and a little playful." },
  analytical: { voice: "cedar", instructions: "Calm, precise, practical, and slightly skeptical." }
} as const;

export async function generateAiVoiceMedia(input: { text: string; user: AIAgentRecord }) {
  const normalizedText = input.text.trim().slice(0, 240);
  if (!normalizedText || !env.openAiApiKey) {
    return null;
  }

  const style = resolveAiUserStyle(input.user);
  const voiceProfile = VOICE_BY_PERSONALITY[style.personalityType];

  const response = await fetch(`${env.openAiBaseUrl}/audio/speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openAiApiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: voiceProfile.voice,
      input: normalizedText,
      instructions: voiceProfile.instructions,
      response_format: "mp3"
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const audio = await response.arrayBuffer();
  const file = {
    name: `${input.user.slug}-voice-note.mp3`,
    type: "audio/mpeg",
    async arrayBuffer() {
      return audio;
    }
  };

  return await saveUploadedFile(file);
}

export async function generateVoiceComment(input: { text: string; user: AIAgentRecord }) {
  return await generateAiVoiceMedia(input);
}
