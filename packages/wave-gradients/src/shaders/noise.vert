// ---------------------------------------------------------------------
//
// Vertex shader stage for the wave gradients. This is the same as the
// originalvertex shader used on stripe.com for their gradients. I've
// added more commments for clarity and refactored a few parts into
// functions.
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

// three.js ------------------------------------------------------------

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// custom --------------------------------------------------------------

// to match precision in fragment shader, `mediump` is used here.
uniform mediump vec2 resolution;

uniform float realtime;
uniform float amplitude;
uniform float speed;
uniform float seed;

#define MAX_COLOR_LAYERS 9

uniform vec3 baseColor;
uniform struct WaveLayers {
  bool isSet;
  vec3 color;
  vec2 noiseFreq;
  float noiseSpeed;
  float noiseFlow;
  float noiseSeed;
  float noiseFloor;
  float noiseCeil;
} waveLayers[MAX_COLOR_LAYERS];

// ---------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------

// three.js built-in attributes, except uv, which is instead of being
// normalized between 0.0-1.0, it's normalized between -1.0-1.0
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

// Tilts the plane across the x-axis. This is done here in the vertex
// shader instead of simply rotating the geometry because doing it the
// following way stretches the plane to cover the entire canvas size
float orthographicTilt(vec2 uv, vec2 canvasSize) {
  float tilt = canvasSize.y / 2.0 * uv.y;
  return tilt;
}

// Fades noise value to 0.0 at the edges of the plane and limit the
// displacement to positive value only (hills)
float clampNoise(float noise, vec2 uv) {
  noise *= 1.0 - pow(abs(uv.y), 2.0);
  return max(0.0, noise);
}

// ---------------------------------------------------------------------
// Output variables -> fragment shader stage
// ---------------------------------------------------------------------

varying vec3 shared_Color;

// ---------------------------------------------------------------------
// Vertex shader entry point
// ---------------------------------------------------------------------

void main() {

  // scale down realtime to a resonable value for animating the noise
  float time = realtime * 5e-6;

  // Vertex displacement -----------------------------------------------

  vec2 frequency = vec2(14e-5, 29e-5);
  vec2 noiseCoord = resolution * uv * frequency;

  float noise = snoise(vec3(
    noiseCoord.x * 3.0 + time * 3.0, noiseCoord.y * 4.0, time * 10.0 + seed));

  noise *= 320.0;
  noise = clampNoise(noise, uv);
  noise += orthographicTilt(uv, resolution);

  // Final vertex position. variables starting with `gl_` are built-in
  // to WebGL. The `gl_Position` variable is the output of the vertex
  // shader stage and sets the position of each vertex.
  vec3 newPosition = position + (normal * noise);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);

  // Vertex color ------------------------------------------------------

  // Initialize vertex color with 1st layer color
  shared_Color = baseColor;

  // Loop though the color layers and belnd whith the previous layer
  // color with an alpha value based on the noise function
  for (int i = 0; i < MAX_COLOR_LAYERS; i++) {

    WaveLayers layer = waveLayers[i];

    // Break from loop on the first undefinde wave layer
    if (!waveLayers[i].isSet) {
      break;
    }

    float noise = snoise(vec3(
      noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
      noiseCoord.y * layer.noiseFreq.y,
      time * layer.noiseSpeed + layer.noiseSeed));

    // Normalize the noise value between 0.0 and 1.0
    noise = noise / 2.0 + 0.5;

    noise = smoothstep(layer.noiseFloor, layer.noiseCeil, noise);

    shared_Color = blendNormal(shared_Color, layer.color, pow(noise, 4.0));
  }
}

// ---------------------------------------------------------------------
// Varying are passed to the next stage, the fragment shader
// ---------------------------------------------------------------------
