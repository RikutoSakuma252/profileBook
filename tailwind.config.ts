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
        ink: {
          DEFAULT: "#0B1026",
          deep: "#070A1C",
          soft: "#1A2145",
        },
        paper: {
          DEFAULT: "#F3EAD3",
          warm: "#EADFC3",
          aged: "#DFD0A8",
          shadow: "#C9B88A",
        },
        neon: {
          DEFAULT: "#FFE14D",
          glow: "#FFF47A",
          deep: "#E8B800",
        },
        rose: {
          DEFAULT: "#C97B84",
          deep: "#8E4A55",
          dusty: "#E5A9B0",
        },
        rouge: "#B3302A",
      },
      fontFamily: {
        sans: ["var(--font-zen-kaku)", "sans-serif"],
        handwritten: ["var(--font-klee)", "cursive"],
        dot: ["var(--font-dot)", "monospace"],
        typewriter: ["var(--font-typewriter)", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 rgba(0,0,0,0.04), 0 8px 20px -8px rgba(11,16,38,0.35), 0 24px 60px -30px rgba(11,16,38,0.4)",
        stamp: "inset 0 0 0 2px currentColor",
        neon: "0 0 20px rgba(255,225,77,0.6), 0 0 40px rgba(255,225,77,0.3)",
      },
      keyframes: {
        blink: {
          "0%, 60%, 100%": { opacity: "1" },
          "61%, 80%": { opacity: "0.3" },
        },
        wave: {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        dial: {
          "0%": { transform: "rotate(-8deg)" },
          "50%": { transform: "rotate(8deg)" },
          "100%": { transform: "rotate(-8deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--tw-rotate,0))" },
          "50%": { transform: "translateY(-6px) rotate(var(--tw-rotate,0))" },
        },
      },
      animation: {
        blink: "blink 2.2s infinite",
        wave: "wave 1.1s ease-in-out infinite",
        dial: "dial 4s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
