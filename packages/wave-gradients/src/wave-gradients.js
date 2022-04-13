/**
 * @file Wave Gradients main class
 * @author Mohamed ElSaadany
 * @module wave-gradients
 */

// ---------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------

import {
  Color,
  Float32BufferAttribute,
  LineSegments,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  RawShaderMaterial,
  Scene,
  WebGLRenderer,
} from "three";

/**
 * Import the two shader stages: vertex and fragment. These are imported
 * using a custom rollup plugin to read these files as strings
 */
import vertexShader from "./shaders/noise.vert";
import fragmentShader from "./shaders/color.frag";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

/**
 * @typedef {number} DOMHighResTimeStamp
 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMHighResTimeStamp
 */

/**
 * WaveGradient options.
 *
 * @typedef {object} WaveGradientOptions
 * @property {number} amplitude - Amplitude of the wave.
 * @property {Array<number>} colors - Array of colors to use for the.
 *   gradient. Limited to 10 colors.
 * @property {Array<number>} density - Level of detail of the plane
 *   gemotery in the x & z directions.
 * @property {number} fps - animation FPS.
 * @property {number} seed - Seed for the noise function.
 * @property {number} speed - Speed of the waves.
 * @property {number} time - Time of the animation.
 * @property {boolean} wireframe - Wireframe rendering mode.
 */

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

/**
 * Default options.
 *
 * @constant
 * @default
 * @type {WaveGradientOptions}
 */
const DEFAULTS = {
  amplitude: 320,
  colors: [0xef008f, 0x6ec3f4, 0x7038ff, 0xffba27],
  density: [0.06, 0.16],
  fps: 24,
  seed: 0,
  speed: 0.2,
  time: 0,
  wireframe: false,
};

// ---------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------

/**
 * Mix default and provided options and return an object with the full
 * options set with default values for missing options.
 *
 * @param {object} options - Provided options
 * @returns {object} Full options object
 */
function getOptions(options) {
  const allOptions = { ...DEFAULTS };
  if (!options) {
    return allOptions;
  }
  for (const [option] of Object.entries(DEFAULTS)) {
    if (options[option] !== undefined) {
      allOptions[option] = options[[option]];
    }
  }
  return allOptions;
}

/**
 * Validates that an HTML canvas element or a css selector matching a
 * canvas element are provided.
 *
 * @param {string|HTMLElement} input - Canvas element or selector
 * @throws if no canvas element found
 * @returns {HTMLCanvasElement} Canvas element
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
 *
 * @param {number} width - Width of the viewport
 * @param {number} height - Height of the viewport
 * @param {number} near - Near plane
 * @param {number} far - Far plane
 * @returns {OrthographicCamera} Camera
 */
function setCamera(width, height, near = -1000, far = 1000) {
  const left = width / -2;
  const top = height / 2;
  return new OrthographicCamera(left, -left, top, -top, near, far);
}

/**
 * Creates a new three.js plane geometry instance
 *
 * @param {number} width - Width of the plane
 * @param {number} height - Height of the plane
 * @param {number[]} density - Level of detail of the plane geometry
 * @returns {PlaneGeometry} three.js plane geometry
 */
function setGeometry(width, height, density) {
  const gridX = Math.ceil(density[0] * width);
  const gridY = Math.ceil(density[1] * height);
  const geometry = new PlaneGeometry(width, height, gridX, gridY);

  // Rotate to be flat across the z axis (to match strip's plane) In the
  // vertex shader the plane is titlted in a way that fills the entire
  // viewport
  geometry.rotateX(-90 * (Math.PI / 180));

  // Three.js creates uvs scaled between [0,1]. Here we assign new uvs
  // scaled between [-1,1]. This is used in the verte shader to fade the
  // vertex deformation around the edge of the plane
  const uvs = [];
  for (let iy = 0; iy <= gridY; iy++) {
    for (let ix = 0; ix <= gridX; ix++) {
      uvs.push((ix / gridX) * 2 - 1);
      uvs.push(1 - (iy / gridY) * 2);
    }
  }

  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  return geometry;
}

/**
 * Sets up the shader uniforms.
 *
 * @param {object} root0 - data dependencies
 * @param {WaveGradientOptions} root0.config - gradient config
 * @param {number} root0.width - viewport width
 * @param {number} root0.height - viewport height
 * @returns {object} Shader uniforms object
 */
function setUniforms({ config, width, height }) {
  const f32 = (array) => new Float32Array(array);

  const { colors, seed, speed, time } = config;

  const uniforms = {
    baseColor: new Color(colors[0]),
    canvas: f32([width, height]),
    realtime: time,
    seed: seed,
    speed: speed,
    waveLayers: config.colors.slice(1).map((color, i, colors) => ({
      isSet: true,
      color: new Color(color),
      noiseFreq: f32([3 + i / colors.length, 4 + i / colors.length]),
      noiseSpeed: 11 + 0.3 * (i + 1),
      noiseFlow: 6.5 + 0.3 * (i + 1),
      noiseSeed: seed + 10 * (i + 1),
      noiseFloor: 0.1,
      noiseCeil: 0.53 + (0.26 / colors.length) * (i + 1),
    })),
  };

  /**
   * Pad the array with empty layers.
   * Refer to the commet in the vertex shader for more details.
   */
  while (uniforms.waveLayers.length < 10) {
    uniforms.waveLayers.push({
      isSet: false,
      color: f32([0, 0, 0]),
      noiseFreq: new Float32Array([0, 0]),
      noiseSpeed: 0,
      noiseFlow: 0,
      noiseSeed: 0,
      noiseFloor: 0,
      noiseCeil: 0,
    });
  }

  // Convert to three.js expected format
  for (const [name, value] of Object.entries(uniforms)) {
    uniforms[name] = { value };
  }

  return uniforms;
}

