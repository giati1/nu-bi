import { FileText, ImageIcon, MessageSquareText } from "lucide-react";
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
      subtitle="Chat with NU-BI AI, generate visuals, and read scanned documents in one place."
    >
      <section className="glass-panel rounded-[24px] border-accent/15 bg-accent/5 p-5">
        <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">AI status</p>
        <p className="mt-3 text-lg font-semibold">{aiConfigured ? "Live AI ready" : "Fallback AI mode"}</p>
        <p className="mt-2 text-sm text-white/60">
          {aiConfigured
            ? "NU-BI AI is ready for captions, replies, inbox summaries, and image generation."
            : "Add your AI key in environment settings to switch from local fallback behavior to live AI responses."}
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Voice Chat", detail: "Talk through ideas, captions, and replies.", Icon: MessageSquareText },
          { label: "Image Generator", detail: "Generate branded visual concepts instantly.", Icon: ImageIcon },
          { label: "Document Reader", detail: "Scan a page or upload text and get a clean readout.", Icon: FileText }
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
