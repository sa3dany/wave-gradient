import {
  BufferAttribute,
  Color,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGL1Renderer,
} from "three";

import vertexShader from "./vendor/shaders/vertex";
import fragmentShader from "./vendor/shaders/fragment";

/**
 * Default options
 * @constant
 */
const DEFAULTS = {
  amplitude: 320,
  angle: 0,
  colors: [0xef008f, 0x6ec3f4, 0x7038ff, 0xffba27],
  density: [0.06, 0.16],
  frequency: [14e-5, 29e-5],
  seed: 5,
  wireframe: false,
};

/**
 * Mix default and provided options and return an object with the full
 * options set with default values for missing options.
 * @param {Object} options
 * @returns {Object} Full options object
 */
function getOptions(options) {
  const allOptions = { ...DEFAULTS };
  if (!options) {
    return allOptions;
  }
  for (const [option] of Object.entries(DEFAULTS)) {
    if (options[option] !== undefined) allOptions[option] = options[[option]];
  }
  return allOptions;
}

/**
 * Validates that an element or a css selector is provided
 * element
 * @param {string|HTMLElement} input
 * @returns {HTMLElement}
 */
function getContainer(input) {
  const element =
    typeof input === "string" ? document.querySelector(input) : input;
  if (!element) {
    throw new Error("invalid element query");
  }
  return element;
}

/**
 * Updates orthgraphic camera given a width, height.
 * @param {*} camera
 * @param {*} width
 * @param {*} height
 * @param {*} near
 * @param {*} far
 * @returns
 */
function setCamera(camera, width, height, near = -1000, far = 1000) {
  const left = width / -2;
  const top = height / 2;
  if (camera === undefined) {
    camera = new OrthographicCamera(left, -left, top, -top, near, far);
    // camera.rotateY(Math.PI);
    // camera.rotateZ(Math.PI);
  } else {
    camera.left = left;
    camera.right = -left;
    camera.top = top;
    camera.bottom = -top;
    camera.near = near;
    camera.far = far;
    camera.updateProjectionMatrix();
  }
  return camera;
}

/**
 * Creates a new three.js plane geometry instance
 * @param {*} width
 * @param {*} height
 * @param {*} density
 * @returns
 */
function setGeometry(width, height, density) {
  const wSegments = Math.ceil(density[0] * width);
  const hSegments = Math.ceil(density[1] * height);
  const geometry = new PlaneGeometry(width, height, wSegments, hSegments);

  const nVertices = (wSegments + 1) * (hSegments + 1);
  const uvNorm = new Float32Array(2 * nVertices);
  for (const y = 0; y <= hSegments; y++) {
    for (const x = 0; x <= wSegments; x++) {
      const vertix = y * (wSegments + 1) + x;
      uvNorm[2 * vertix] = (x / wSegments) * 2 - 1;
      uvNorm[2 * vertix + 1] = 1 - (y / hSegments) * 2;
    }
  }
  geometry.setAttribute("uvNorm", new BufferAttribute(uvNorm, 2));

  return geometry;
}

function setMaterial(uniforms = {}, wireframe = false) {
  return new ShaderMaterial({
    wireframe,
    uniforms,

    vertexShader: `
struct Global {
  vec2 noiseFreq;
  float noiseSpeed;
};

struct VertDeform {
  float incline;
  float offsetTop;
  float offsetBottom;
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

const int u_waveLayers_length = 3; // TODO: Fix this

uniform float u_time;
uniform Global u_global;
uniform vec2 resolution;
uniform VertDeform u_vertDeform;
uniform vec4 u_active_colors;
uniform vec3 u_baseColor;
uniform WaveLayers u_waveLayers[u_waveLayers_length];

attribute vec2 uvNorm;

${vertexShader}`,

    fragmentShader: `
uniform float u_darken_top;
uniform vec2 resolution;
uniform float u_shadow_power;

${fragmentShader}`,
  });
}

/**
 * Renders the three.js scene. Must be either bound to an instance
 * before calling, or call using Function.prototype.call().
 */
