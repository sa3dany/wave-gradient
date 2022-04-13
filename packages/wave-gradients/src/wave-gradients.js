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
  frequency: [0.00014, 0.00029],
  seed: 5,
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
 * @param {OrthographicCamera|undefined} camera - Camera to update
 * @param {number} width - Width of the viewport
 * @param {number} height - Height of the viewport
 * @param {number} near - Near plane
 * @param {number} far - Far plane
 * @returns {OrthographicCamera} Updated camera
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
    this.uniforms["u_time"].value = this.time;
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
    /** @private */
    this.config = getOptions(options);

    /** @private */
    this.domElement = getContainer(element);

    /** @private */
    this.container = this.domElement.parentElement;

    /** @private */
    this.uniforms = {
      resolution: { value: new Float32Array([this.width, this..height]) },
      u_time: { value: this.config.time },
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
        value: this.config.colors.slice(1).map((c, i, a) => ({
          isSet: true,
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

    while (this.uniforms["u_waveLayers"].value.length < 10) {
      this.uniforms["u_waveLayers"].value.push({
        isSet: false,
        color: new Color(0),
        noiseFreq: new Float32Array([0, 0]),
        noiseSpeed: 0,
        noiseFlow: 0,
        noiseSeed: 0,
        noiseFloor: 0,
        noiseCeil: 0,
      });
    }

    this.camera = setCamera(this.camera, this.width, this.height);

    /** @private */
    this.geometry = setGeometry(this.width, this.height, this.config.density);

    /** @private */

    /** @private */
    this.material = setMaterial({ uniforms: this.uniforms });

    /** @private */
    this.mesh = setMesh(this.geometry, this.material, {
      wireframe: this.config.wireframe,
    });

    /** @private */
    this.scene = new Scene();
    this.scene.add(this.mesh);

    /** @private */
    this.renderer = new WebGLRenderer({
      canvas: this.domElement,
      antialias: true,
    });
    this.renderer.setSize(this.width, this.height);
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

    setCamera(this.camera, this.width, this.height);
    this.renderer.setSize(this.width, this.height);
    updateUniform(
      this.uniforms,
      "canvas",
      new Float32Array([this.width, this.height])
    );

    if (!this.state.playing) {
      // If the gradient is paused, render a frame on resize anyway to
      // refresh the canvas
      this.renderer.render(this.scene, this.camera);
    }

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
