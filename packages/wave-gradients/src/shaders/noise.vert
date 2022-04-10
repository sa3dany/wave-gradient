// ---------------------------------------------------------------------
// Includes
// ---------------------------------------------------------------------

// This has no effect on runtime, it is here simply because it is
// required by the GLSL linter I am using in order to support `#include`
// macros
#extension GL_GOOGLE_include_directive: enable

#include "includes/blend.glsl"
#include "includes/noise.glsl"

// ---------------------------------------------------------------------
// Default pricision
// ---------------------------------------------------------------------

precision highp float;

// ---------------------------------------------------------------------
// Uniforms
// ---------------------------------------------------------------------

// three.js
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// custom
uniform vec2 resolution;
uniform float u_time;
uniform struct Global {
  vec2 noiseFreq;
  float noiseSpeed;
} u_global;

uniform struct VertDeform {
  vec2 noiseFreq;
  float noiseAmp;
  float noiseSpeed;
  float noiseFlow;
  float noiseSeed;
} u_vertDeform;

#define MAX_COLOR_LAYERS 9

uniform vec3 u_baseColor;
uniform struct WaveLayers {
  bool isSet;
  vec3 color;
  vec2 noiseFreq;
  float noiseSpeed;
  float noiseFlow;
  float noiseSeed;
  float noiseFloor;
  float noiseCeil;
} u_waveLayers[MAX_COLOR_LAYERS];

// ---------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------

// three.js built-in attributes, except uv, which is instead of being
// normalized between 0.0-1.0, it's normalized between -1.0-1.0
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// ---------------------------------------------------------------------
// Output variables
// ---------------------------------------------------------------------

varying vec3 color;

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

void main() {
  float time = u_time * u_global.noiseSpeed;
  vec2 noiseCoord = resolution * uv * u_global.noiseFreq;

  // Tilt the plane towards the camera
  float tilt = resolution.y / 2.0 * uv.y;

  vec3 g;
  float noise = psrdnoise(
    vec3(
      noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
      noiseCoord.y * u_vertDeform.noiseFreq.y,
      time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed),
    vec3(0.0),
    time * u_vertDeform.noiseFlow * 2.0,
    g
  ) * u_vertDeform.noiseAmp;

  // Fade noise to zero at edges and limit to +ve values
  noise *= 1.0 - pow(abs(uv.y), 2.0);
  noise = max(0.0, noise);

  vec3 pos = position + (normal * (noise + tilt));

  color = u_baseColor;

  for (int i = 0; i < MAX_COLOR_LAYERS; i++) {
    WaveLayers layer = u_waveLayers[i];

    // Break from loop on the first undefinde wave layer
    if (!layer.isSet) {
      break;
    }

    float noise = smoothstep(
      layer.noiseFloor,
      layer.noiseCeil,
      psrdnoise(
        vec3(
          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
          noiseCoord.y * layer.noiseFreq.y,
          time * layer.noiseSpeed + layer.noiseSeed),
        vec3(0.0),
        time * layer.noiseFlow * 2.0,
        g
      ) / 2.0 + 0.5);

    color = blendNormal(color, layer.color, pow(noise, 4.0));
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
