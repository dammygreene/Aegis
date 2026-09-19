import type { Config } from "tailwindcss";

/**
 * Aegis design tokens — Vault palette (gunmetal + brass).
 *
 * No multi-stop gradients. Flat color only with deliberate warm contrast:
 *   Background (base): #14161A
 *   Surface/card:     #1C1F24
 *   Border/hairline:  #2A2E35
 *   Primary (brass):  #CBA135
 *   Secondary (bronze): #8C5A2B
 *   Text (primary):   #EDE7DD (warm off-white)
 *   Text (muted):     #9B9690 (warm gray)
 *   Live state:       #3E7A5B (subdued forest green)
 *   Staged state:     #8A7B4E (subdued ochre/brass)
 *   Risk state:       #9C3B2E (warm crimson)
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
        background: "#14161A",
        foreground: "#EDE7DD",

        // Vault core palette
        vault: {
          bg: "#14161A",
          surface: "#1C1F24",
          border: "#2A2E35",
          primary: "#CBA135",
          secondary: "#8C5A2B",
          text: "#EDE7DD",
          muted: "#9B9690",
          live: "#3E7A5B",
          staged: "#8A7B4E",
          danger: "#9C3B2E",
        },

        // Semantic tokens mapped directly to Vault palette
        primary: {
          DEFAULT: "#CBA135",
          hover: "#D8AF43",
          subtle: "rgba(203, 161, 53, 0.12)",
          border: "rgba(203, 161, 53, 0.35)",
        },
        secondary: {
          DEFAULT: "#8C5A2B",
          hover: "#9E6631",
          subtle: "rgba(140, 90, 43, 0.14)",
          border: "rgba(140, 90, 43, 0.35)",
        },

        // Neutral depth surfaces
        ink: {
          950: "#14161A", // Base background
          900: "#181B20",
          850: "#1C1F24", // Surface / card
          800: "#22262D",
          700: "#2A2E35", // Border / hairline
          600: "#353A42",
        },

        // Hairlines
        hairline: "#2A2E35",
        hairlineStrong: "rgba(203, 161, 53, 0.25)",

        // Functional states
        live: {
          DEFAULT: "#3E7A5B",
          subtle: "rgba(62, 122, 91, 0.15)",
          border: "#3E7A5B",
        },
        staged: {
          DEFAULT: "#8A7B4E",
          subtle: "rgba(138, 123, 78, 0.15)",
          border: "#8A7B4E",
        },
        danger: {
          DEFAULT: "#9C3B2E",
          subtle: "rgba(156, 59, 46, 0.15)",
          border: "#9C3B2E",
        },

        // Aliases for smooth migration
        aegis: {
          teal: "#CBA135",   // Replaced with primary brass
          sky: "#8C5A2B",    // Replaced with secondary bronze
          deep: "#1C1F24",
          glow: "rgba(203, 161, 53, 0.08)",
        },
        signal: {
          DEFAULT: "#CBA135",
          dim: "#8C5A2B",
          wash: "rgba(203, 161, 53, 0.10)",
        },
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "'Space Grotesk'",
          "'SF Pro Display'",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "var(--font-sans)",
          "Inter",
          "system-ui",
          "-apple-system",
          "'Segoe UI'",
          "sans-serif",
        ],
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
        // Flat, subtle depth shadows (no high-color neon glows)
        "panel-sm": "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(237,231,221,0.03)",
        panel: "0 4px 16px rgba(0,0,0,0.6), inset 0 1px 0 rgba(237,231,221,0.04)",
        "panel-lg": "0 8px 30px rgba(0,0,0,0.7), inset 0 1px 0 rgba(237,231,221,0.05)",
        inset: "inset 0 2px 6px rgba(0,0,0,0.7)",

        // Monochromatic single-tint glows
        "glow-primary": "0 0 0 1px rgba(203,161,53,0.30), 0 0 20px rgba(203,161,53,0.12)",
        "glow-live": "0 0 0 1px rgba(62,122,91,0.40), 0 0 16px rgba(62,122,91,0.12)",
        "glow-staged": "0 0 0 1px rgba(138,123,78,0.40), 0 0 16px rgba(138,123,78,0.12)",
        "glow-brand": "0 0 0 1px rgba(203,161,53,0.35), 0 0 20px rgba(203,161,53,0.10)",
        "key-primary": "0 2px 8px rgba(0,0,0,0.4)",
      },
      backgroundImage: {
        // Single-tint radial depth fading to transparent (allowed per brief)
        "ambient-top":
          "radial-gradient(850px 380px at 50% -8%, rgba(203, 161, 53, 0.05), transparent 75%)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.16, 1, 0.3, 1)",
        glide: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        "card-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "card-in": "card-in 300ms cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 200ms ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
