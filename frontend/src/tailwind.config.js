/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bee-yellow': '#f4a261',
        'bee-orange': '#e9c46a',
        'bee-green': '#2a9d8f',
        'bee-dark': '#264653',
      },
      animation: {
        'buzz': 'buzz 2s infinite',
        'bounce-slow': 'bounce 3s infinite',
      },
      keyframes: {
        buzz: {
          '0%, 50%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        }
      } 
    },
  },
  plugins: [],
}