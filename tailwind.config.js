/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-white': '#FFFFFF',
        'brand-yellow': '#FFD700',
        'brand-green': '#00FF7F', // Energy Green
        'brand-black': '#0A0A14', // Deep Black
        'brand-orange': '#FFA500', // Warning Orange
        'brand-gold': '#FFC107',   // Glory Gold
        'brand-text-gray': '#CCCCCC',
        'brand-text-blue': '#40E0D0',
      },
      fontFamily: {
        sans: ['Geist Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'charge-flash': 'chargeFlash 1s infinite',
      },
      keyframes: {
        chargeFlash: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
}