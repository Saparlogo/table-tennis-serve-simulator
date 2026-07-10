/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        tennis: {
          green: '#2d6a4f',
          blue: '#023e8a',
          line: '#ffffff',
        }
      }
    },
  },
  plugins: [],
}
