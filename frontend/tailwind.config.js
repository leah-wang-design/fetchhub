/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        heading: ['Heiti SC', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      colors: {
        cream: '#FCF6EE',
        gray: {
          750: '#2b3544', // Custom color between gray-800 and gray-700
        },
      },
    },
  },
  plugins: [],
}
