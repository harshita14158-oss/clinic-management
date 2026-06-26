import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FAF6EF",
        linen: "#F4EDE3",
        paper: "#FFFCF7",
        ink: "#1F2428",
        muted: "#6E6860",
        gold: "#B98543",
        softgold: "#E8D4B6",
        clay: "#C99262"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(75, 53, 30, 0.10)",
        card: "0 10px 35px rgba(74, 55, 33, 0.08)"
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"]
      }
    }
  },
  plugins: []
};

export default config;
