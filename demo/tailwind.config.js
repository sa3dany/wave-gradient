const colors = require("tailwindcss/colors");

module.exports = {
  content: ["pages/**/*.js", "components/**/*.js"],
  theme: {
    extend: {
      animation: {
        fadein: "fadein 3.5s ease-in-out 0.5s both",
      },
      colors: {
        gray: colors.neutral,
      },
      keyframes: {
        fadein: {
          from: { opacity: "0%" },
          to: { opacity: "100%" },
        },
      },
    },
  },
};
