import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Cool paper — crisp collegiate stationery, not sepia
        parchment: {
          50: "#f7f9fc",
          100: "#eef2f8",
          200: "#dfe6f0",
        },
        // AUIS navy — PMS 295 C, #002855
        ink: {
          900: "#001a38",
          800: "#002855",
          700: "#0a3d6e",
          600: "#1c5286",
          500: "#2f699e",
        },
        // AUIS gold — PMS 117 C, #C99700
        brass: {
          200: "#f5e3ad",
          300: "#e8c877",
          400: "#d9ac3f",
          500: "#c99700",
          600: "#a67b00",
        },
        claret: {
          500: "#a02334",
          600: "#821b29",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        seal: "0 1px 2px rgba(0,26,56,0.10), 0 8px 24px -8px rgba(0,26,56,0.22)",
        lift: "0 2px 8px rgba(0,26,56,0.07), 0 16px 40px -12px rgba(0,26,56,0.25)",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        unfurl: {
          "0%": { opacity: "0", transform: "scaleY(0.96)" },
          "100%": { opacity: "1", transform: "scaleY(1)" },
        },
      },
      animation: {
        rise: "rise 0.6s cubic-bezier(0.16,1,0.3,1) both",
        unfurl: "unfurl 0.5s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
