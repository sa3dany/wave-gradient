// GLSL Blend 1.0.3 ©️ Jamie Owen
// Published under the MIT license.
// https://github.com/jamieowen/glsl-blend

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
  return blend * opacity + base * (1.0 - opacity);
}
