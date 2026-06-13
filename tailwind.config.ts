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
        slate: {
          950: "#080c14",
          900: "#0f172a",
          800: "#1e293b",
          700: "#334155",
          600: "#475569",
          500: "#64748b",
          400: "#94a3b8",
          300: "#cbd5e1",
          200: "#e2e8f0",
          100: "#f1f5f9",
        },
        indigo: {
          500: "#6366f1",
          600: "#4f46e5",
          400: "#818cf8",
          950: "#312e81"
        },
        cyan: {
          500: "#06b6d4",
          600: "#0891b2",
          400: "#22d3ee",
          950: "#164e63"
        }
      },
    },
  },
  plugins: [],
};
export default config;