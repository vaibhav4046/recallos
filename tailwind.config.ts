import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1440px" },
    },
    extend: {
      colors: {
        bg: {
          DEFAULT: "#07090d",
          raised: "#0c1117",
          soft: "#101620",
          panel: "#0b1018",
        },
        line: {
          DEFAULT: "#1a2230",
          soft: "#141a25",
          strong: "#26314a",
        },
        ink: {
          DEFAULT: "#e7ecf3",
          soft: "#aab4c4",
          mute: "#6b7689",
          faint: "#475063",
        },
        accent: {
          DEFAULT: "#7c9cff",
          soft: "#4a6cf0",
          glow: "#9bb4ff",
        },
        success: "#3ddc97",
        warn: "#ffb86b",
        danger: "#ff6b81",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,156,255,0.25), 0 16px 48px -16px rgba(124,156,255,0.3)",
        panel: "0 1px 0 rgba(255,255,255,0.04) inset, 0 24px 60px -36px rgba(0,0,0,0.7)",
      },
      backgroundImage: {
        "grid-fade":
          "radial-gradient(circle at top, rgba(124,156,255,0.08), transparent 60%)",
        "ink-gradient":
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 100%)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "fade-in": "fade-in 240ms ease-out",
        shimmer: "shimmer 2.4s linear infinite",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