function render() {
  this.renderer.render(this.scene, this.camera);
}

/**
 * Class that recreates the https://strip.com animated gradient.
 * @class
 */
export class StripeGradient {
  constructor(element, options = {}) {
    this.config = getOptions(options);

    this.domElement = getContainer(element);
    const { clientWidth, scrollHeight } = this.domElement;

    this.uniforms = {
      resolution: { value: new Float32Array([clientWidth, scrollHeight]) },
      u_time: { value: 0 },
      u_shadow_power: { value: 5 },
      u_darken_top: { value: 0 },
      u_active_colors: { value: new Float32Array([1, 1, 1, 1]) },
      u_global: {
        value: {
          noiseFreq: new Float32Array(this.config.frequency),
          noiseSpeed: 5e-6,
        },
      },
      u_vertDeform: {
        value: {
          incline: Math.sin(this.config.angle) / Math.cos(this.config.angle),
          offsetTop: -0.5,
          offsetBottom: -0.5,
          noiseFreq: new Float32Array([3, 4]),
          noiseAmp: this.config.amplitude,
          noiseSpeed: 10,
          noiseFlow: 3,
          noiseSeed: this.config.seed,
        },
      },
      u_baseColor: { value: new Color(this.config.colors[0]) },
      u_waveLayers: {
        value: this.config.colors.slice(1).map((c, i) => ({
          color: new Color(c),
          noiseFreq: new Float32Array([
            3 + i / this.config.colors.length,
            4 + i / this.config.colors.length,
          ]),
          noiseSpeed: 11 + 0.3 * (i + 1),
          noiseFlow: 6.5 + 0.3 * (i + 1),
          noiseSeed: this.config.seed + 10 * (i + 1),
          noiseFloor: 0.1,
          noiseCeil: 0.63 + 0.07 * (i + 1),
        })),
      },
    };

    this.camera = setCamera(this.camera, clientWidth, scrollHeight);
    this.geometry = setGeometry(clientWidth, scrollHeight, this.config.density);
    this.material = setMaterial(this.uniforms, this.config.wireframe);
    this.mesh = new Mesh(this.geometry, this.material);
    this.scene = new Scene();
    this.scene.add(this.mesh);
    this.renderer = new WebGL1Renderer({ antialias: true });
    this.renderer.setSize(clientWidth, scrollHeight);
    this.domElement.appendChild(this.renderer.domElement);

    this.time = 1253106;
    this.lastTime = 0;

    this.state = {
      playing: false,
    };
  }

  animate(now) {
    requestAnimationFrame(this.animate.bind(this));
    const shouldSkipFrame = parseInt(now, 10) % 2 === 0;
    if (!shouldSkipFrame) {
      this.time += Math.min(now - this.lastTime, 1e3 / 15);
      this.lastTime = now;
      this.uniforms["u_time"].value = this.time;
      render.call(this);
    }
  }

  /**
   * Start animating the gradient.
   */
  play() {
    if (!this.state.playing) {
      this.state.playing = true;
      requestAnimationFrame(this.animate.bind(this));
    }
  }

  /**
   * Should be called if the contaning DOM node changes size to update
   * the canvas size to match as well as the geometry and camera, etc..
   */
  resize() {
    const { clientWidth, scrollHeight } = this.domElement;

    this.geometry.dispose();
    this.geometry = setGeometry(clientWidth, scrollHeight, this.config.density);

    const oldMesh = this.mesh;
    this.mesh = new Mesh(this.geometry, this.material);
    this.scene.remove(oldMesh);
    this.scene.add(this.mesh);

    setCamera(this.camera, clientWidth, scrollHeight);
    this.renderer.setSize(clientWidth, scrollHeight);
    this.uniforms.resolution.value = new Float32Array([
      clientWidth,
      scrollHeight,
    ]);
  }

  /**
   * Cleanup any resources, DOM nodes used by the gradient.
   */
  dispose() {
    this.scene.clear();
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    this.domElement.removeChild(this.renderer.domElement);
  }
}
