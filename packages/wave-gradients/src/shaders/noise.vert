#extension GL_GOOGLE_include_directive: enable

precision highp float;

// ---------------------------------------------------------------------
// Structs
// ---------------------------------------------------------------------

vec3 blendNormal(vec3, vec3, float);
float psrdnoise(vec3, vec3, float, out vec3);

struct Global {
  vec2 noiseFreq;
  float noiseSpeed;
};

struct VertDeform {
  vec2 noiseFreq;
  float noiseAmp;
  float noiseSpeed;
  float noiseFlow;
  float noiseSeed;
};

struct WaveLayers {
  vec3 color;
  vec2 noiseFreq;
  float noiseSpeed;
  float noiseFlow;
  float noiseSeed;
  float noiseFloor;
  float noiseCeil;
};

// ---------------------------------------------------------------------
// Uniforms
// ---------------------------------------------------------------------

// three.js
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// custom
uniform vec2 resolution;
uniform float u_time;
uniform vec3 u_baseColor;
uniform Global u_global;
uniform VertDeform u_vertDeform;
uniform WaveLayers u_waveLayers[4];
const int u_waveLayers_length = 4; // TODO: remove

// ---------------------------------------------------------------------
// Attributes
// ---------------------------------------------------------------------

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

// ---------------------------------------------------------------------
// Output variables
// ---------------------------------------------------------------------

varying vec3 color;

// ---------------------------------------------------------------------
// Includes
// ---------------------------------------------------------------------

#include "includes/blend.glsl"
#include "includes/noise.glsl"

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

  for (int i = 0; i < u_waveLayers_length; i++) {
    WaveLayers layer = u_waveLayers[i];

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
