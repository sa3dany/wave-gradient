const colors = require("tailwindcss/colors");

module.exports = {
  content: ["pages/**/*.js", "components/**/*.js"],
  theme: {
    extend: {
      animation: {
        fadein: "fadein 0.5s ease-in-out 0.5s both",
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
          from: { opacity: "0%", transform: "scale(1.5)" },
          to: { opacity: "100%", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};
