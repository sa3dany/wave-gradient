const colors = require("tailwindcss/colors");

module.exports = {
  content: ["pages/**/*.js", "components/**/*.js"],
  theme: {
    extend: {
      animation: {
        fadein: "fadein 0.6s ease-in-out 0.6s both",
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
          from: {
            filter: "blur(64px)",
            opacity: "0%",
            transform: "scale(1.5)",
          },
          to: { filter: "none", opacity: "100%" },
        },
      },
    },
  },
  plugins: [],
};
