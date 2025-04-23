import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Common Web3/DeFi color palette
        primary: {
          DEFAULT: "#00aa00", // Your green accent
          light: "#00cc00",
          dark: "#008800",
        },
        secondary: {
          DEFAULT: "#002200", // Your dark background
          light: "#003300",
          dark: "#001100",
        },
        accent: {
          DEFAULT: "#004400", // Border color
          hover: "#006600",
        }
      },
      // Add animation utilities for loading states (common in Web3 apps)
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  // Reducing unused CSS in production
  future: {
    hoverOnlyWhenSupported: true,
  },
  plugins: [],
};

export default config;