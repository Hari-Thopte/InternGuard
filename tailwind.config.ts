import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: ["class", "[data-theme='dark']"],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        raised: "rgb(var(--raised) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        low: "rgb(var(--low) / <alpha-value>)",
        caution: "rgb(var(--caution) / <alpha-value>)",
        high: "rgb(var(--high) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        display: ["var(--font-space)"],
      },
      boxShadow: {
        panel: "0 24px 80px rgb(0 0 0 / .24)",
        glow: "0 0 0 1px rgb(var(--accent)/.2),0 20px 60px rgb(var(--accent)/.08)",
      },
      borderRadius: { panel: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
