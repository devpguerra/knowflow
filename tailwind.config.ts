import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#080604",
        surface: "#110e09",
        "surface-raised": "#1a150e",
        border: "#2a2015",
        accent: "#d97706",
        "accent-hover": "#b45309",
        "text-muted": "#8a7560",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease forwards",
        "slide-up": "slideUp 0.4s ease forwards",
        "amber-pulse": "amberPulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        amberPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(217,119,6,0.3)" },
          "50%": { boxShadow: "0 0 40px rgba(217,119,6,0.55)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
