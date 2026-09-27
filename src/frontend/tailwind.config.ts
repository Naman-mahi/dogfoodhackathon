import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f6ff",
          100: "#e0edfe",
          200: "#bae0fd",
          300: "#7cc8fb",
          400: "#36acf5",
          500: "#0c92e7",
          600: "#0173c7",
          700: "#025ca1",
          800: "#064e86",
          900: "#0b416f",
          950: "#072a4a",
        },
        navy: {
          900: "#0B1528",
          950: "#070E1B",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        script: ["Caveat", "Brush Script MT", "cursive"],
      },
    },
  },
  plugins: [],
};
export default config;
