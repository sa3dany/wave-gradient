const colors = require("tailwindcss/colors");

module.exports = {
  content: ["pages/**/*.js", "components/**/*.js"],
  theme: {
    extend: {
      animation: {
        "fade-in": "fade-in 1.5s ease-in-out both",
      },
      colors: {
        gray: colors.neutral,
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0%" },
          to: { opacity: "100%" },
        },
      },
    },
  },
};
