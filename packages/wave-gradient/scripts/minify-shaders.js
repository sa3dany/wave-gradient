import { spawnSync } from "child_process";
import { watch as fsWatch } from "chokidar";
import { unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { basename, join } from "path";
import { parse as parseInclude } from "./glsl-include.js";

const SHADER_FILES = ["src/shaders/noise.vert", "src/shaders/color.frag"];

const watch = process.argv.includes("--watch");
if (watch) {
  console.log("ready - shader minifier watching for changes");
  fsWatch(SHADER_FILES).on("change", () => {
    minify();
  });
}

/**
 * Parse `#include ...` directives
 *
 * @param {string} filePath - file path
 * @returns {string} source file with includes inlined
 */
async function inlineIncludes(filePath) {
  // inline includes
  const { source } = await parseInclude(filePath);

  // open a temp file in the os temp dir
  const tempFilePath = join(tmpdir(), basename(filePath));
  writeFileSync(tempFilePath, source);

  return tempFilePath;
}

/**
 * Minify shaders.
 */
async function minify() {
  // Inline includes
  const shaderFiles = await Promise.all(SHADER_FILES.map(inlineIncludes));

  try {
    const minifier = spawnSync("shader_minifier", [
      ...["-o", "-"],
      ...["--format", "js"],
      ...["--preserve-externals"],
      ...shaderFiles,
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

    writeFileSync("src/shaders.js", module);
  } finally {
    // Clean combined shader files
    shaderFiles.forEach((file) => {
      unlinkSync(file);
    });
  }

  console.log("event - shader minify succeeded");
}

minify();
