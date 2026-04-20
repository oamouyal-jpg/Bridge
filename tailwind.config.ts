import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      colors: {
        bridge: {
          cream: "#fffbf7",
          sand: "#f5ebe3",
          mist: "#ead9cc",
          stone: "#8a7f76",
          ink: "#2f2823",
          sage: "#6d8569",
          sageMuted: "#9aab99",
          blush: "#c4a89a",
          warn: "#b45309",
          honey: "#fff4e8",
          peach: "#ffd6c4",
          clay: "#5c4f47",
        },
      },
      keyframes: {
        "bridge-drift-slow": {
          "0%, 100%": { transform: "scale(1.04) translate(0, 0)" },
          "50%": { transform: "scale(1.07) translate(-0.6%, 0.4%)" },
        },
        "bridge-glow": {
          "0%, 100%": { opacity: "0.5", transform: "translate(0, 0) scale(1)" },
          "50%": { opacity: "0.82", transform: "translate(4%, 3%) scale(1.06)" },
        },
        "bridge-glow-alt": {
          "0%, 100%": { opacity: "0.45", transform: "translate(0, 0) scale(1)" },
          "50%": { opacity: "0.75", transform: "translate(-3%, -2%) scale(1.05)" },
        },
        "bridge-float": {
          "0%, 100%": { opacity: "0.35", transform: "translate(-50%, 0) scale(1)" },
          "50%": { opacity: "0.55", transform: "translate(-50%, -4%) scale(1.04)" },
        },
      },
      animation: {
        "bridge-drift-slow": "bridge-drift-slow 28s ease-in-out infinite",
        "bridge-glow": "bridge-glow 22s ease-in-out infinite",
        "bridge-glow-alt": "bridge-glow-alt 26s ease-in-out infinite 3s",
        "bridge-float": "bridge-float 18s ease-in-out infinite 1s",
      },
      boxShadow: {
        bridge:
          "0 2px 4px rgba(47, 40, 35, 0.04), 0 14px 36px -12px rgba(47, 40, 35, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.92)",
        "bridge-lift":
          "0 8px 24px -8px rgba(47, 40, 35, 0.08), 0 28px 70px -24px rgba(47, 40, 35, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.88)",
        "bridge-inset": "inset 0 1px 2px rgba(47, 40, 35, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
