import type { Config } from "tailwindcss"

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#06070D",
        surface: "rgba(16, 19, 32, 0.58)",
        "surface-strong": "rgba(19, 23, 40, 0.82)",
        primary: "#806BFF",
        secondary: "#29A9FF",
        accent: "#33E6C3",
        ink: "#F5F7FF",
        muted: "#929AB4",
        border: "rgba(255, 255, 255, 0.10)",
      },
      borderRadius: {
        sm: "12px",
        md: "18px",
        lg: "24px",
        xl: "32px",
        "2xl": "40px",
      },
      backdropBlur: {
        xs: "6px",
        sm: "12px",
        md: "20px",
        lg: "32px",
      },
      boxShadow: {
        soft: "0 10px 40px rgba(37, 99, 235, 0.18)",
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 20px 60px rgba(90, 60, 255, 0.22)",
        "glow-lg": "0 30px 120px rgba(90, 60, 255, 0.35), 0 0 40px rgba(41, 169, 255, 0.14)",
      },
      maxWidth: {
        shell: "1280px",
      },
      fontSize: {
        "display-lg": ["clamp(2.75rem, 6vw, 6rem)", { lineHeight: "0.98", letterSpacing: "-0.04em" }],
        "display-md": ["clamp(2.25rem, 4.4vw, 3.75rem)", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        "display-sm": ["clamp(1.75rem, 2.8vw, 2.5rem)", { lineHeight: "1.08", letterSpacing: "-0.02em" }],
      },
      transitionDuration: {
        fast: "180ms",
        base: "320ms",
        slow: "560ms",
        panel: "420ms",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-soft": "cubic-bezier(0.22, 1, 0.36, 1)",
        "in-out-soft": "cubic-bezier(0.65, 0, 0.35, 1)",
      },
      spacing: {
        section: "clamp(4rem, 9vw, 8rem)",
      },
    },
  },
  plugins: [],
} satisfies Config
