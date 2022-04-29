import { build } from "esbuild";
import { glsl } from "esbuild-plugin-glsl-include";

const watch = process.argv.includes("--watch");
watch && console.log("ready - watching for changes");

build({
  bundle: true,
  entryPoints: ["src/wave-gradient.js"],
  format: "esm",
  minify: !watch,
  outdir: "dist",
  plugins: [glsl()],
  sourcemap: watch,
  watch: watch && {
    onRebuild(error) {
      !error && console.log("event - watch build succeeded");
    },
  },
}).catch(() => process.exit(1));
