import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          950: "#050505",
          900: "#0b0b0c",
          850: "#111112",
          800: "#161618"
        },
        accent: {
          DEFAULT: "#ef4444",
          soft: "#f87171",
          glow: "#b91c1c"
        }
      },
      fontFamily: {
        sans: [
          "Space Grotesk",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0,0,0,0.35)",
        glow: "0 0 0 1px rgba(239,68,68,0.2), 0 18px 60px rgba(127,29,29,0.35)"
      },
      backgroundImage: {
        "mesh-red":
          "radial-gradient(circle at top left, rgba(239,68,68,0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(220,38,38,0.12), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))"
      }
    }
  },
  plugins: []
};

export default config;
