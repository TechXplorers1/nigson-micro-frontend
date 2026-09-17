/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./projects/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        ink: "var(--ink)",
        "muted-ink": "var(--muted-ink)",
        hairline: "var(--hairline)",
        surface: "var(--surface)",
        "surface-alt": "var(--surface-alt)",
        brand: "var(--brand)",
        "brand-deep": "var(--brand-deep)",
        "brand-soft": "var(--brand-soft)",
        "brand-foreground": "var(--brand-foreground)",
      },
      fontFamily: {
        sans: "var(--font-sans)",
        display: "var(--font-display)",
      }
    },
  },
  plugins: [],
}
