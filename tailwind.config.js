/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        maxWidth: {
          '8xl': '96rem', // 相当于 1536px
          '10xl': '128rem' // 1760px
        },
      },
    },
    plugins: [],
  }
  