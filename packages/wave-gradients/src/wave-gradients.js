// @ts-check

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
// @ts-ignore
import vertexShader from "./shaders/noise.vert";
// @ts-ignore
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
 * @property {Array<string>} colors - Array of colors to use for the.
 *   gradient. Limited to 10 colors.
 * @property {Array<number>} density - Level of detail of the plane
 *   gemotery in the x & z directions.
 * @property {number} fps - animation FPS.
 * @property {Function} onLoad - Callback to call when the gradient has
 *   loaded
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
  colors: ["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"],
  density: [0.06, 0.16],
  fps: 21,
  onLoad: () => {},
  seed: 0,
  speed: 1.25,
  time: 0,
  wireframe: false,
};

// ---------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------

/**
 * Converts HEX RGB colors to [R,G,B] array. From three.js source.
 *
 * @param {string} hexString HEX color string
 * @returns {Array<number>} RGB color array
 */
function hexToArray(hexString) {
  const hex = hexString.slice(1);
  if (hex.length === 3) {
    const r = parseInt(hex.charAt(0) + hex.charAt(0), 16) / 255;
    const g = parseInt(hex.charAt(1) + hex.charAt(1), 16) / 255;
    const b = parseInt(hex.charAt(2) + hex.charAt(2), 16) / 255;
    return [r, g, b];
  } else if (hex.length === 6) {
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
      const optionValue = options[option];
      switch (option) {
        case "colors":
          if (
            !Array.isArray(optionValue) ||
            optionValue.length > 10 ||
            optionValue.length < 1 ||
            optionValue.some((color) => typeof color !== "string")
          ) {
            throw new Error(
              `Invalid colors option. Must be an array of strings with a max length of 10.`
            );
          }
      }

      allOptions[option] = options[option];
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
  if (!element || !(element instanceof HTMLCanvasElement)) {
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
    u_WaveLayers: new Array(9),
  };

  /**
   * Pad the array with empty layers.
   * Refer to the commet in the vertex shader for more details.
   */
  for (let i = 1; i < 9; i++) {
    if (colors[i]) {
      uniforms.u_WaveLayers[i - 1] = {
        color: hexToArray(colors[i]),
        isSet: true,
        noiseCeil: 0.63 + 0.07 * i,
        noiseFloor: 0.1,
        noiseFlow: 6.5 + 0.3 * i,
        noiseFreq: [2 + i / colors.length, 3 + i / colors.length],
        noiseSeed: seed + 10 * i,
        noiseSpeed: 11 + 0.3 * i,
      };
    } else {
      uniforms.u_WaveLayers[i - 1] = {
        color: [0, 0, 0],
        isSet: false,
        noiseCeil: 0,
        noiseFloor: 0,
        noiseFlow: 0,
        noiseFreq: [0, 0],
        noiseSeed: 0,
        noiseSpeed: 0,
      };
    }
  }

  return Object.preventExtensions(uniforms);
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
  constructor(element, options = DEFAULTS) {
    /*
      Internals
      --------- */

    /** @private */
    this.config = getOptions(options);

    /** @private */
    this.frameDuration = 1000 / this.config.fps;

    /** @private */
    this.gl = getCanvas(element).getContext("webgl2", {
      antialias: true,
      powerPreference: "low-power",
    });

    // Configure the rendering context
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.disable(this.gl.DITHER);

    /** @private */
    this.programInfo = createProgramInfo(this.gl, [
      vertexShader,
      fragmentShader,
    ]);

    /** @private */
    this.geometry = createGeometry(this.gl, {
      width: this.gl.canvas.clientWidth,
      depth: this.gl.canvas.clientHeight,
      density: this.config.density,
    });

    /** @private */
    this.uniforms = createUniforms({
      config: this.config,
      width: this.gl.canvas.clientWidth,
      height: this.gl.canvas.clientHeight,
    });

    /** @private */
    this.lastFrameTime = -Infinity;

    /** @private */
    this.paused = false;

    /*
      Start animating
      --------------- */

    requestAnimationFrame((now) => {
      this.render(now);
      this.config.onLoad();
    });

    /*
      Public API
      ---------- */

    /**
     * The time the animation has been running in milliseconds. Can be
     * set while the animation is running to seek to a specific point in
     * the animation.
     *
     * @public
     * @type {number}
     */
    this.time = this.config.time;
  }

  /**
   * Renders a frame.
   *
   * @private
   * @param {DOMHighResTimeStamp} now - Current frame timestamp
   */
  render(now) {
    if (!this.paused) {
      requestAnimationFrame((now) => {
        this.render(now);
      });
    }

    const timeDelta = now - this.lastFrameTime;
    const shouldSkipFrame = timeDelta < this.frameDuration;

    if (!shouldSkipFrame) {
      this.lastFrameTime = now;

      // Update the `time` uniform
      this.time += Math.min(timeDelta, this.frameDuration) * this.config.speed;
      this.uniforms["u_Realtime"] = this.time;

      const { clientWidth, clientHeight } = this.gl.canvas;

      if (resizeCanvasToDisplaySize(this.gl.canvas)) {
        // Update the canvas viewport, `resolution` uniform & geometry if
        // the size of the canvas changed
        this.gl.viewport(0, 0, clientWidth, clientHeight);
        this.geometry = createGeometry(this.gl, {
          width: clientWidth,
          depth: clientHeight,
          density: this.config.density,
        });
      }

      // Uniforms must be updated each frame otherwise the initial value
      // is used? why is that?
      this.uniforms["u_Resolution"] = [clientWidth, clientHeight];

      // Prepare for & execute the WEBGL draw call
      this.gl.useProgram(this.programInfo.program);
      setBuffersAndAttributes(this.gl, this.programInfo, this.geometry);
      setUniforms(this.programInfo, this.uniforms);
      this.gl.drawElements(
        this.config.wireframe ? this.gl.LINES : this.gl.TRIANGLES,
        this.geometry.numElements,
        this.gl.UNSIGNED_SHORT,
        0
      );
    }
  }
}
