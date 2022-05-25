// @ts-check

import { vert, frag } from "./shaders";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

/** @typedef {number} DOMHighResTimeStamp */

/**
 * WaveGradient options.
 *
 * @typedef {object} WaveGradientOptions
 * @property {number} [amplitude] - Amplitude of the wave.
 * @property {string[]} [colors] - Array of colors to use for the.
 *   gradient. Limited to 10 colors.
 * @property {number[]} [density] - Level of detail of the plane
 *   gemotery in the x & z directions.
 * @property {number} [fps] - animation FPS.
 * @property {number} [seed] - Seed for the noise function.
 * @property {number} [speed] - Speed of the waves.
 * @property {number} [time] - Time of the animation.
 * @property {boolean} [wireframe] - Wireframe rendering mode.
 */

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
 * Creates the plane geomtery.
 *
 * @param {number} width - Width of the plane
 * @param {number} depth - depth of the plane
 * @param {number[]} density - Level of detail of the plane geometry
 * @returns {object} Plane geometry BufferInfo
 */
function createGeometry(width, depth, density) {
  const gridX = Math.ceil(density[0] * width);
  const gridZ = Math.ceil(density[0] * depth);

  // Prepare the typed arrays for the indexed geometry
  const vertexCount = 3 * (gridX + 1) * (gridZ + 1);
  const positions = new ArrayBuffer(4 * vertexCount);
  const indexCount = 3 * 2 * gridX * gridZ;
  const indices = new ArrayBuffer(4 * indexCount);

  // This plane is created for WEBGL clip space, this means it has a
  // width and depth of 2 and the positions of the vertices go from -1
  // to 1 in the X and Y axis, while the Z axis goes from 0 to 1 to
  // match the default near and far values for the depth buffer.
  //
  // Note though that I am not using the depth buffer since enabling the
  // depth test in `gl.enable(gl.DEPTH_TEST)` increases GPU usage. Since
  // the depth test is disabled, I had to order the vertices back to
  // front (far to near) to get the correct order of the fragments.
  for (let z = gridZ, i = 0, view = new DataView(positions); z >= 0; z--) {
    const v = z / gridZ;
    const clipY = v * 2 - 1;
    for (let x = gridX; x >= 0; x--, i += 3) {
      const clipX = (x / gridX) * 2 - 1;
      view.setFloat32((i + 0) * 4, clipX, true);
      view.setFloat32((i + 1) * 4, clipY, true);
      view.setFloat32((i + 2) * 4, v, true);
    }
  }

  const verticesAcross = gridX + 1;
  for (let z = 0, i = 0, view = new DataView(indices); z < gridZ; z++) {
    for (let x = 0; x < gridX; x++, i += 6) {
      view.setUint32((i + 0) * 4, (z + 0) * verticesAcross + x, true);
      view.setUint32((i + 1) * 4, (z + 0) * verticesAcross + x + 1, true);
      view.setUint32((i + 2) * 4, (z + 1) * verticesAcross + x, true);
      view.setUint32((i + 3) * 4, (z + 0) * verticesAcross + x + 1, true);
      view.setUint32((i + 4) * 4, (z + 1) * verticesAcross + x + 1, true);
      view.setUint32((i + 5) * 4, (z + 1) * verticesAcross + x, true);
    }
  }

  return { positions, indices, count: indexCount };
}

/**
 * Creates a WebGL context.
 *
 * @param {HTMLCanvasElement} canvas canvas element
 * @returns {WebGL2RenderingContext} rendering context
 */
function createContext(canvas) {
  const gl = canvas.getContext("webgl2", {
    antialias: true,
    depth: false,
    powerPreference: "low-power",
  });

  if (!gl) {
    throw new Error("Could not acquire a WEBGL2 context");
  }

  // Enable culling of back triangle faces
  gl.enable(gl.CULL_FACE);

  // Not-needed since I am using atleast `mediump` precicion in the
  // fragment shader
  gl.disable(gl.DITHER);

  // Enablig depth testing hurts performance in my testing. It is
  // disabled by default but I am just making the choise explicit for
  // documentation
  gl.disable(gl.DEPTH_TEST);

  return gl;
}

