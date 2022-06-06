#version 300 es
// ---------------------------------------------------------------------
//
// Vertex shader stage. This is based on the original vertex shader used
// by stripe for their gradient. I've added more comments for clarity.
//
// ---------------------------------------------------------------------

#extension GL_GOOGLE_include_directive : enable
#include "includes/blend.glsl"
#include "includes/snoise.glsl"

// ---------------------------------------------------------------------
// Uniforms
// ---------------------------------------------------------------------

uniform mediump vec2 u_Resolution; // `mediump` to match fragment shader
uniform float u_Amplitude;
uniform float u_Realtime;
uniform float u_Seed;

const int i_MAX_COLOR_LAYERS = 9;
uniform vec3 u_BaseColor;
uniform int u_LayerCount;
uniform struct WaveLayers {
  float noiseCeil;
  float noiseFloor;
  float noiseFlow;
  float noiseSeed;
  float noiseSpeed;
  vec2 noiseFreq;
  vec3 color;
} u_WaveLayers[i_MAX_COLOR_LAYERS];

// ---------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------

in vec3 a_Position;

// ---------------------------------------------------------------------
// Varying variables
// ---------------------------------------------------------------------

// These are variables sent to the fragment shader as inputs
out vec3 v_Color;

// ---------------------------------------------------------------------
// Vertex shader entry point
// ---------------------------------------------------------------------

void main() {

  // scale down realtime to a reasonable value for animating the noise
  float time = u_Realtime * 5e-6;

  // Vertex displacement -----------------------------------------------

  vec2 frequency = vec2(14e-5, 29e-5);
  vec2 noiseCoord = (u_Resolution * a_Position.xy) * frequency;
  float amplitude = u_Amplitude * (2.0 / u_Resolution.y);

  float noise = snoise(vec3(
    noiseCoord.x * 3.0 + time * 3.0, noiseCoord.y * 4.0, time * 10.0 + u_Seed));

  // Fades noise values to 0 at the edges of the plane and limits the
  // displacement to positive values only.
  noise *= 1.0 - pow(abs(a_Position.y), 2.0);
  noise = max(0.0, noise);

  // Final vertex position. variables starting with `gl_` are built-in
  // to WebGL. The `gl_Position` variable is the output of the vertex
  // shader stage and sets the position of each vertex.
  gl_Position =
    vec4(a_Position.x, a_Position.y + (noise * amplitude), a_Position.z, 1.0);

  // Vertex color ------------------------------------------------------

  // start with the base color (1st layer)
  v_Color = u_BaseColor;

  // Blend all the layer colors together using normal blending. Get the
  // alpha value for each blending step from the noise function.
  for (int i = 0; i < u_LayerCount; i++) {
    WaveLayers layer = u_WaveLayers[i];

    float noise = snoise(vec3(
      noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
      noiseCoord.y * layer.noiseFreq.y,
      time * layer.noiseSpeed + layer.noiseSeed));

    // Normalize the noise value between 0.0 and 1.0
    noise = noise / 2.0 + 0.5;

    noise = smoothstep(layer.noiseFloor, layer.noiseCeil, noise);

    v_Color = blendNormal(v_Color, layer.color, pow(noise, 4.0));
  }
}
