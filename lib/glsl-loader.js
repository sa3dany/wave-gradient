const path = require("path");
const glsl = require("glslify");

module.exports = function loader(source) {
  return glsl(source, { basedir: path.dirname(this.resourcePath) });
};
