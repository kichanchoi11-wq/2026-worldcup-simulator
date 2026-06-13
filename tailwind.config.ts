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
        pitch: {
          950: "#071a12",
          900: "#0b2419",
          800: "#113322",
          700: "#16442d",
          100: "#d7f5df"
        },
        trophy: "#d9a441",
        signal: "#246bfe",
        danger: "#d64b4b"
      },
      boxShadow: {
        panel: "0 16px 44px rgba(0, 0, 0, 0.18)"
      }
    }
  },
  plugins: []
};

export default config;
