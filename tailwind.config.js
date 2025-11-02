/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        maxWidth: {
          '14xl': '1800px',
        },
      },
    },
    plugins: [],
  }
  