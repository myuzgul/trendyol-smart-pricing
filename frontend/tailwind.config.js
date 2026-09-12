/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        trendyol: {
          orange: '#F27A1A',
          hover: '#d6670e',
          light: '#FFF5EB',
          dark: '#1E293B'
        }
      }
    },
  },
  plugins: [],
}
