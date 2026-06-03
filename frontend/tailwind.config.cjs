// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Flat primary color + named variants so bg-primary, text-primary, focus:ring-primary all work
        primary: {
          DEFAULT: "hsl(24, 90%, 45%)",
          dark:    "hsl(24, 90%, 36%)",
          light:   "hsl(24, 90%, 60%)",
        },
        secondary: "hsl(210, 10%, 20%)",
        accent:    "hsl(48, 85%, 55%)",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
