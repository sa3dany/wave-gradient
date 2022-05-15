// @ts-check

/**
 * @file Wave Gradients main class
 */

// ---------------------------------------------------------------------
// Imports
// ---------------------------------------------------------------------

import { noise_vert, color_frag, blend_glsl, snoise_glsl } from "./shaders";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

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
 *   loaded.
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
  fps: 24,
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
function rgbTo3f(hexString) {
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
 * Linkes a shaader stage with it's includes and makes sure to place
 * `#version 300 es` as the first line is the shader stage is using
 * WEBGL2.
 *
 * @param {string} stage shader stage source code string
 * @param {Array<string>} includes shader stage source includes
 * @returns {string} shader linked shader source
 */
function linkShader(stage, includes) {
  const isWebGL2 = /^#version 300 es/;
  if (isWebGL2.test(stage)) {
    return `#version 300 es\n${includes.join("")}${stage.replace(
      isWebGL2,
      ""
    )}`;
  } else {
    return `${includes.join("")}${stage}`;
  }
}

/**
 * Creates the plane geomtery.
 *
 * @param {object} options Plane options
 * @param {number} options.width - Width of the plane
 * @param {number} options.depth - depth of the plane
 * @param {number[]} options.density - Level of detail of the plane geometry
 * @returns {object} Plane geometry BufferInfo
 */
function createGeometry({ width, depth, density }) {
  const gridX = Math.ceil(density[0] * width);
  const gridZ = Math.ceil(density[0] * depth);
  const vertices = (gridX + 1) * (gridZ + 1);

  // Prepare the typed arrays for the geometry
  // TODO: use Uint32 if index count exceeds 2^16
  const geometry = {
    positions: new Float32Array(3 * vertices),
    indices: new Uint16Array(3 * gridX * gridZ * 2),
  };

  // This plane is created for the WEBGL clip space, this means it has a
  // width and depth of 2 and the positions of the vertices go from -1
  // to 1 in the X and Y axis, while the Z axis goes from 0 to 1 to
  // match the default near and far values for the depth buffer.
  //
  // Note though that I am not using the depth buffer since enabling the
  // depth test in `gl.enable(gl.DEPTH_TEST)` increases GPU usage. Since
  // the depth test is disabled, I had to order the vertices back to
  // front (far to near) to get the correct order of the fragments.
  for (let z = gridZ, i = 0, j = 0; z >= 0; z--) {
    const v = z / gridZ;
    const clipY = v * 2 - 1;
    for (let x = gridX; x >= 0; x--, i += 3, j += 2) {
      const clipX = (x / gridX) * 2 - 1;
      geometry.positions[i + 0] = clipX;
      geometry.positions[i + 1] = clipY;
      geometry.positions[i + 2] = v;
    }
  }

  const verticesAcross = gridX + 1;
  for (let z = 0, i = 0; z < gridZ; z++) {
    for (let x = 0; x < gridX; x++, i += 6) {
      geometry.indices[i + 0] = (z + 0) * verticesAcross + x;
      geometry.indices[i + 1] = (z + 0) * verticesAcross + x + 1;
      geometry.indices[i + 2] = (z + 1) * verticesAcross + x;
      geometry.indices[i + 3] = (z + 1) * verticesAcross + x + 1;
      geometry.indices[i + 4] = (z + 1) * verticesAcross + x;
      geometry.indices[i + 5] = (z + 0) * verticesAcross + x + 1;
    }
  }

  return geometry;
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
// function createUniforms({ config, width, height }) {
//   const { colors, seed, speed, time } = config;

//   /**
//    * For reference, the original stripe gradient preset values were:
//    *
//    * time:                   1253106
//    * shadow_power:           6 {canvas.y < 600 ? 5 : 6}
//    * global.noiseSpeed:      5e-6
//    * global.noiseFreq:      [14e-5, 29e-5]
//    * vertDeform.noiseFreq:  [3, 4]
//    * vertDeform.noiseSpeed:  10
//    * vertDeform.noiseFlow:   3
//    * vertDeform.noiseSeed:   5
//    * vertDeform.noiseAmp:    320
//    *
//    * for (i = 1; i < sectionColors.length; i++):
//    *   color:      sectionColors[i]
//    *   noiseCeil:  0.63 + (0.07 * i),
//    *   noiseFloor: 0.1,
//    *   noiseFlow:  6.5 + (0.3 * i),
//    *   noiseFreq: [2 + (i / sectionColors.length),
//    *               3 + (i / sectionColors.length)]
//    *   noiseSeed:  seed + (10 * i),
//    *   noiseSpeed: 11 + (0.3 * i),
//    */
//   const uniforms = {
//     u_BaseColor: rgbTo3f(colors[0]),
//     u_Resolution: [width, height],
//     u_Realtime: time,
//     u_Amplitude: 320,
//     u_Seed: seed,
//     u_Speed: speed,
//     u_ShadowPower: 6,
//     u_WaveLayers: new Array(9),
//   };

//   /**
//    * Pad the array with empty layers.
//    * Refer to the commet in the vertex shader for more details.
//    */
//   for (let i = 1; i < 9; i++) {
//     if (colors[i]) {
//       uniforms.u_WaveLayers[i - 1] = {
//         color: rgbTo3f(colors[i]),
//         isSet: true,
//         noiseCeil: 0.63 + 0.07 * i,
//         noiseFloor: 0.1,
//         noiseFlow: 6.5 + 0.3 * i,
//         noiseFreq: [2 + i / colors.length, 3 + i / colors.length],
//         noiseSeed: seed + 10 * i,
//         noiseSpeed: 11 + 0.3 * i,
//       };
//     } else {
//       uniforms.u_WaveLayers[i - 1] = {
//         color: [0, 0, 0],
//         isSet: false,
//         noiseCeil: 0,
//         noiseFloor: 0,
//         noiseFlow: 0,
//         noiseFreq: [0, 0],
//         noiseSeed: 0,
//         noiseSpeed: 0,
//       };
//     }
//   }

//   return Object.preventExtensions(uniforms);
// }

/**
 * Resize a canvas to match the size it's displayed. Copied from
 * TWGL.js by greggman.
 *
 * @param {HTMLCanvasElement} canvas The canvas to resize.
 * @returns {boolean} true if the canvas was resized.
 */
function resizeCanvas(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
    return true;
  }
  return false;
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
    // Get options
    const config = getOptions(options);

    /*
     * Setup WebGL
     * ----------- */

    // Get a WebGL2 context
    const canvas = getCanvas(element);
    resizeCanvas(canvas);

    const gl = canvas.getContext("webgl2", {
      antialias: true,
      depth: false,
      powerPreference: "low-power",
    });

    // Set initial viewport size
    gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);

    // Enable culling of back triangle faces
    gl.enable(gl.CULL_FACE);

    // Not-needed since I am using atleast `mediump` precicion in the
    // fragment shader
    gl.disable(gl.DITHER);

    // Enablig depth testing hurts performance in my testing. It is
    // disabled by default but I am just making the choise explicit for
    // documentation
    gl.disable(gl.DEPTH_TEST);

    // create & compile shaders
    let vs = gl.createShader(gl.VERTEX_SHADER);
    let fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vs, linkShader(noise_vert, [blend_glsl, snoise_glsl]));
    gl.shaderSource(fs, color_frag);
    gl.compileShader(vs);
    gl.compileShader(fs);

    // create program and attach shaders
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Link failed: " + gl.getProgramInfoLog(program));
      console.error("vs info-log: " + gl.getShaderInfoLog(vs));
      console.error("fs info-log: " + gl.getShaderInfoLog(fs));
    }
    (vs = null), (fs = null);

    // Prepare attributes
    const geometry = createGeometry({
      width: canvas.clientWidth,
      depth: canvas.clientHeight,
      density: config.density,
    });
    const attributes = {
      a_Position: {
        location: gl.getAttribLocation(program, "a_Position"),
        indexBuffer: gl.createBuffer(),
        buffer: gl.createBuffer(),
      },
    };
    // has to be bound before the ELEMENT_ARRAY_BUFFER is bound,
    // otherwise the ELEMENT_ARRAY_BUFFER will be unbound
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, attributes.a_Position.buffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, attributes.a_Position.indexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.DYNAMIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(attributes.a_Position.location);
    gl.vertexAttribPointer(
      attributes.a_Position.location,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );

    // Must be set before setting unifroms
    gl.useProgram(program);

    // Prepare uniforms
    const uniforms = {
      u_BaseColor: {
        value: rgbTo3f(config.colors[0]),
        type: "3f",
      },
      u_Resolution: {
        value: [canvas.clientWidth, canvas.clientHeight],
        type: "2f",
      },
      u_Realtime: {
        value: config.time,
        type: "1f",
      },
      u_Amplitude: {
        value: config.amplitude,
        type: "1f",
      },
      u_Seed: {
        value: config.seed,
        type: "1f",
      },
      u_Speed: {
        value: config.speed,
        type: "1f",
      },
      u_ShadowPower: {
        value: 6,
        type: "1f",
      },
      u_WaveLayers: {
        value: new Array(9)
          .fill({
            color: { value: [0, 0, 0], type: "3f" },
            isSet: { value: false, type: "1i" },
            noiseCeil: { value: 0, type: "1f" },
            noiseFloor: { value: 0, type: "1f" },
            noiseFlow: { value: 0, type: "1f" },
            noiseFreq: { value: [0, 0], type: "2f" },
            noiseSeed: { value: 0, type: "1f" },
            noiseSpeed: { value: 0, type: "1f" },
          })
          .map((layer, i) => {
            if (i >= config.colors.length - 1) return layer;
            const j = i + 1;
            return {
              color: { value: rgbTo3f(config.colors[j]), type: "3f" },
              isSet: { value: true, type: "1i" },
              noiseCeil: { value: 0.63 + 0.07 * j, type: "1f" },
              noiseFloor: { value: 0.1, type: "1f" },
              noiseFlow: { value: 6.5 + 0.3 * j, type: "1f" },
              noiseFreq: {
                value: [
                  2 + j / config.colors.length,
                  3 + j / config.colors.length,
                ],
                type: "2f",
              },
              noiseSeed: { value: config.seed + 10 * j, type: "1f" },
              noiseSpeed: { value: 11 + 0.3 * j, type: "1f" },
            };
          }),
      },
    };
    for (const [name, uniform] of Object.entries(uniforms)) {
      /**
       * @param {string} name uniform name
       * @param {string} type uniform type
       * @returns {Function} setter function
       */
      const createSetter = (name, type) => {
        const uniformX = `uniform${type}`;
        const location = gl.getUniformLocation(program, name);
        /** @param {number|Array<number>} value new uniform value */
        return (value) => {
          Array.isArray(value)
            ? gl[uniformX](location, ...value)
            : gl[uniformX](location, value);
        };
      };

      if (
        Array.isArray(uniform.value) &&
        uniform.value.every((v) => typeof v === "object")
      ) {
        uniform.value.forEach((member, i) => {
          const structName = name;
          for (const [name, uniform] of Object.entries(member)) {
            uniform.set = createSetter(
              `${structName}[${i}].${name}`,
              uniform.type
            );
            uniform.set(uniform.value);
          }
        });
      } else {
        uniform.set = createSetter(name, uniform.type);
        uniform.set(uniform.value);
      }
    }

    /** @private */
    this.attributes = attributes;

    /** @private */
    this.uniforms = uniforms;

    /** @private */
    this.config = config;

    /** @private */
    this.frameInterval = 1000 / config.fps;

    /** @private */
    this.gl = gl;

    /** @private */
    this.program = program;

    /** @private */
    this.geometry = geometry;

    /** @private */
    this.lastFrameTime = 0;

    /** @private */
    this.paused = false;

    /*
     * Public API
     * ---------- */

    /**
     * The time the animation has been running in milliseconds. Can be
     * set while the animation is running to seek to a specific point in
     * the animation.
     *
     * @public
     * @type {number}
     */
    this.time = config.time;

    /*
     * Start animating
     * --------------- */

    requestAnimationFrame((now) => {
      this.render(now);
      config.onLoad();
    });
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

    const delta = now - this.lastFrameTime;

    if (delta > this.frameInterval) {
      // I leanred this trick to get a more acurate framerate from:
      // https://gist.github.com/addyosmani/5434533
      this.lastFrameTime = now - (delta % this.frameInterval);

      // set program
      this.gl.useProgram(this.program);

      // Update the `time` uniform
      this.time += Math.min(delta, this.frameInterval) * this.config.speed;
      this.uniforms["u_Realtime"].set(this.time);

      const { clientWidth, clientHeight } = this.gl.canvas;

      if (resizeCanvas(this.gl.canvas)) {
        // Update the canvas viewport, `resolution` uniform & geometry if
        // the size of the canvas changed
        this.gl.viewport(0, 0, clientWidth, clientHeight);
        this.uniforms["u_Resolution"].set([clientWidth, clientHeight]);
        this.geometry = createGeometry({
          width: clientWidth,
          depth: clientHeight,
          density: this.config.density,
        });
        this.gl.bufferData(
          this.gl.ARRAY_BUFFER,
          this.geometry.positions,
          this.gl.STATIC_DRAW
        );
        this.gl.bufferData(
          this.gl.ELEMENT_ARRAY_BUFFER,
          this.geometry.indices,
          this.gl.STATIC_DRAW
        );
      }

      // Prepare for & execute the WEBGL draw call
      this.gl.drawElements(
        this.config.wireframe ? this.gl.LINES : this.gl.TRIANGLES,
        this.geometry.indices.length,
        this.gl.UNSIGNED_SHORT,
        0
      );
    }
  }
}
