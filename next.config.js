/** @type {import('next').NextConfig} */

const path = require("path");

module.exports = {
  reactStrictMode: true,

  webpack: (config) => {
    config.module.rules.push({
      test: /\.glsl$/,
      type: "asset/source",
      use: [{ loader: path.resolve("lib/glsl-loader.js") }],
    });

    return config;
  },
};
