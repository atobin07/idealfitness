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
        // iDEAL FITNESS sky-blue
        brand: {
          50: "#ecfaff",
          100: "#d4f2fd",
          200: "#ade7fb",
          300: "#77d7f6",
          400: "#3cc0ea", // logo blue
          500: "#1aa9dc",
          600: "#0a89bb", // primary button (white text passes AA large)
          700: "#0c6f98",
          800: "#125b7c",
          900: "#144b66",
        },
        // iDEAL navy (from the hero background)
        ink: {
          900: "#1e2a3a",
          800: "#2b3a52",
          700: "#3a4a63",
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
