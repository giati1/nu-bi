import { Sparkles, ImageIcon, Bot } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { AIStudio } from "@/components/ai-studio";
import { requirePageViewer } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

export default async function AIPage() {
  const viewer = await requirePageViewer("/ai");

  const aiConfigured = Boolean(env.openAiApiKey);

  return (
    <AppShell
      title="AI Studio"
      subtitle="Draft better captions, generate stronger replies, and create campaign-ready visuals from prompts."
    >
      <section className="glass-panel rounded-[24px] border-accent/15 bg-accent/5 p-5">
        <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">AI status</p>
        <p className="mt-3 text-lg font-semibold">
          {aiConfigured ? "Live provider connected" : "Fallback AI mode"}
        </p>
        <p className="mt-2 text-sm text-white/60">
          {aiConfigured
            ? "NOMI is using your configured OpenAI API key for captioning, replies, inbox summaries, and image generation."
            : "Set OPENAI_API_KEY in .env.local to switch from local fallback behavior to live AI responses."}
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Caption Assist", detail: "Refine launch copy and creator voice.", Icon: Sparkles },
          { label: "Reply Assist", detail: "Answer comments and DMs faster.", Icon: Bot },
          { label: "Image Generator", detail: "Generate branded visual concepts instantly.", Icon: ImageIcon }
        ].map(({ label, detail, Icon }) => (
          <div className="glass-panel rounded-[24px] p-5" key={label}>
            <Icon className="h-5 w-5 text-accent-soft" />
            <p className="mt-4 font-semibold">{label}</p>
            <p className="mt-2 text-sm text-white/60">{detail}</p>
          </div>
        ))}
      </section>
      <AIStudio />
    </AppShell>
  );
}
