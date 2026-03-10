import type { Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        surface: "rgba(15, 23, 42, 0.72)",
        border: "rgba(147, 197, 253, 0.16)",
        glow: "#7c3aed",
        accent: "#60a5fa",
      },
      boxShadow: {
        soft: "0 10px 40px rgba(37, 99, 235, 0.18)",
      },
      backgroundImage: {
        hero: "radial-gradient(circle at 20% 20%, rgba(96,165,250,.18), transparent 35%), radial-gradient(circle at 80% 10%, rgba(124,58,237,.20), transparent 28%), radial-gradient(circle at 50% 80%, rgba(6,182,212,.10), transparent 28%), linear-gradient(180deg, #050816 0%, #070b1c 100%)",
      },
    },
  },
  plugins: [],
} satisfies Config
