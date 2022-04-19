// ---------------------------------------------------------------------
//
// Fragment shader stage for the wave gradients. The is the same as the
// original fragment shader used on strip.com for their gradients with
// comments added by me for clarity.
//
// ---------------------------------------------------------------------

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
// Fragment shader entry point
// ---------------------------------------------------------------------

void main() {
  lowp vec3 color = shared_Color;

  // Normalize the fragment pixel coordinates between 0.0 - 1.0 st is a
  // reference to the st swizzle mask which is usually used for texture
  // coordinates in shaders
  mediump vec2 st = gl_FragCoord.xy / resolution.xy;

  // In the original shader, this processing section was only enabled
  // based on an attribute value which was set to `true` if the HTML
  // attribute `data-js-darken-top` was set on the canvas element. Here,
  // for simplicity, I am alwaying enabling this extra processing step.
  color.g -= pow(st.y + sin(-12.0) * st.x, shadowPower) * 0.4;

  // Set the final pixel color
  gl_FragColor = vec4(color, 1.0);
}
