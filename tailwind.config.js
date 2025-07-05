// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./public/index.html", // CRA uses public/index.html
    "./src/**/*.{js,jsx,ts,tsx}", // CRA typically uses .js and .jsx by default
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'], // Add Inter font for consistent styling
      },
    },
  },
  plugins: [],
}