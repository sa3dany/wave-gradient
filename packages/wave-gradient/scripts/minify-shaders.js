import { spawnSync } from "child_process";
import { writeFile } from "fs/promises";

const shader_files = [
  "src/shaders/noise.vert",
  "src/shaders/color.frag",
  "src/shaders/includes/blend.glsl",
  "src/shaders/includes/snoise.glsl",
].join(" ");

const minifier_args =
  `-o - --format js --preserve-all-globals ${shader_files}`.split(" ");

const minifier = spawnSync("scripts/shader_minifier", minifier_args);

await writeFile(
  "src/shaders/bundle.js",
  minifier.stdout
    .toString()
    .replace(/\r\n/g, "\n")
    .replace(/#(extension|include).+\n/g, "")
    .replace(/\bvar\s+/g, "export const ")
    .replace(/`\n/g, "\n`;\n")
    .replace(/\n+$/g, "\n")
);
