// ---------------------------------------------------------------------
//
// Vertex shader stage for the wave gradients. This is based on the
// originalcvertex shader used on stripe.com for their gradients. I've
// added more commments for clarity.
//
// ---------------------------------------------------------------------

// This has no effect on runtime, it is here simply because it is
// required by the GLSL linter I am using in order to support `#include`
// macros
#extension GL_GOOGLE_include_directive : enable

// ---------------------------------------------------------------------
// Includes
// ---------------------------------------------------------------------

#include "includes/blend.glsl"
#include "includes/snoise.glsl"

// ---------------------------------------------------------------------
// Uniforms
// ---------------------------------------------------------------------

// to match precision in fragment shader, `mediump` is used here.

uniform mediump vec2 u_Resolution;
uniform float u_Amplitude;
uniform float u_Realtime;
uniform float u_Seed;
uniform float u_Speed;

const int i_MAX_COLOR_LAYERS = 9;
uniform vec3 u_BaseColor;
uniform struct WaveLayers {
  vec3 color;
  bool isSet;
  float noiseCeil;
  float noiseFloor;
  float noiseFlow;
  vec2 noiseFreq;
  float noiseSeed;
  float noiseSpeed;
} u_WaveLayers[i_MAX_COLOR_LAYERS];

// ---------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------

attribute vec3 position;

// ---------------------------------------------------------------------
// Varying
// ---------------------------------------------------------------------

// These are variables sent to the fragment shader
varying vec3 v_Color;

// ---------------------------------------------------------------------
// Vertex shader entry point
// ---------------------------------------------------------------------

void main() {

  // scale down realtime to a resonable value for animating the noise
  float time = u_Realtime * 5e-6;

  // Vertex displacement -----------------------------------------------

  vec2 frequency = vec2(14e-5, 29e-5);
  vec2 noiseCoord = (u_Resolution * position.xy) * frequency;
  float amplitude = u_Amplitude * (2.0 / u_Resolution.y);

  float noise = snoise(vec3(
    noiseCoord.x * 3.0 + time * 3.0, noiseCoord.y * 4.0, time * 10.0 + u_Seed));

  // Fades noise value to 0 at the upper edges of the plane and limits
  // the displacement to positive values.
  noise *= 1.0 - pow(abs(position.y), 2.0);
  noise = max(0.0, noise);

  // Final vertex position. variables starting with `gl_` are built-in
  // to WebGL. The `gl_Position` variable is the output of the vertex
  // shader stage and sets the position of each vertex.
  gl_Position =
    vec4(position.x, position.y + (noise * amplitude), position.z, 1.0);

  // Vertex color ------------------------------------------------------

  // Initialize vertex color with 1st layer color
  v_Color = u_BaseColor;

  // Loop though the color layers and belnd whith the previous layer
  // color with an alpha value based on the noise function
  for (int i = 0; i < i_MAX_COLOR_LAYERS; i++) {

    // Break from loop on the first undefinde wave layer
    if (!u_WaveLayers[i].isSet) {
      break;
    }

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
