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
        primary: {
          50: "#fff5f5",
          100: "#ffe3e3",
          200: "#ffc9c9",
          300: "#ffa8a8",
          400: "#ff8787",
          500: "#ff6b6b",
          600: "#fa5252",
          700: "#f03e3e",
        },
        cream: "#FFFDF7",
        softPink: "#FF9AA2",
        salmon: "#FFB7B2",
        peach: "#FFDAC1",
      },
      fontFamily: {
        sans: ["var(--font-zen-maru-gothic)", "sans-serif"],
        handwritten: ["var(--font-patrick-hand)", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
