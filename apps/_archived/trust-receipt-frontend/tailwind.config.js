/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sonate-cyan': '#00d4ff',
        'sonate-blue': '#0066cc',
        'sonate-dark': '#0a0a0a',
        'sonate-card': '#1a1a1a',
        'sonate-success': '#00ff88',
        'sonate-warning': '#ffaa00',
        'sonate-danger': '#ff3366',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}