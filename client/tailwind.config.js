/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        elevated: "rgb(var(--elevated) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        sub: "rgb(var(--sub) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
          light: "rgb(var(--primary-light) / <alpha-value>)",
        },
        success: {
          DEFAULT: "rgb(var(--success) / <alpha-value>)",
          light: "rgb(var(--success-light) / <alpha-value>)",
        },
        warn: {
          DEFAULT: "rgb(var(--warn) / <alpha-value>)",
          light: "rgb(var(--warn-light) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--danger) / <alpha-value>)",
          light: "rgb(var(--danger-light) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--info) / <alpha-value>)",
          light: "rgb(var(--info-light) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        lg: "16px",
        xl: "20px",
      },
      boxShadow: {
        card: "var(--shadow)",
        lift: "var(--shadow-lg)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in .35s ease both",
        "scale-in": "scale-in .2s ease both",
        "slide-up": "slide-up .3s cubic-bezier(.16,1,.3,1) both",
      },
    },
  },
  plugins: [],
};
