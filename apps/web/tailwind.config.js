/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#080f1f",
        panel: "#0d1729",
        panel2: "#111d33",
        border: "rgba(148, 163, 184, 0.18)",
        cyan: "#38d3ee",
        blue: "#4f8cff",
        teal: "#2dd4bf",
      },
      boxShadow: {
        glow: "0 0 40px rgba(56, 211, 238, 0.16)",
      },
    },
  },
  plugins: [],
};
