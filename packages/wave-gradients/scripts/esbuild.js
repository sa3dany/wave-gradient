import { build } from "esbuild";
import { glsl } from "esbuild-plugin-glsl-include";

const watch = process.argv.includes("--watch");
watch && console.log("ready - watching for changes");

build({
  bundle: true,
  entryPoints: ["src/gradient.js"],
  format: "esm",
  outfile: "dist/wave-gradients.js",
  plugins: [glsl()],
  sourcemap: watch,
  watch: watch && {
    onRebuild(error) {
      !error && console.log("event - watch build succeeded");
    },
  },
}).catch(() => process.exit(1));
