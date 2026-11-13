import type { PersonaId } from "@/lib/ai-tools/contracts";

const voiceFrequencies: Record<PersonaId, number> = {
  EchoX1: 220,
  EchoX2: 294,
  EchoRaw: 196
};

export async function generateTtsAudio(input: {
  text: string;
  voice: PersonaId;
  messageId?: string | null;
}) {
  return {
    audioUrl: buildMockVoiceNoteDataUrl(voiceFrequencies[input.voice] ?? 220),
    provider: "mock-tts",
    messageId: input.messageId ?? null
  };
}

function buildMockVoiceNoteDataUrl(frequency: number) {
  const sampleRate = 8000;
  const durationSeconds = 1.2;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const pcm = new Int16Array(totalSamples);

  for (let index = 0; index < totalSamples; index += 1) {
    const time = index / sampleRate;
    const envelope = Math.max(0, 1 - time / durationSeconds);
    const sample =
      Math.sin(2 * Math.PI * frequency * time) * 0.34 +
      Math.sin(2 * Math.PI * frequency * 1.5 * time) * 0.12;
    pcm[index] = Math.max(-1, Math.min(1, sample * envelope)) * 32767;
  }

  const wav = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(wav);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, pcm.length * 2, true);

  for (let index = 0; index < pcm.length; index += 1) {
    view.setInt16(44 + index * 2, pcm[index], true);
  }

  return `data:audio/wav;base64,${Buffer.from(wav).toString("base64")}`;
}

function writeAscii(view: DataView, offset: number, value: string) {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}
