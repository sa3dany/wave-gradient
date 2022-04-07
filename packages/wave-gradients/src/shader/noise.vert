precision highp float;

// ---------------------------------------------------------------------
// Headers & Structs
// ---------------------------------------------------------------------

vec4 permute(vec4 i);
vec3 blendNormal(vec3, vec3);
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
uniform WaveLayers u_waveLayers[3];
const int u_waveLayers_length = 3; // TODO: remove

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

  vec3 pos = vec3(position.x, position.y + noise + tilt, position.z);

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

// ---------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------

// glsl-blend 1.0.3 (c) Jamie Owen
// Published under the MIT license
// https://github.com/jamieowen/glsl-blend

vec3 blendNormal(vec3 base, vec3 blend) {
  return blend;
}

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
  return (blendNormal(base, blend) * opacity + base * (1.0 - opacity));
}

// psrdnoise 2021-12-02 (c) Stefan Gustavson and Ian McEwan
// Published under the MIT license
// https://github.com/stegu/psrdnoise

vec4 permute(vec4 i) {
  vec4 im = mod(i, 289.0);
  return mod(((im * 34.0) + 10.0) * im, 289.0);
}

float psrdnoise(vec3 x, vec3 period, float alpha, out vec3 gradient) {
  const mat3 M = mat3(0.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 0.0);
  const mat3 Mi = mat3(-0.5, 0.5, 0.5, 0.5, -0.5, 0.5, 0.5, 0.5, -0.5);
  vec3 uvw = M * x;
  vec3 i0 = floor(uvw), f0 = fract(uvw);
  vec3 g_ = step(f0.xyx, f0.yzz), l_ = 1.0 - g_;
  vec3 g = vec3(l_.z, g_.xy), l = vec3(l_.xy, g_.z);
  vec3 o1 = min(g, l), o2 = max(g, l);
  vec3 i1 = i0 + o1, i2 = i0 + o2, i3 = i0 + vec3(1.0);
  vec3 v0 = Mi * i0, v1 = Mi * i1, v2 = Mi * i2, v3 = Mi * i3;
  vec3 x0 = x - v0, x1 = x - v1, x2 = x - v2, x3 = x - v3;
  if (any(greaterThan(period, vec3(0.0)))) {
    vec4 vx = vec4(v0.x, v1.x, v2.x, v3.x);
    vec4 vy = vec4(v0.y, v1.y, v2.y, v3.y);
    vec4 vz = vec4(v0.z, v1.z, v2.z, v3.z);
    if (period.x > 0.0)
      vx = mod(vx, period.x);
    if (period.y > 0.0)
      vy = mod(vy, period.y);
    if (period.z > 0.0)
      vz = mod(vz, period.z);
    i0 = floor(M * vec3(vx.x, vy.x, vz.x) + 0.5);
    i1 = floor(M * vec3(vx.y, vy.y, vz.y) + 0.5);
    i2 = floor(M * vec3(vx.z, vy.z, vz.z) + 0.5);
    i3 = floor(M * vec3(vx.w, vy.w, vz.w) + 0.5);
  }
  vec4 hash = permute(permute(permute(vec4(i0.z, i1.z, i2.z, i3.z)) + vec4(i0.y, i1.y, i2.y, i3.y)) + vec4(i0.x, i1.x, i2.x, i3.x));
  vec4 theta = hash * 3.883222077;
  vec4 sz = hash * -0.006920415 + 0.996539792;
  vec4 psi = hash * 0.108705628;
  vec4 Ct = cos(theta), St = sin(theta);
  vec4 sz_prime = sqrt(1.0 - sz * sz);
  vec4 gx, gy, gz;
  if (alpha != 0.0) {
    vec4 px = Ct * sz_prime, py = St * sz_prime, pz = sz;
    vec4 Sp = sin(psi), Cp = cos(psi), Ctp = St * Sp - Ct * Cp;
    vec4 qx = mix(Ctp * St, Sp, sz), qy = mix(-Ctp * Ct, Cp, sz);
    vec4 qz = -(py * Cp + px * Sp);
    vec4 Sa = vec4(sin(alpha)), Ca = vec4(cos(alpha));
    gx = Ca * px + Sa * qx;
    gy = Ca * py + Sa * qy;
    gz = Ca * pz + Sa * qz;
  } else {
    gx = Ct * sz_prime;
    gy = St * sz_prime;
    gz = sz;
  }
  vec3 g0 = vec3(gx.x, gy.x, gz.x), g1 = vec3(gx.y, gy.y, gz.y);
  vec3 g2 = vec3(gx.z, gy.z, gz.z), g3 = vec3(gx.w, gy.w, gz.w);
  vec4 w = 0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3));
  w = max(w, 0.0);
  vec4 w2 = w * w, w3 = w2 * w;
  vec4 gdotx = vec4(dot(g0, x0), dot(g1, x1), dot(g2, x2), dot(g3, x3));
  float n = dot(w3, gdotx);
  vec4 dw = -6.0 * w2 * gdotx;
  vec3 dn0 = w3.x * g0 + dw.x * x0;
  vec3 dn1 = w3.y * g1 + dw.y * x1;
  vec3 dn2 = w3.z * g2 + dw.z * x2;
  vec3 dn3 = w3.w * g3 + dw.w * x3;
  gradient = 39.5 * (dn0 + dn1 + dn2 + dn3);
  return 39.5 * n;
}