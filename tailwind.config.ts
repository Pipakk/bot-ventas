import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ecf5ff",
          100: "#d6e8ff",
          200: "#adcfff",
          300: "#84b5ff",
          400: "#5b9cff",
          500: "#2f7fff",
          600: "#1f63db",
          700: "#1549a8",
          800: "#0d326f",
          900: "#061b3a"
        }
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;


