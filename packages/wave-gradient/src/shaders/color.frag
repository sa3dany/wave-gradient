// ---------------------------------------------------------------------
//
// Fragment shader stage for the wave gradients. The is the same as the
// original fragment shader used on stripe.com for their gradients with
// comments added by me for clarity.
//
// ---------------------------------------------------------------------

// Use atleast `mediump` to avoid color banding in the color noise. see:
// https://webgl2fundamentals.org/webgl/lessons/webgl-precision-issues
precision mediump float;

// ---------------------------------------------------------------------
// Uniforms
// ---------------------------------------------------------------------

uniform vec2 u_Resolution;
uniform float u_ShadowPower;

// ---------------------------------------------------------------------
// Input variables
// ---------------------------------------------------------------------

varying vec3 v_Color;

// ---------------------------------------------------------------------
// Fragment shader entry point
// ---------------------------------------------------------------------

void main() {
  vec3 color = v_Color;

  // Normalize the fragment pixel coordinates between 0.0 - 1.0 st is a
  // reference to the st swizzle mask which is usually used for texture
  // coordinates in shaders
  vec2 st = gl_FragCoord.xy / u_Resolution.xy;

  // In the original shader, this processing section was only enabled
  // based on an attribute value which was set to `true` if the HTML
  // attribute `data-js-darken-top` was set on the canvas element. Here,
  // for simplicity, I am alwaying enabling this extra processing step.
  color.g -= pow(st.y + sin(-12.0) * st.x, u_ShadowPower) * 0.4;

  // Set the final pixel color
  gl_FragColor = vec4(color, 1.0);
}
