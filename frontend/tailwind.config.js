/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nature: {
          'leaf': '#2D5A27', // Deep Leaf Green
          'wheat': '#E2B13C', // Wheat Gold
          'soil': '#4E342E',  // Soil Brown
          'fog': '#E0E4E8',   // Foggy Morning Gray
          'sky': '#87CEEB',   // Soft Sky Blue
          'sage': '#7B8E7E',  // Muted Sage
          'earth': '#F4F1EA', // Light Earthy Background
        },
        dark: {
          'bg': '#1A1C19',    // Earthy dark background
          'card': '#242922',
          'text': '#E2E3DE',
          'muted': '#8E928A',
        }
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'premium': '0 20px 40px -12px rgba(45, 90, 39, 0.12)',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}