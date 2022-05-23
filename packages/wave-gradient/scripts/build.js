import { spawnSync } from "child_process";
import { watch as fsWatch } from "chokidar";
import { build } from "esbuild";
import { readFile as _readFile, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { basename, dirname, join } from "path";
import { promisify } from "util";

const readFile = promisify(_readFile);

const MODULE_CACHE = new Map();
const SHADER_FILES = ["src/shaders/noise.vert", "src/shaders/color.frag"];

// ---------------------------------------------------------------------
// Parse command line arguments
// ---------------------------------------------------------------------

const watchFlag = process.argv.includes("--watch");
const noGlslMinify = process.argv.includes("--no-glsl-minify");

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

/**
 * Inlines GLSL code referenced by `#include` statements.
 *
 * @author Ricardo Matias
 * @license MIT
 * @copyright 2021 Ricardo Matias
 * @param {string} filePath - file path
 * @param {Map} cache - cache of already inlined files
 * @see https://github.com/ricardomatias/esbuild-plugin-glsl-include
 */
const parseIncludes = async (filePath, cache = MODULE_CACHE) => {
  let source = await readFile(filePath, "utf8");

  cache.set(filePath, source);

  const includes = [];
  const warnings = [];
  const importPattern = /#include "([./\w_-]+)"/gi;
  let match = importPattern.exec(source);

  while (match != null) {
    const pragma = match[0];
    const filename = match[1];
    const file = join(dirname(filePath), filename);

    try {
      let contents = cache.get(file);

      if (!contents) {
        const inner = await parseIncludes(file, cache);

        inner.warnings.forEach((w) => warnings.push(w));

        contents = inner.source;
        cache.set(file, inner.source);
      }

      includes.push({ file, contents, target: pragma });

      match = importPattern.exec(source);
    } catch (err) {
      const lines = source.split(/\r|\n|\r\n/g);
      const lineIndex = lines.indexOf(match[0]);
      const lineText = lines[lineIndex];

      warnings.push({
        text: `File from <${match[0]}> not found`,
        location: {
          file: filename,
          line: lineIndex + 1,
          length: filename.length,
          column: lineText.indexOf(filename),
          lineText,
        },
      });

      includes.push({ file, contents: "", target: match[0] });

      match = importPattern.exec(source);
    }
  }

  for (let index = 0; index < includes.length; index++) {
    const include = includes[index];

    source = source.replace(include.target, include.contents);
  }

  return { source, warnings };
};

/**
 * Runs esbuild.
 *
 * @param {boolean} watch - Whether to watch for changes.
 */
function esbuild(watch = false) {
  build({
    bundle: true,
    entryPoints: ["src/wave-gradient.js"],
    format: "esm",
    minify: !watch,
    outdir: "dist",
    sourcemap: true,
    watch: watch && {
      onRebuild(error) {
        !error && console.log("event - esbuild build succeeded");
      },
    },
  }).catch(() => process.exit(1));
}

/**
 * Parse `#include ...` directives
 *
 * @param {string} filePath - file path
 * @returns {string} source file with includes inlined
 */
async function inlineIncludes(filePath) {
  const { source } = await parseIncludes(filePath);
  const tempFilePath = join(tmpdir(), basename(filePath));
  writeFileSync(tempFilePath, source);
  return tempFilePath;
}

/**
 * Minify shaders.
 */
async function shaderMinifier() {
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
  } catch (error) {
    process.exit(1);
  } finally {
    // Clean combined shader files
    shaderFiles.forEach((file) => {
      unlinkSync(file);
    });
  }

  console.log("event - shader build succeeded");
}

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

// First make sure shader minifier performs a successfull minification
if (!noGlslMinify) {
  await shaderMinifier();

  // Register watcher for shader files
  if (watchFlag) {
    console.log("ready - watching for changes");
    fsWatch(SHADER_FILES).on("change", () => {
      shaderMinifier();
    });
  }
}

// Finally run esbuild
esbuild(watchFlag);
