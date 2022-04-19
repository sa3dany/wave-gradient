// ---------------------------------------------------------------------
// Uniforms
// ---------------------------------------------------------------------

uniform highp vec2 resolution;
uniform mediump float shadowPower;

// ---------------------------------------------------------------------
// Input variables
// ---------------------------------------------------------------------

varying lowp vec3 shared_Color;

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

void main() {
  lowp vec3 color = shared_Color;

  // Normalize the fragment pixel coordinates between 0.0 - 1.0 st is a
  // reference to the st swizzle mask which is usually used for texture
  // coordinates in shaders
  mediump vec2 st = gl_FragCoord.xy / resolution.xy;

  color.g -= pow(st.y + sin(-12.0) * st.x, shadowPower) * 0.4;

  // Set the final pixel color
  gl_FragColor = vec4(color, 1.0);
}
