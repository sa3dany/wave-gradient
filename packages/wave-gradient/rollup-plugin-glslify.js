import { dirname } from "path";
import glslify from "glslify";

export default function glslLoader() {
  return {
    name: "rollup-plugin-glslify",
    transform(source, id) {
      if (!/\.glsl$/i.test(id)) return null;
      return `export default ${JSON.stringify(
        glslify(source, { basedir: dirname(id) })
      )}; // eslint-disable-line`;
    },
  };
}
