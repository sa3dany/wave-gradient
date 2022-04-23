/**
 * @file Wave Gradients main class
 */

// ---------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------

import {
  createProgramInfo,
  createBufferInfoFromArrays,
  primitives,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js";

/**
 * Import the two shader stages: vertex and fragment. These are imported
 * using a custom bundler plugin to read these files as strings
 */
import vertexShader from "./shaders/noise.vert";
import fragmentShader from "./shaders/color.frag";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

/** @typedef {import("twgl.js").BufferInfo} BufferInfo */
/** @typedef {number} DOMHighResTimeStamp */

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
 * @default
 * @type {WaveGradientOptions}
 */
const DEFAULTS = {
  amplitude: 320,
  colors: [0xef008f, 0x6ec3f4, 0x7038ff, 0xffba27],
  density: [0.06, 0.16],
  fps: 24,
  seed: 0,
  speed: 1.25,
  time: 0,
  wireframe: false,
};

// ---------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------

/**
 * Converts HEX RGB colors to [R,G,B] array.
 *
 * @param {string} hexString HEX color string
 * @returns {Array<number>} RGB color array
 * @see
 * https://github.com/mrdoob/three.js/blob/77b84fd/src/math/Color.js
 */
function hexToArray(hexString) {
  const hex = hexString.slice(1);
  const size = hex.length;

  if (size === 3) {
    const r = parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255;
    const g = parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255;
    const b = parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255;
    return [r, g, b];
  } else if (size === 6) {
    const r = parseInt(hex.charAt(0) + hex.charAt(1), 16) / 255;
    const g = parseInt(hex.charAt(2) + hex.charAt(3), 16) / 255;
    const b = parseInt(hex.charAt(4) + hex.charAt(5), 16) / 255;
    return [r, g, b];
  }
}

/**
 * Mix default and provided options and return an object with the full
 * options set with default values for missing options.
 *
 * @param {object} options - Provided options
 * @returns {WaveGradientOptions} Wave gradients options
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
function getCanvas(input) {
  const element =
    typeof input === "string" ? document.querySelector(input) : input;
  if (!element || element.tagName !== "CANVAS") {
    throw new Error("invalid element query");
  }
  return element;
}

/**
 * Creates the plane geomtery for the gradients.
 *
 * @param {WebGL2RenderingContext} gl - WebGL2 context
 * @param {object} options Plane options
 * @param {number} options.width - Width of the plane
 * @param {number} options.depth - depth of the plane
 * @param {number[]} options.density - Level of detail of the plane geometry
 * @returns {BufferInfo} Plane geometry BufferInfo
 */
function createGeometry(gl, { width, depth, density }) {
  const { createPlaneVertices } = primitives;

  const gridX = Math.ceil(density[0] * width);
  const gridZ = Math.ceil(density[1] * depth);

  // This matrix is used to streth the plane to fit the entire Y
  // clipspace. Specifically the `1` in index 9 of the matrix
  const matrix = Float32Array.from([
    -1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, -1,
  ]);

  // const geometry = createPlaneBufferInfo(gl, 2, 2, gridX, gridZ, matrix);
  const geometry = createPlaneVertices(2, 2, gridX, gridZ, matrix);

  // TWGL primitive funcitons create uvs (called texcoords) scaled
  // between 0 & 1. Here we assign new uvs scaled between -1 & 1. This
  // is used in the vertex shader to fade the vertex deformation around
  // the edge of the plane
  const uvs = [];
  for (let z = 0; z <= gridZ; z++) {
    for (let x = 0; x <= gridX; x++) {
      uvs.push((x / gridX) * 2 - 1);
      uvs.push(1 - (z / gridZ) * 2);
    }
  }

  delete geometry.normal;
  geometry.texcoord = uvs;

  return createBufferInfoFromArrays(gl, geometry);
}

/**
 * Sets up the shader uniforms.
 *
 * @param {object} dependencies - data dependencies
 * @param {WaveGradientOptions} dependencies.config - gradient config
 * @param {number} dependencies.width - viewport width
 * @param {number} dependencies.height - viewport height
 * @returns {object} Shader uniforms object
 */
function createUniforms({ config, width, height }) {
  const { colors, seed, speed, time } = config;
  const waveLayers = colors.slice(1);

  /**
   * For reference, the original stripe gradient preset values were:
   *
   * time:                   1253106
   * shadow_power:           6 {canvas.y < 600 ? 5 : 6}
   * global.noiseSpeed:      5e-6
   * global.noiseFreq:      [14e-5, 29e-5]
   * vertDeform.noiseFreq:  [3, 4]
   * vertDeform.noiseSpeed:  10
   * vertDeform.noiseFlow:   3
   * vertDeform.noiseSeed:   5
   * vertDeform.noiseAmp:    320
   *
   * for (i = 1; i < sectionColors.length; i++):
   *   color:      sectionColors[i]
   *   noiseCeil:  0.63 + (0.07 * i),
   *   noiseFloor: 0.1,
   *   noiseFlow:  6.5 + (0.3 * i),
   *   noiseFreq: [2 + (i / sectionColors.length),
   *               3 + (i / sectionColors.length)]
   *   noiseSeed:  seed + (10 * i),
   *   noiseSpeed: 11 + (0.3 * i),
   */
  const uniforms = {
    u_BaseColor: hexToArray(colors[0]),
    u_Resolution: [width, height],
    u_Realtime: time,
    u_Amplitude: 320,
    u_Seed: seed,
    u_Speed: speed,
    u_ShadowPower: 6,
    u_WaveLayers: waveLayers.map((color, i) => ({
      color: hexToArray(color),
      isSet: true,
      noiseCeil: 0.63 + 0.07 * (i + 1),
      noiseFloor: 0.1,
      noiseFlow: 6.5 + 0.3 * (i + 1),
      noiseFreq: [2 + (i + 1) / colors.length, 3 + (i + 1) / colors.length],
      noiseSeed: seed + 10 * (i + 1),
      noiseSpeed: 11 + 0.3 * (i + 1),
    })),
  };

  /**
   * Pad the array with empty layers.
   * Refer to the commet in the vertex shader for more details.
   */
  while (uniforms.u_WaveLayers.length < 9) {
    uniforms.u_WaveLayers.push({
      color: [0, 0, 0],
      isSet: false,
      noiseCeil: 0,
      noiseFloor: 0,
      noiseFlow: 0,
      noiseFreq: [0, 0],
      noiseSeed: 0,
      noiseSpeed: 0,
    });
  }

  return uniforms;
}

/**
 * Renders a frame.
 *
 * @param {WaveGradient} gradient Wave gradient instance
 */
function render(gradient) {
  const { gl } = gradient;

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(gradient.programInfo.program);

  setBuffersAndAttributes(gl, gradient.programInfo, gradient.geometry);
  setUniforms(gradient.programInfo, gradient.uniforms);

  gl.drawElements(
    gradient.config.wireframe ? gl.LINES : gl.TRIANGLES,
    gradient.geometry.numElements,
    gl.UNSIGNED_SHORT,
    0
  );
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
  const timeIncrement = now - this.state.lastFrameTime;
  const shouldSkipFrame = now - this.state.lastFrameTime < frameTime;

  if (!shouldSkipFrame) {
    // Scale the time increment based on the speed set in config
    this.time += Math.min(timeIncrement, frameTime) * this.config.speed;
    this.state.lastFrameTime = now;
    this.uniforms["u_Realtime"] = this.time;
    render(this);
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

    /**
     * @private
     * @see https://mdn.io/Web/API/WebGLRenderingContext/getContextAttributes
     */
    this.gl = getCanvas(element).getContext("webgl2", {
      antialias: true,
      powerPreference: "low-power",
    });

    // Configure the rendering context
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.disable(this.gl.DITHER);

    // Set the size and viewport
    resizeCanvasToDisplaySize(this.gl.canvas);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);

    /** @private */
    this.programInfo = createProgramInfo(this.gl, [
      vertexShader,
      fragmentShader,
    ]);

    /** @private */
    this.geometry = createGeometry(this.gl, {
      width: this.gl.canvas.width,
      depth: this.gl.canvas.height,
      density: this.config.density,
    });

    /**
     * @private
     * @type {object}
     */
    this.uniforms = createUniforms({
      config: this.config,
      width: this.gl.canvas.width,
      height: this.gl.canvas.height,
    });

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
    requestAnimationFrame(() => {
      render(this);
    });
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
    resizeCanvasToDisplaySize(this.gl.canvas);
    const { width, height } = this.gl.canvas;

    this.gl.viewport(0, 0, width, height);
    this.uniforms["u_Resolution"] = [width, height];
    this.geometry = createGeometry(this.gl, {
      width: width,
      depth: height,
      density: this.config.density,
    });

    if (!this.state.playing) {
      // If paused, render a frame to refresh the canvas
      requestAnimationFrame(() => {
        render(this);
      });
    }

    return this;
  }
}
