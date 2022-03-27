/** @module srtipegradient */

import {
  BufferAttribute,
  Color,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  StaticReadUsage,
  WebGLRenderer,
} from "three";

import { getDeclarations } from "./glsl-declare";

import vertexShader from "./shader/vertex.glsl";
import fragmentShader from "./shader/fragment.glsl";

/**
 * Default options.
 * @constant
 * @type {Object}
 * @default
 */
const DEFAULTS = {
  amplitude: 320,
  colors: [0xef008f, 0x6ec3f4, 0x7038ff, 0xffba27],
  density: [0.06, 0.16],
  frequency: [0.00014, 0.00029],
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
 * Validates that an HTML canvas element or a css selector matching a
 * canvas element are provided.
 * @param {string|HTMLElement} input
 * @throws if no canvas element found
 * @returns {HTMLCanvasElement}
 */
function getContainer(input) {
  const element =
    typeof input === "string" ? document.querySelector(input) : input;
  if (!element || element.tagName !== "CANVAS") {
    throw new Error("invalid element query");
  }
  return element;
}

/**
 * Updates orthgraphic camera given a width, height.
 * @param {THREE.OrthographicCamera|undefined} camera
 * @param {number} width
 * @param {number} height
 * @param {number} near
 * @param {number} far
 * @returns {THREE.OrthographicCamera}
 */
function setCamera(camera, width, height, near = -1000, far = 1000) {
  const left = width / -2;
  const top = height / 2;
  if (camera === undefined) {
    camera = new OrthographicCamera(left, -left, top, -top, near, far);
  } else {
    camera.left = left;
    camera.right = -left;
    camera.top = top;
    camera.bottom = -top;
    camera.updateProjectionMatrix();
  }
  return camera;
}

/**
 * Creates a new three.js plane geometry instance
 * @param {number} width
 * @param {number} height
 * @param {number[]} density
 * @returns {THREE.PlaneGeometry} three.js plane geometry
 */
function setGeometry(width, height, density) {
  const wSegments = Math.ceil(density[0] * width);
  const hSegments = Math.ceil(density[1] * height);
  const geometry = new PlaneGeometry(width, height, wSegments, hSegments);

  const nVertices = (wSegments + 1) * (hSegments + 1);
  const uvNorm = new Float32Array(2 * nVertices);
  for (let y = 0; y <= hSegments; y++) {
    for (let x = 0; x <= wSegments; x++) {
      const vertex = y * (wSegments + 1) + x;
      uvNorm[2 * vertex] = (x / wSegments) * 2 - 1;
      uvNorm[2 * vertex + 1] = 1 - (y / hSegments) * 2;
    }
  }

  const uvNormAttribute = new BufferAttribute(uvNorm, 2);
  uvNormAttribute.name = "uvNorm";
  uvNormAttribute.setUsage(StaticReadUsage);
  geometry.setAttribute("uvNorm", uvNormAttribute);

  return geometry;
}

/**
 * Creates a three.js material with the given uniforms and the imported
 * vertex and fragment shaders. Also adds the required uniform
 * declarations to the start of the glsl shader file string.
 * @param {Object} uniforms
 * @param {boolean} wireframe
 * @returns {THREE.ShaderMaterial} three.js shader material
 */
function setMaterial(options = {}) {
  const wireframe = !!options.wireframe;
  const uniformDeclarations = getDeclarations(options.uniforms || {});
  const attributeDeclarations = getDeclarations(options.attributes || []);
  return new ShaderMaterial({
    wireframe,
    uniforms: options.uniforms,
    vertexShader: `${uniformDeclarations}\n${attributeDeclarations}\n${vertexShader}`,
    fragmentShader: `${uniformDeclarations}\n${fragmentShader}`,
  });
}

/**
 * Animates the gradient by adjusting the time value sent to the vertex
 * shader.
 * @param {DOMHighResTimeStamp} now
 * @this {WaveGradient}
 * @returns {void}
 */
function animate(now) {
  const shouldSkipFrame = now - this.state.lastFrameTime < 1000 / 24;

  if (!shouldSkipFrame) {
    this.state.lastFrameTime = now;
    this.time += Math.min(now - this.lastTime, 1e3 / 15);
    this.lastTime = now;
    this.uniforms["u_time"].value = this.time;
    render.call(this);
  }

  if (this.state.playing) requestAnimationFrame(animate.bind(this));
}

/**
 * Renders the three.js scene. Must be either bound to an instance
 * before calling, or call using Function.prototype.call().
 * @this {WaveGradient}
 * @returns {void}
 */
function render() {
  this.renderer.render(this.scene, this.camera);
}

/**
 * Class that recreates the https://stripe.com animated gradient.
 */
export default class WaveGradient {
  /**
   * Create a gradient instance. The element can be canvas HTML element
   * or a css query, in which case the first matching element will be
   * used.
   * @param {HTMLCanvasElement|string} element
   * @param {Object} options
   */
  constructor(element, options = {}) {
    /** @private */
    this.config = getOptions(options);

    /** @private */
    this.domElement = getContainer(element);

    /** @private */
    this.container = this.domElement.parentElement;
    const { clientWidth, scrollHeight } = this.container;

    /** @private */
    this.uniforms = {
      resolution: { value: new Float32Array([clientWidth, scrollHeight]) },
      u_time: { value: 0 },
      u_active_colors: { value: new Float32Array([1, 1, 1, 1]) },
      u_global: {
        value: {
          noiseFreq: new Float32Array(this.config.frequency),
          noiseSpeed: 0.000005,
        },
      },
      u_vertDeform: {
        value: {
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

    /** @private */
    this.camera = setCamera(this.camera, clientWidth, scrollHeight);

    /** @private */
    this.geometry = setGeometry(clientWidth, scrollHeight, this.config.density);

    /** @private */
    this.material = setMaterial({
      attributes: [this.geometry.getAttribute("uvNorm")],
      uniforms: this.uniforms,
      wireframe: this.config.wireframe,
    });

    /** @private */
    this.mesh = new Mesh(this.geometry, this.material);

    /** @private */
    this.scene = new Scene();
    this.scene.add(this.mesh);

    /** @private */
    this.renderer = new WebGLRenderer({
      canvas: this.domElement,
      antialias: true,
    });
    this.renderer.setSize(clientWidth, scrollHeight);
    this.renderer.setClearAlpha(0);

    this.time = 0;

    /** @private */
    this.lastTime = 0;

    /** @private */
    this.state = {
      playing: false,
      lastFrameTime: -Infinity,
    };
  }

  /**
   * Start animating the gradient.
   * @returns {WaveGradient} self for chaining
   */
  play() {
    if (!this.state.playing) {
      this.state.playing = true;
      requestAnimationFrame(animate.bind(this));
    }
    return this;
  }

  /**
   * Should be called if the contaning DOM node changes size to update
   * the canvas, camera & geometry to the new size.
   * @returns {WaveGradient} self for chaining
   */
  resize() {
    const { clientWidth, scrollHeight } = this.container;

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

    return this;
  }

  /**
   * Cleanup any three.js resources, DOM nodes used by the gradient.
   * @returns {WaveGradient} self for chaining
   */
  dispose() {
    this.scene.clear();
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    this.state.playing = false;
    return this;
  }
}
