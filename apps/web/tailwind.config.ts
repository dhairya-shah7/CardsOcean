import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        royal: {
          50: "#ebf2ff",
          100: "#dbebff",
          200: "#c7dfff",
          300: "#a2cbff",
          400: "#61a8ff",
          500: "#1240A6",
          600: "#0C3893",
          700: "#092c73",
          800: "#072154",
          900: "#04163b"
        },
        luxury: {
          gold: "#F59E0B",
          midnight: "#111827",
          mist: "#FFF7ED"
        }
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(245,158,11,0.22), 0 18px 50px rgba(18,64,166,0.16)",
        soft: "0 18px 40px rgba(17,24,39,0.08)"
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #1240A6 0%, #F59E0B 54%, #EC4899 100%)",
        "market-grid": "radial-gradient(circle at top left, rgba(18,64,166,0.08), transparent 34%), radial-gradient(circle at top right, rgba(245,158,11,0.09), transparent 34%), linear-gradient(180deg, #ffffff 0%, #fffaf2 100%)"
      }
    }
  },
  plugins: []
};

export default config;
