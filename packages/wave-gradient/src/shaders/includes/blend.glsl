// glsl-blend 1.0.3 (c) Jamie Owen
// Published under the MIT license
// https://github.com/jamieowen/glsl-blend

vec3 blendNormal(vec3 base, vec3 blend) { return blend; }

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
  return (blendNormal(base, blend) * opacity + base * (1.0 - opacity));
}
