export default function glslLoader() {
  return {
    name: "rollup-plugin-glslify",
    transform(source, id) {
      if (!/\.(frag|vert|glsl)$/i.test(id)) return null;
      return `export default ${JSON.stringify(source)};`;
    },
  };
}
