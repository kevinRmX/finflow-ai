/** Colores del sistema de diseño de FinFlow (ver el lienzo de diseño). */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0A0E17', card: '#121826', line: '#1E2638' },
        paper: { DEFAULT: '#F6F7FB', card: '#FFFFFF', line: '#E5E9F2' },
        brand: { DEFAULT: '#3366FF', soft: '#A9BEFF' },
        mint: { DEFAULT: '#22C1A8', soft: '#5EE0C8', deep: '#0E8A78' },
        good: '#34D399',
        warn: '#FBBF24',
        bad: '#FB7185',
        muted: '#94A3B8',
      },
      fontFamily: { sans: ['Inter'] },
    },
  },
  plugins: [],
};
