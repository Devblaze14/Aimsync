import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "2rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        brand: {
          navy: "#0F1E3D",
          blue: "#2563EB",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#E11D48",
        },
        cream: "hsl(var(--cream))",
        page: "hsl(var(--page))",
        chip: {
          peach:   { DEFAULT: "hsl(var(--chip-peach))",   foreground: "hsl(var(--chip-peach-fg))" },
          mint:    { DEFAULT: "hsl(var(--chip-mint))",    foreground: "hsl(var(--chip-mint-fg))" },
          sky:     { DEFAULT: "hsl(var(--chip-sky))",     foreground: "hsl(var(--chip-sky-fg))" },
          lilac:   { DEFAULT: "hsl(var(--chip-lilac))",   foreground: "hsl(var(--chip-lilac-fg))" },
        },
      },
      borderRadius: {
        lg: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 6px)",
        sm: "calc(var(--radius) - 10px)",
        xl: "var(--radius)",
        "2xl": "calc(var(--radius) + 4px)",
        "3xl": "calc(var(--radius) + 12px)",
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
