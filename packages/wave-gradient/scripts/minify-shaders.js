import { spawnSync } from "child_process";
import { writeFile } from "fs/promises";

const shaderFiles = [
  "src/shaders/noise.vert",
  "src/shaders/color.frag",
  "src/shaders/includes/blend.glsl",
  "src/shaders/includes/snoise.glsl",
];

const minifierArgs = [
  ...["-o", "-"],
  ...["--format", "js"],
  ...["--preserve-all-globals"],
  ...shaderFiles,
];

const minifier = spawnSync("shader_minifier", minifierArgs);

await writeFile(
  "src/shaders/bundle.js",
  minifier.stdout
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
    .replace(/\n+$/g, "\n")
);
