#pragma glslify: blendNormal = require("glsl-blend/normal")
#pragma glslify: psrdnoise = require("glsl-psrdnoise/dist/3d")

varying vec3 color;

void main() {
  float time = u_time * u_global.noiseSpeed;
  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;

  // -------------------------------------------------------------------
  // Vertex noise
  // -------------------------------------------------------------------

  // Tilt the plane towards the camera
  float tilt = resolution.y / 2.0 * uvNorm.y;

  vec3 g;
  float noise = psrdnoise(
    vec3(
      noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
      noiseCoord.y * u_vertDeform.noiseFreq.y,
      time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed
    ),
    vec3(0.0),
    0.0, g
  ) * u_vertDeform.noiseAmp;

  // Fade noise to zero at edges
  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);

  // Clamp to 0
  noise = max(0.0, noise);

  vec3 pos = vec3(
    position.x,
    position.y + noise + tilt,
    position.z
  );

  // -------------------------------------------------------------------
  // Vertex color, to be passed to fragment shader
  // -------------------------------------------------------------------

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
            time * layer.noiseSpeed + layer.noiseSeed
          ),
          vec3(0.0),
          layer.noiseSpeed, g
        ) / 2.0 + 0.5
      );

    color = blendNormal(color, layer.color, pow(noise, 4.0));
  }

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
