/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: true,
};

module.exports = {
  ...nextConfig,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.glsl$/,
      use: "webpack-glsl-loader",
    });
    return config;
  },
};
