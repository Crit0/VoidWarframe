import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#03050a",
        panel: "#0b0f1a",
        "panel-light": "#121826",
        border: "#1f2738",
        "border-gold": "#5a4a25",
        gold: "#f5c463",
        "gold-dim": "#b88a3a",
        cyan: "#00f0ff",
        magenta: "#ff2bd6",
        "text-0": "#eef2f8",
        "text-1": "#b8c4d6",
        "text-2": "#6b7689",
        "neon-amber": "#ffb020",
        "neon-red": "#ff3355",
        "neon-green": "#4ade80",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        "glow-gold": "0 0 16px rgba(245, 196, 99, 0.35)",
        "glow-cyan": "0 0 16px rgba(0, 240, 255, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
