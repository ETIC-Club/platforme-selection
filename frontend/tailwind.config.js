/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'] },
      colors: {
        brand: { DEFAULT: '#09a99d', dark: '#0b8a81', light: '#e0f5f3' },
        ink: '#14142b',
        surface: '#f7f7f7',
      },
      boxShadow: { card: '0 6px 24px rgba(20,20,43,0.07)' },
    },
  },
  plugins: [],
};
