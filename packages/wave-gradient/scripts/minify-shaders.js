import { spawnSync } from "child_process";
import { writeFileSync } from "fs";
import { watch as fsWatch } from "chokidar";

const SHADER_FILES = [
  "src/shaders/noise.vert",
  "src/shaders/color.frag",
  "src/shaders/includes/blend.glsl",
  "src/shaders/includes/snoise.glsl",
];

const watch = process.argv.includes("--watch");
if (watch) {
  console.log("ready - shader minifier watching for changes");
  fsWatch(SHADER_FILES).on("change", () => {
    minify();
  });
}

/**
 * Minify shaders.
 */
function minify() {
  const minifier = spawnSync("shader_minifier", [
    ...["-o", "-"],
    ...["--format", "js"],
    ...["--preserve-externals"],
    ...SHADER_FILES,
  ]);

  const module = minifier.stdout
    .toString()
    // convert to LF line endings
    .replace(/\r\n/g, "\n")
    // remove #extention and include directives
    .replace(/#(extension|include).+\n/g, "")
    // replace vars with exported consts
    .replace(/\bvar\s+/g, "export const ")
    // insert semicolons after the exported consts
    .replace(/`\n/g, "\n`;\n")
    // remove extra newlines
    .replace(/\n+$/g, "\n");

  writeFileSync("src/shaders/index.js", module);

  console.log("event - shader minify succeeded");
}

minify();
