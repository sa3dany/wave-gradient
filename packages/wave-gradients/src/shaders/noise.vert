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
// Uniforms
// ---------------------------------------------------------------------

// three.js
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

// custom
uniform vec2 canvas;
uniform float realtime;
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

// Wrapper around the psrdnoise function to avoid passing in the unused
// parameters
float getNoise(vec3 position, float alpha) {
  vec3 gradient;
  vec3 period = vec3(0.0);
  return psrdnoise(position, period, alpha, gradient);
}

// ---------------------------------------------------------------------
// Output variables -> fragment shader stage
// ---------------------------------------------------------------------

varying vec3 color;

// ---------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------

// For reference, the original values from stripe's shader:
// - Global
//     Freq: [0.00014, 0.00029] | Speed: 4e-6
// - Deforms
//     Freq: [3, 4] | Amp: 320 | Speed: 10 | Flow: 3

void main() {

  // scale down realtime to a resonable value for animating the noise
  float time = (realtime / 10e3) * speed;

  // Choose an amplitude based on the canvas height but with limits
  float amplitude = min(canvas.y * 0.66, 250.0);

  // Scale the vertical frequency to the canvas height, while the
  // horizontal frequency is based on a minimum canvas size of 375px
  // (iPhone SE)
  vec2 frequency = vec2(
    0.4 / 375.0,
    3.0 / canvas.y
  );

  float noise = getNoise(
    vec3(
      position.x * frequency.x + time,
      position.y + time,
      position.z * frequency.y + time + seed),
    time * 2.0
  ) * amplitude;
  noise = clampNoise(noise, uv);
  noise += orthographicTilt(uv, canvas);
  vec3 newPosition = position + (normal * noise);

  // Calculate the color of the vertex
  vec2 noiseCoord = canvas * uv * vec2(0.00014, 0.00029);
  float colorTime = realtime * 4e-6;
  color = baseColor;
  for (int i = 0; i < MAX_COLOR_LAYERS; i++) {
    // Break from loop on the first undefinde wave layer
    if (!waveLayers[i].isSet) {
      break;
    }
    WaveLayers layer = waveLayers[i];
    float noise = smoothstep(
      layer.noiseFloor,
      layer.noiseCeil,
      getNoise(
        vec3(
          noiseCoord.x * layer.noiseFreq.x + colorTime * layer.noiseFlow,
          noiseCoord.y * layer.noiseFreq.y,
          colorTime * layer.noiseSpeed + layer.noiseSeed),
        colorTime * layer.noiseFlow
      ) / 2.0 + 0.5);
    color = blendNormal(color, layer.color, pow(noise, 4.0));
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
