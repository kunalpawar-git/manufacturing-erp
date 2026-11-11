/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#94bde0',
          400: '#5e9dd1',
          500: '#387fc0',
          600: '#2665a3',
          700: '#1f5184',
          800: '#1c446c',
          900: '#1b3a5a',
          950: '#0f243a',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
    },
  },
  plugins: [],
}
