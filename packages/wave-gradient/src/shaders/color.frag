#version 300 es
// ---------------------------------------------------------------------
//
// Fragment shader stage for the wave gradients. The is the same as the
// original fragment shader used on stripe.com for their gradients with
// comments added by me for clarity.
//
// ---------------------------------------------------------------------

// Use atleast `mediump` to avoid color banding in the color noise. see:
// https://webgl2fundamentals.org/webgl/lessons/webgl-precision-issues
// The commented lines before and after the next line are for the shader
// minifier to ignore the line since at the moment it causes a pparse
// error
//[
precision mediump float;
//]

// ---------------------------------------------------------------------
// Uniforms
// ---------------------------------------------------------------------

uniform vec2 u_Resolution;
uniform float u_ShadowPower;

// ---------------------------------------------------------------------
// Input variables
// ---------------------------------------------------------------------

in vec3 v_Color;

// ---------------------------------------------------------------------
// Output variable
// ---------------------------------------------------------------------

out vec4 color;

// ---------------------------------------------------------------------
// Fragment shader entry point
// ---------------------------------------------------------------------

void main() {
  // Normalize the fragment pixel coordinates between 0.0 - 1.0 st is a
  // reference to the st swizzle mask which is usually used for texture
  // coordinates in shaders
  vec2 st = gl_FragCoord.xy / u_Resolution.xy;

  color = vec4(v_Color, 1.0);

  // In the original shader, this processing section was only enabled
  // based on an attribute value which was set to `true` if the HTML
  // attribute `data-js-darken-top` was set on the canvas element. Here,
  // for simplicity, I am alwaying enabling this extra processing step.
  color.g -= pow(st.y + sin(-12.0) * st.x, u_ShadowPower) * 0.4;
}
