const colors = require("tailwindcss/colors");

module.exports = {
  content: ["pages/**/*.{js,ts}"],
  theme: {
    extend: {
      colors: {
        gray: colors.neutral,
      },
      fontFamily: {
        sans: ["'PT Sans'", "sans-serif"],
        display: ["'Bebas Neue'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
