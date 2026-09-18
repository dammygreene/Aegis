import type { Config } from "tailwindcss";

/**
 * Aegis design tokens — dark trading-terminal aesthetic, elevated execution.
 * Styling pass per aegis-ui-styling-prompt.md:
 *   DESIGN_VARIANCE 3-4/10 · MOTION_INTENSITY 3-4/10 · VISUAL_DENSITY 5-6/10
 *
 * Two semantic state colors are load-bearing, not decorative:
 *   `live`   = genuine mainnet execution (Base)   -> emerald
 *   `staged` = testnet / staged execution (Sepolia) -> amber
 * They are reused everywhere a network badge, border, glow or rail node appears
 * so the live/staged split is readable at a glance without reading any text.
 */
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
        // Depth ramp: ink-950 (page) -> ink-600 (raised surfaces)
        ink: {
          950: "#05080f",
          900: "#080c14",
          850: "#0b111d",
          800: "#0e1524",
          700: "#131c2e",
          600: "#1a2437",
        },
        // Hairline borders — refined, never a harsh 1px slate line
        hairline: "rgba(148, 163, 184, 0.10)",
        hairlineStrong: "rgba(148, 163, 184, 0.18)",
        // Legacy aliases kept so nothing silently loses its color
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
          purple: "#a855f7",
        },
        // Semantic roles
        signal: {
          DEFAULT: "#38bdf8",
          dim: "#0ea5e9",
          wash: "rgba(56, 189, 248, 0.10)",
        },
        live: {
          DEFAULT: "#10b981",
          wash: "rgba(16, 185, 129, 0.10)",
          border: "rgba(16, 185, 129, 0.32)",
        },
        staged: {
          DEFAULT: "#f59e0b",
          wash: "rgba(245, 158, 11, 0.10)",
          border: "rgba(245, 158, 11, 0.30)",
        },
        vault: {
          DEFAULT: "#818cf8",
          wash: "rgba(129, 140, 248, 0.10)",
        },
        machine: {
          DEFAULT: "#a855f7",
          wash: "rgba(168, 85, 247, 0.10)",
        },
        alarm: {
          DEFAULT: "#f43f5e",
          wash: "rgba(244, 63, 94, 0.10)",
        },
      },
      fontFamily: {
        // Display face is for the key trust numbers only (spend cap, amounts, P&L).
        // No webfont download: the stack degrades to installed UI faces, so the
        // build never depends on network egress to fonts.googleapis.com.
        display: [
          "'Inter Tight'",
          "'Space Grotesk'",
          "'SF Pro Display'",
          "'Inter'",
          "system-ui",
          "sans-serif",
        ],
        sans: ["Inter", "system-ui", "-apple-system", "'Segoe UI'", "sans-serif"],
        // Monospace is reserved for hashes, addresses and raw values
        mono: [
          "'JetBrains Mono'",
          "'SF Mono'",
          "Menlo",
          "Monaco",
          "'Cascadia Mono'",
          "'Courier New'",
          "monospace",
        ],
      },
      letterSpacing: {
        label: "0.14em",
        badge: "0.1em",
      },
      boxShadow: {
        // Soft elevation instead of flat boxes
        panel:
          "inset 0 1px 0 0 rgba(255,255,255,0.04), 0 18px 36px -22px rgba(0,0,0,0.9)",
        "panel-lg":
          "inset 0 1px 0 0 rgba(255,255,255,0.05), 0 28px 60px -28px rgba(0,0,0,0.95)",
        inset: "inset 0 2px 10px -6px rgba(0,0,0,0.85)",
        // State-tinted elevation for live vs staged surfaces
        "glow-live":
          "0 0 0 1px rgba(16,185,129,0.30), 0 0 34px -12px rgba(16,185,129,0.45)",
        "glow-staged":
          "0 0 0 1px rgba(245,158,11,0.28), 0 0 34px -12px rgba(245,158,11,0.40)",
        "glow-signal":
          "0 0 0 1px rgba(56,189,248,0.30), 0 0 34px -14px rgba(56,189,248,0.55)",
        "glow-vault":
          "0 0 0 1px rgba(129,140,248,0.30), 0 0 34px -14px rgba(129,140,248,0.5)",
        "key-primary":
          "0 10px 24px -10px rgba(14,165,233,0.65), inset 0 1px 0 0 rgba(255,255,255,0.28)",
      },
      backgroundImage: {
        "panel-raise":
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 42%, rgba(255,255,255,0) 100%)",
        "grid-faint":
          "linear-gradient(rgba(148,163,184,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.045) 1px, transparent 1px)",
        "rail-signal":
          "linear-gradient(180deg, rgba(56,189,248,0.55) 0%, rgba(16,185,129,0.45) 50%, rgba(129,140,248,0.5) 100%)",
        "rail-flow":
          "linear-gradient(90deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.55) 35%, rgba(16,185,129,0.55) 65%, rgba(129,140,248,0) 100%)",
        "ambient-top":
          "radial-gradient(900px 320px at 18% -8%, rgba(56,189,248,0.13), transparent 62%), radial-gradient(760px 300px at 88% -12%, rgba(129,140,248,0.11), transparent 60%)",
      },
      backgroundSize: {
        grid: "56px 56px",
      },
      transitionTimingFunction: {
        // Subtle spring signature (MOTION_INTENSITY 3-4/10)
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        glide: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "card-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.45", transform: "scale(1.65)" },
        },
        "flow-x": {
          "0%": { backgroundPosition: "-120% 0" },
          "100%": { backgroundPosition: "220% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "card-in": "card-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "pulse-ring": "pulse-ring 2.4s ease-in-out infinite",
        "flow-x": "flow-x 3.6s linear infinite",
        "fade-in": "fade-in 220ms ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
