import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import glslLoader from "./rollup-plugin-glslify";
import pkg from "./package.json";

const isProduction = process.env.NODE_ENV === "production";

export default (async () => [
  // browser-friendly UMD build
  {
    input: "src/main.js",
    output: {
      name: "waveGradient",
      file: pkg.browser,
      format: "umd",
    },
    plugins: [
      glslLoader(),
      resolve(), // so Rollup can find `ms`
      isProduction && (await import("rollup-plugin-terser")).terser(),
    ],
  },

  {
    input: "src/main.js",
    plugins: [
      glslLoader(),
      isProduction && (await import("rollup-plugin-terser")).terser(),
    ],
    external: ["three"],
    output: [
      { file: pkg.main, format: "cjs" },
      { file: pkg.module, format: "es" },
    ],
  },
])();
