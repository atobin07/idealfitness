import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eefdf3",
          100: "#d6f9e2",
          200: "#b0f1c9",
          300: "#7ce4a8",
          400: "#42cf82",
          500: "#1cb567",
          600: "#109352",
          700: "#0f7544",
          800: "#115c39",
          900: "#0f4c31",
        },
        ink: {
          900: "#0b1120",
          800: "#141c2e",
          700: "#1f2937",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
