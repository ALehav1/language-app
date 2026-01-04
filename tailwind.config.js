/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base dark theme
        surface: {
          50: '#f8fafc',
          100: '#1e293b',
          200: '#0f172a',
          300: '#020617',
        },
        // Language-specific accents
        arabic: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        spanish: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Card states
        dismiss: '#ef4444',
        save: '#22c55e',
        later: '#3b82f6',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'card-enter': 'cardEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'card-exit-left': 'cardExitLeft 0.3s ease-out forwards',
        'card-exit-right': 'cardExitRight 0.3s ease-out forwards',
        'card-exit-down': 'cardExitDown 0.3s ease-out forwards',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        cardEnter: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(20px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        cardExitLeft: {
          '0%': { opacity: '1', transform: 'translateX(0) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translateX(-120%) rotate(-15deg)' },
        },
        cardExitRight: {
          '0%': { opacity: '1', transform: 'translateX(0) rotate(0deg)' },
          '100%': { opacity: '0', transform: 'translateX(120%) rotate(15deg)' },
        },
        cardExitDown: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(100%)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