/**
 * Creates a three.js material with the given uniforms and the imported
 * vertex and fragment shaders.
 *
 * @param {object} options - material options
 * @returns {RawShaderMaterial} three.js shader material
 */
function setMaterial(options = {}) {
  return new RawShaderMaterial({
    uniforms: options.uniforms,
    vertexShader,
    fragmentShader,
  });
}

/**
 * Creates a mesh with the given geometry and material.
 *
 * @param {PlaneGeometry} geometry - three.js geometry
 * @param {RawShaderMaterial} material - three.js material
 * @param {object} options - mesh options
 * @param {number} options.wireframe - wireframe rendering
 * @returns {LineSegments|Mesh} Mesh or LineSegments
 */
function setMesh(geometry, material, options = {}) {
  return options.wireframe
    ? new LineSegments(geometry, material)
    : new Mesh(geometry, material);
}

/**
 * Animates the gradient by adjusting the time value sent to the vertex
 * shader.
 *
 * @param {DOMHighResTimeStamp} now - Current frame timestamp
 * @this {WaveGradient}
 * @returns {void}
 */
function animate(now) {
  const frameTime = 1000 / this.config.fps;
  const shouldSkipFrame = now - this.state.lastFrameTime < frameTime;

  if (!shouldSkipFrame) {
    this.time += Math.min(now - this.state.lastFrameTime, frameTime);
    this.state.lastFrameTime = now;
    this.uniforms.realtime.value = this.time;
    this.renderer.render(this.scene, this.camera);
  }

  if (this.state.playing) {
    requestAnimationFrame(animate.bind(this));
  }
}

/**
 * Class that recreates the https://stripe.com animated gradient.
 */
export class WaveGradient {
  /**
   * Create a gradient instance. The element can be canvas HTML element
   * or a css query, in which case the first matching element will be
   * used.
   *
   * @param {HTMLCanvasElement|string} element - canvas element or css query
   * @param {WaveGradientOptions} options - gradient options
   */
  constructor(element, options = {}) {
    /**
     * @private
     * @type {WaveGradientOptions}
     */
    this.config = getOptions(options);

    /**
     * @private
     * @type {HTMLCanvasElement}
     */
    this.domElement = getContainer(element);

    /**
     * @private
     * @type {HTMLElement}
     */
    this.container = this.domElement.parentElement;

    /**
     * @private
     * @type {OrthographicCamera}
     */
    this.camera = setCamera(this.width, this.height);

    /**
     * @private
     * @type {PlaneGeometry}
     */
    this.geometry = setGeometry(this.width, this.height, this.config.density);

    /**
     * @private
     * @type {object}
     */
    this.uniforms = setUniforms({
      config: this.config,
      width: this.width,
      height: this.height,
    });

    /**
     * @private
     * @type {RawShaderMaterial}
     */
    this.material = setMaterial({ uniforms: this.uniforms });

    /**
     * @private
     * @type {LineSegments|Mesh}
     */
    this.mesh = setMesh(this.geometry, this.material, {
      wireframe: this.config.wireframe,
    });

    /**
     * @private
     * @type {Scene}
     */
    this.scene = new Scene();
    this.scene.add(this.mesh);

    /**
     * @private
     * @type {WebGLRenderer}
     */
    this.renderer = new WebGLRenderer({
      antialias: true,
      canvas: this.domElement,
      powerPreference: "low-power",
      stencil: false,
    });

    this.renderer.setSize(this.width, this.height, false);
    this.renderer.setClearAlpha(0);

    /** @private */
    this.state = { playing: false, lastFrameTime: -Infinity };

    /**
     * The time the animation has been running in milliseconds. Can be
     * set while the animation is running to seek to a specific point in
     * the animation.
     *
     * @public
     * @type {number}
     */
    this.time = this.config.time;

    // Render one frame on init
    requestAnimationFrame(animate.bind(this));
  }

  /**
   * The containing element's width.
   *
   * @private
   * @type {number}
   */
  get width() {
    return this.container.clientWidth;
  }

  /**
   * The containing element's height.
   *
   * @private
   * @type {number}
   */
  get height() {
    return this.container.clientHeight;
  }

  /**
   * Start animating the gradient.
   *
   * @returns {this} self for chaining
   */
  play() {
    if (!this.state.playing) {
      this.state.playing = true;
      requestAnimationFrame(animate.bind(this));
    }
    return this;
  }

  /**
   * Stop animating the gradient.
   *
   * @returns {this} self for chaining
   */
  pause() {
    if (this.state.playing) {
      this.state.playing = false;
    }
    return this;
  }

  /**
   * Should be called if the contaning DOM node changes size to update
   * the canvas, camera & geometry to the new size.
   *
   * @returns {this} self for chaining
   */
  resize() {
    this.geometry.dispose();
    this.geometry = setGeometry(this.width, this.height, this.config.density);

    this.scene.remove(this.mesh);
    this.mesh = setMesh(this.geometry, this.material, {
      wireframe: this.config.wireframe,
    });
    this.scene.add(this.mesh);

    this.camera = setCamera(this.width, this.height);
    this.renderer.setSize(this.width, this.height, false);
    this.uniforms.canvas.value = new Float32Array([this.width, this.height]);

    requestAnimationFrame(() => {
      if (!this.state.playing) {
        // If the gradient is paused, render a frame on resize anyway to
        // refresh the canvas
        this.renderer.render(this.scene, this.camera);
      }
    });

    return this;
  }

  /**
   * Cleanup any three.js resources, DOM nodes used by the gradient.
   *
   * @returns {this} self for chaining
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
