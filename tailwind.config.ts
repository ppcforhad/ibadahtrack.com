import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: { primary: { DEFAULT: "#059669", dark: "#047857", light: "#10B981" } },
      fontFamily: { sans: ["\"Hind Siliguri\"", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
export default config;
