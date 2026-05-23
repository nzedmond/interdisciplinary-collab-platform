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
        ink: "#17201f",
        paper: "#fbfaf7",
        moss: "#426b5a",
        coral: "#c95f48",
        gold: "#dba74b",
        blue: "#446c95"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 32, 31, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
