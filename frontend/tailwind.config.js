/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // Enables dark mode with `dark` class
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#EFF6FF",
          100: "#DBEAFE",
          400: "#60A5FA",
          600: "#2563EB",
          700: "#1D4ED8",
        },
      },
      transitionProperty: {
        "colors-opacity": "background-color, color, opacity",
      },
    },
  },
  plugins: [],
};