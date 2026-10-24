/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: "#0a2540",
          blue: "#1e3a8a",
          gold: "#f59e0b",
          light: "#f8fafc",
          border: "#e2e8f0"
        }
      }
    },
  },
  plugins: [],
}
