/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .5 },
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(20px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulse_delayed_200: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) 200ms infinite',
        pulse_delayed_400: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) 400ms infinite',
        fadeIn: 'fadeIn 0.3s ease-out forwards',
        slideUp: 'slideUp 0.3s ease-out forwards',
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}