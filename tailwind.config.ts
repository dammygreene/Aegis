import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        terminal: {
          bg: "#090d16",
          card: "#0f172a",
          cardHover: "#16223b",
          border: "#1e293b",
          borderLight: "#334155",
          accent: "#38bdf8",
          accentGlow: "rgba(56, 189, 248, 0.15)",
          textMuted: "#94a3b8",
          textLight: "#f8fafc",
          green: "#10b981",
          amber: "#f59e0b",
          red: "#ef4444",
          purple: "#a855f7"
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
export default config;
