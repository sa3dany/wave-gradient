import resolve from "@rollup/plugin-node-resolve";
import glslLoader from "./rollup-plugin-glslify";
import pkg from "./package.json";

const isProduction = process.env.NODE_ENV === "production";

export default (async () => [
  {
    input: "src/main.js",
    output: {
      name: "waveGradient",
      file: pkg.exports["."],
      format: "umd",
    },
    plugins: [
      resolve(),
      glslLoader(),
      isProduction && (await import("rollup-plugin-terser")).terser(),
    ],
  },
])();
