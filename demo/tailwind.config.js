const colors = require("tailwindcss/colors");

module.exports = {
  content: ["pages/**/*.js", "components/**/*.js"],
  theme: {
    extend: {
      animation: {
        fadein: "fadein 2s ease-in forwards",
      },
      colors: {
        gray: colors.neutral,
      },
      fontFamily: {
        sans: ["'PT Sans'", "sans-serif"],
        display: ["'Bebas Neue'", "sans-serif"],
      },
      keyframes: {
        fadein: {
          from: { opacity: "0%" },
          to: { opacity: "100%" },
        },
      },
    },
  },
  plugins: [],
};
