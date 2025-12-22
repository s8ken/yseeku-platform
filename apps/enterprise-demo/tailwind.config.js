/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sonate: {
          slate: {
            950: '#0f172a',
            900: '#1e293b',
            800: '#334155',
          },
          cyan: {
            400: '#22d3ee',
            500: '#06b6d4',
            600: '#0891b2',
          },
          emerald: {
            400: '#34d399',
            500: '#10b981',
            600: '#059669',
          },
          amber: {
            400: '#fbbf24',
            500: '#f59e0b',
            600: '#d97706',
          },
          red: {
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}