import { build } from "esbuild";

const watch = process.argv.includes("--watch");
watch && console.log("ready - esbuild watching for changes");

build({
  bundle: true,
  entryPoints: ["src/wave-gradient.js"],
  format: "esm",
  minify: !watch,
  outdir: "dist",
  sourcemap: watch,
  watch: watch && {
    onRebuild(error) {
      !error && console.log("event - esbuild build succeeded");
    },
  },
}).catch(() => process.exit(1));
