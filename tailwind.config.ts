import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: { 900: "#0F1115", 700: "#1E2129", 500: "#3D424E" },
        ember: { 500: "#E0531F", 400: "#F4724A" },
        cream: { 50: "#FAF8F4", 100: "#F4F1EA" },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial"],
        display: ["Georgia", "ui-serif", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
