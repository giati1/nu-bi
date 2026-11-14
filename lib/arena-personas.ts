export const ARENA_FIGHTERS = [
  {
    slug: "nova_hype",
    handle: "@nova_hype",
    name: "The Hype-Man",
    model: "Gemma 3 · 4B",
    role: "Vision & Upside Amplifier",
    stance: "10x Optimist",
    bio: "High-voltage optimist and builder advocate in the NU-BI Arena. Spots the 10x upside in every bold idea.",
    accentClass:
      "border-amber-400/35 bg-[linear-gradient(145deg,rgba(245,158,11,0.16),rgba(10,12,24,0.85))] text-amber-200 hover:border-amber-400/65",
    dotClass: "bg-amber-400 shadow-[0_0_10px_#fbbf24]"
  },
  {
    slug: "nova_purist",
    handle: "@nova_purist",
    name: "The Tech Purist",
    model: "Gemma 3 · 4B",
    role: "First-Principles Architect",
    stance: "Systems Realist",
    bio: "First-principles engineer and systems realist in the NU-BI Arena. Cares about latency, tradeoffs, and real mechanics.",
    accentClass:
      "border-cyan-400/35 bg-[linear-gradient(145deg,rgba(6,182,212,0.16),rgba(10,12,24,0.85))] text-cyan-200 hover:border-cyan-400/65",
    dotClass: "bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
  },
  {
    slug: "nova_advocate",
    handle: "@nova_advocate",
    name: "Devil's Advocate",
    model: "Gemma 3 · 4B",
    role: "Contrarian Stress-Tester",
    stance: "Assumption Breaker",
    bio: "Fearless contrarian and debate catalyst in the NU-BI Arena. Stress-tests every assumption and consensus take.",
    accentClass:
      "border-purple-400/35 bg-[linear-gradient(145deg,rgba(168,85,247,0.18),rgba(10,12,24,0.85))] text-purple-200 hover:border-purple-400/65",
    dotClass: "bg-purple-400 shadow-[0_0_10px_#c084fc]"
  },
  {
    slug: "nova_director",
    handle: "@nova_director",
    name: "Executive Director",
    model: "Gemma 3 · 4B",
    role: "Strategy & Trend Synthesizer",
    stance: "Arena Moderator",
    bio: "Executive AI Director and Trend Strategist of the NU-BI Arena, powered by Google Gemma 3.",
    accentClass:
      "border-emerald-400/35 bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(10,12,24,0.85))] text-emerald-200 hover:border-emerald-400/65",
    dotClass: "bg-emerald-400 shadow-[0_0_10px_#34d399]"
  }
];

export function getPersonaBadgeMeta(username: string) {
  const lower = username.trim().toLowerCase();
  if (lower === "nova_hype") {
    return {
      label: "Hype-Man · Gemma 3",
      className: "border-amber-400/40 bg-amber-500/15 text-amber-300",
      cardAccent: "border-l-2 border-l-amber-400/80 bg-amber-500/[0.05]"
    };
  }
  if (lower === "nova_purist") {
    return {
      label: "Tech Purist · Gemma 3",
      className: "border-cyan-400/40 bg-cyan-500/15 text-cyan-300",
      cardAccent: "border-l-2 border-l-cyan-400/80 bg-cyan-500/[0.05]"
    };
  }
  if (lower === "nova_advocate") {
    return {
      label: "Devil's Advocate · Gemma 3",
      className: "border-purple-400/40 bg-purple-500/15 text-purple-300",
      cardAccent: "border-l-2 border-l-purple-400/80 bg-purple-500/[0.05]"
    };
  }
  if (lower === "nova_director") {
    return {
      label: "Director · Gemma 3",
      className: "border-emerald-400/40 bg-emerald-500/15 text-emerald-300",
      cardAccent: "border-l-2 border-l-emerald-400/80 bg-emerald-500/[0.05]"
    };
  }
  if (lower.startsWith("nova_")) {
    return {
      label: "AI Persona · Gemma 3",
      className: "border-accent/40 bg-accent/15 text-accent-soft",
      cardAccent: "border-l-2 border-l-rose-400/80 bg-rose-500/[0.05]"
    };
  }
  return null;
}
