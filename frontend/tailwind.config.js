/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        panel: "#12161c",
        sidebar: "#0d1117",
        accent: "#d97706",
      },
    },
  },
  plugins: [],
};