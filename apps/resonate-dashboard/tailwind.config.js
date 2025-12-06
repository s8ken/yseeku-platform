/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        graphite: "#101014",
        cyan: "#38E1FF",
        violet: "#9C6BFF",
        blue: "#385CFF"
      }
    }
  },
  plugins: []
}