/**
 * Creates a WebGL program.
 *
 * @param {WebGLRenderingContext} gl rendering context
 * @param {string} vertexShaderSource vertex shader source
 * @param {string} fragmentShaderSource source code for the fragment shader
 * @returns {WebGLProgram} shader program
 */
function createProgram(gl, vertexShaderSource, fragmentShaderSource) {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("Could not create WebGL program");
  }

  let vertexShader = gl.createShader(gl.VERTEX_SHADER);
  let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) {
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    throw new Error("Could not create shader");
  }

  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    console.error(gl.getProgramInfoLog(program));
    console.error(gl.getShaderInfoLog(vertexShader));
    console.error(gl.getShaderInfoLog(fragmentShader));
    throw new Error("Could not link WebGL program");
  }

  // cleanup
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  gl.useProgram(program);

  return program;
}

/**
 * Creates the attributes for the WebGL program.
 *
 * @param {WebGL2RenderingContext} gl rendering context
 * @param {WaveGradientOptions} options options
 * @returns {object} attributes
 */
function createAttributes(gl, options) {
  const program = gl.getParameter(gl.CURRENT_PROGRAM);
  if (!program) {
    throw new Error("Could not get active WebGL program");
  }

  const geometry = createGeometry(
    gl.canvas.clientWidth,
    gl.canvas.clientHeight,
    options.density
  );

  const attributes = {
    a_Position: {
      arrayBuffer: gl.createBuffer(),
      arrayData: geometry.positions,
      indexBuffer: gl.createBuffer(),
      indexData: geometry.indices,
      location: gl.getAttribLocation(program, "a_Position"),
    },
  };

  for (const [, attribute] of Object.entries(attributes)) {
    gl.bindBuffer(gl.ARRAY_BUFFER, attribute.arrayBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, attribute.arrayData, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, attribute.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, attribute.indexData, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(attribute.location);
    gl.vertexAttribPointer(attributes.location, 3, gl.FLOAT, false, 0, 0);
  }

  return attributes;
}

/**
 * Creates the uniforms for the WebGL program.
 *
 * @param {WebGL2RenderingContext} gl rendering context
 * @param {WaveGradientOptions} options options
 * @returns {object} uniforms
 */
function createUniforms(gl, options) {
  const program = gl.getParameter(gl.CURRENT_PROGRAM);
  if (!program) {
    throw new Error("Could not get active WebGL program");
  }

  const uniforms = {
    u_Amplitude: {
      value: options.amplitude,
      type: "1f",
    },
    u_BaseColor: {
      value: rgbTo3f(options.colors[0]),
      type: "3f",
    },
    u_Realtime: {
      value: options.time,
      type: "1f",
    },
    u_Resolution: {
      value: [gl.canvas.clientWidth, gl.canvas.clientHeight],
      type: "2f",
    },
    u_Seed: {
      value: options.seed,
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
          if (i >= options.colors.length - 1) return layer;
          const j = i + 1;
          return {
            color: { value: rgbTo3f(options.colors[j]), type: "3f" },
            isSet: { value: true, type: "1i" },
            noiseCeil: { value: 0.63 + 0.07 * j, type: "1f" },
            noiseFloor: { value: 0.1, type: "1f" },
            noiseFlow: { value: 6.5 + 0.3 * j, type: "1f" },
            noiseFreq: {
              value: [
                2 + j / options.colors.length,
                3 + j / options.colors.length,
              ],
              type: "2f",
            },
            noiseSeed: { value: options.seed + 10 * j, type: "1f" },
            noiseSpeed: { value: 11 + 0.3 * j, type: "1f" },
          };
        }),
    },
  };

  for (const [name, uniform] of Object.entries(uniforms)) {
    const createSetter = (name, type) => {
      const uniformX = `uniform${type}`;
      const location = gl.getUniformLocation(program, name);
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

  return uniforms;
}

// ---------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------

/**
 * Class that recreates the https://stripe.com animated gradient.
 */
export class WaveGradient {
  /**
   * Some inspiration from [vaneenige's Phenomenon
   * library](https://github.com/vaneenige/phenomenon).
   */

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

  /**
   * Create a gradient instance. The element can be canvas HTML element
   * or a css query, in which case the first matching element will be
   * used.
   *
   * @param {HTMLCanvasElement} canvas - canvas element
   * @param {WaveGradientOptions} options - gradient options
   */
  constructor(canvas, options) {
    const {
      amplitude = 320,
      colors = ["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"],
      density = [0.06, 0.16],
      fps = 24,
      seed = 0,
      speed = 1.25,
      time = 0,
      wireframe = false,
    } = options ?? {};

    /** @private */
    this.gl = createContext(canvas);

    /** @private */
    this.program = createProgram(this.gl, vert, frag);

    /** @private */
    this.attributes = createAttributes(this.gl, { density });

    /** @private */
    this.uniforms = createUniforms(this.gl, { amplitude, colors, seed, speed });

    /** @private */
    this.density = density;

    /** @private */
    this.speed = speed;

    /** @private */
    this.wireframe = wireframe;

    /** @private */
    this.frameInterval = 1000 / fps;

    /** @private */
    this.lastFrameTime = 0;

    /** @private */
    this.shouldRender = true;

    /**
     * The time the animation has been running in milliseconds. Can be
     * set while the animation is running to seek to a specific point in
     * the animation.
     *
     * @type {number}
     */
    this.time = time;

    this.resize();
    requestAnimationFrame((now) => {
      this.render(now);
    });
  }

  /**
   * Resize a canvas to match the size it's displayed. Copied from
   * TWGL.js by greggman.
   *
   * @private
   */
  resize() {
    const { gl, gl: { canvas } } = this; // prettier-ignore
    const { clientWidth, clientHeight } = canvas;

    // update the canvas size, viewport, `resolution` uniform and plane
    // geometry if the size of the canvas changed
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      gl.viewport(0, 0, clientWidth, clientHeight);
      this.uniforms.u_Resolution.set([clientWidth, clientHeight]);
      const geometry = createGeometry(clientWidth, clientHeight, this.density);
      gl.bufferData(gl.ARRAY_BUFFER, geometry.positions, gl.STATIC_DRAW);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
      this.attributes.a_Position.indexData = geometry.indices;
    }
  }

  /**
   * Renders a frame.
   *
   * @private
   * @param {DOMHighResTimeStamp} now - Current frame timestamp
   */
  render(now) {
    if (this.shouldRender) {
      requestAnimationFrame((now) => {
        this.render(now);
      });
    } else {
      return;
    }

    const delta = now - this.lastFrameTime;
    if (delta < this.frameInterval) {
      return;
    }

    // I leanred this trick to get a more acurate framerate from:
    // https://gist.github.com/addyosmani/5434533
    this.lastFrameTime = now - (delta % this.frameInterval);

    // Update the `time` uniform
    this.time += Math.min(delta, this.frameInterval) * this.speed;
    this.uniforms.u_Realtime.set(this.time);

    // I opted for this approsh instead of registering a callback on
    // `resize`
    this.resize();

    // Prepare for & execute the WEBGL draw call
    this.gl.drawElements(
      this.wireframe ? this.gl.LINES : this.gl.TRIANGLES,
      this.attributes.a_Position.indexData.byteLength / 4,
      this.gl.UNSIGNED_INT,
      0
    );
  }

  /**
   * Clears resources used by the gradient instance and stops rendering.
   */
  destroy() {
    // Delete attribute buffers
    for (const [, attribute] of Object.entries(this.attributes)) {
      this.gl.deleteBuffer(attribute.arrayBuffer);
      this.gl.deleteBuffer(attribute.indexBuffer);
    }

    // Delete the program and context reference
    this.gl.deleteProgram(this.program);
    this.gl = null;

    // stop rendering. break the requestAnimationFrame loop.
    this.shouldRender = false;
  }
}
