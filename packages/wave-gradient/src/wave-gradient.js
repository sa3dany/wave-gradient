import { vert, frag } from "./shaders";

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

/**
 * Converts an RGB hex color string to a an array of color values.
 *
 * @param {string} hex - hex color string
 * @returns {number[] | null} color values
 */
function parseRGB(hex) {
  const result =
    hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i) ||
    hex.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i); // Short form #fff
  return result
    ? result.slice(1, 4).map((c) => {
        return parseInt(c.length < 2 ? c + c : c, 16) / 255;
      })
    : null;
}

// ---------------------------------------------------------------------
// ClipSpace
// ---------------------------------------------------------------------

/**
 * Clip space plane geometry
 *
 * @typedef {{
 *   positions: ArrayBuffer,
 *   indices: ArrayBuffer,
 *   count: number
 * }} ClipSpacePlaneGeometry
 */

/**
 * @typedef {{
 *   gl: WebGL2RenderingContext,
 *   shaders: [string, string],
 *   attributes: Object<string, ArrayBuffer>,
 *   elements: ArrayBuffer,
 *   uniforms: any,
 * }} ClipSpaceConfig
 */

/**
 * @typedef {{
 *   buffer: WebGLBuffer,
 *   location: number,
 * }} AttributeInfo
 */

/**
 * @typedef {{
 *   type: ClipSpaceUniformType,
 *   value: number | Array<ClipSpaceUniform>,
 * }} ClipSpaceUniform
 */

/** @typedef { "1f" | "2f" | "3f" | "1i" } ClipSpaceUniformType */

/**
 * Class that encapsulates the creation and state management of a WebGL
 * program and related attributes and uniforms.
 *
 * Some inspiration from [Phenomenon
 * library](https://github.com/vaneenige/phenomenon).
 */
class ClipSpace {
  /**
   * Creates clip space plane geometry.
   *
   * This plane is created for WEBGL clip space, this means it has a
   * width and depth of 2 and the positions of the vertices go from -1
   * to 1 in the X and Y axis, while the Z axis goes from 0 to 1 to
   * match the default near and far values for the depth buffer.
   *
   * Note that I am not using the depth buffer since enabling the depth
   * test increases GPU usage (at least on my laptops's iGPU). Since the
   * depth test is disabled, I had to order the vertices back to front
   * (far to near) to get the correct order of the fragments.
   *
   * @param {number} widthSegments Width of the plane
   * @param {number} depthSegments depth of the plane
   * @returns {ClipSpacePlaneGeometry} Plane geometry
   */
  static createPlaneGeometry(widthSegments, depthSegments) {
    const gridX = Math.ceil(widthSegments);
    const gridZ = Math.ceil(depthSegments);

    // Prepare the typed arrays for the indexed geometry
    const vertexCount = 3 * (gridX + 1) * (gridZ + 1);
    const indexCount = 3 * 2 * gridX * gridZ;
    const positions = new ArrayBuffer(4 * vertexCount);
    const indices = new ArrayBuffer(4 * indexCount);

    // Create the vertex positions
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

    // Create the indices
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
   * Prefixes attribute or uniform names with the given prefix. While
   * also making the name sentence cased.
   *
   * @private
   * @param {string} name attribute/uniform name
   * @param {string} prefix prefix
   * @returns {string} prefixed name
   */
  static prefixName(name, prefix) {
    return `${prefix}${name[0].toUpperCase()}${name.slice(1)}`;
  }

  /**
   * @param {ClipSpaceConfig} config configuration
   */
  constructor(config) {
    /** @private */
    this.gl = config.gl;

    /** @private */
    this.program = this.createProgram(config.shaders);

    /**
     * @private
     * @type {Object<string, AttributeInfo>}
     */
    this._attributes = {};

    /** @private */
    this.setupAttributes(config.attributes);

    /**
     * @private
     * @type {WebGLBuffer}
     */
    this._elementBuffer;

    /** @private */
    this.setElements(config.elements);

    /**
     * @private
     * @type {Object<string, Function>}
     */
    this._uniforms = {};

    /** @private */
    this.setupUniforms(config.uniforms);
  }

  /**
   * @private
   * @param {number} type shader type
   * @param {string} source shader source
   * @throws {Error} if the shader could not be created
   * @returns {WebGLShader} shader
   */
  compileShader(type, source) {
    const { gl } = this;

    let shader = gl.createShader(type);
    if (!shader) throw new Error("can't create shader");

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    return shader;
  }

  /**
   * @private
   * @param {WebGLProgram} program WebGL2 program
   * @throws {Error} if the program did not link successfully
   * @returns {void}
   */
  debugProgram(program) {
    const { gl } = this;
    const [vs, fs] = gl.getAttachedShaders(program) ?? [];
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        `can't link WebGL program.
    ${gl.getProgramInfoLog(program)}
    ${gl.getShaderInfoLog(vs)}
    ${gl.getShaderInfoLog(fs)}`
      );
    }
  }

  /**
   * Creates a WebGL program.
   *
   * @private
   * @param {[string, string]} shaders vertex & fragment shader sources
   * @throws {Error} if the program could not be created or linked
   * @returns {WebGLProgram} shader program
   */
  createProgram(shaders) {
    const { gl } = this;
    const [vs, fs] = [
      this.compileShader(gl.VERTEX_SHADER, shaders[0]),
      this.compileShader(gl.FRAGMENT_SHADER, shaders[1]),
    ];

    const program = gl.createProgram();
    if (!program) throw new Error("can't create WebGL program");

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);

    try {
      gl.linkProgram(program);
      this.debugProgram(program);
    } catch (linkError) {
      gl.deleteProgram(program);
      throw linkError;
    } finally {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    }

    gl.useProgram(program);

    return program;
  }

  /**
   * Creates a WebGL buffer.
   *
   * @private
   * @throws if can't create buffer
   * @returns {WebGLBuffer} buffer
   */
  createBuffer() {
    const { gl } = this;
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error("can't create buffer");
    return buffer;
  }

  /**
   * Creates the attributes for the WebGL program.
   *
   * @private
   * @param {object} attributes attributes
   */
  setupAttributes(attributes) {
    const { gl, program } = this;

    for (const [name, dataBuffer] of Object.entries(attributes)) {
      const prefixedName = ClipSpace.prefixName(name, "a_");

      const buffer = this.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, dataBuffer, gl.STATIC_DRAW);

      const location = gl.getAttribLocation(program, prefixedName);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 3, gl.FLOAT, false, 0, 0);

      this._attributes[name] = { buffer, location };
    }
  }

  /**
   * Setter for attributes.
   *
   * @param {string} attributeName attribute name
   * @param {ArrayBuffer} dataBuffer ArrayBuffer containing the data
   */
  setAttribute(attributeName, dataBuffer) {
    const { gl } = this;

    // Since there is only one attribute used by the WaveGradient, it's
    // okay to not call `gl.bindBuffer` before setting the buffer data.
    // which is why `attributeName` in unused now.
    gl.bufferData(gl.ARRAY_BUFFER, dataBuffer, gl.STATIC_DRAW);
  }

  /**
   * Setup WebGL indexed drawing data buffer.
   *
   * @param {ArrayBuffer} elements elements
   */
  setElements(elements) {
    const { gl } = this;

    if (!this._elementBuffer) {
      const buffer = this.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
      this._elementBuffer = buffer;
    }

    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, elements, gl.STATIC_DRAW);
  }

  /**
   * @param {string} name uniform name
   * @param {ClipSpaceUniformType} type uniform type
   * @param {any} [initialValue] initial uniform value
   * @returns {Function} uniform setter function
   */
  createUniformSetter(name, type, initialValue) {
    const { gl, program } = this;
    const uniformX = `uniform${type}`;
    const location = gl.getUniformLocation(program, name);
    const setter =
      /**
       * @param {number | number[]} value uniform value
       */
      (value) => {
        Array.isArray(value)
          ? // @ts-ignore
            gl[uniformX](location, ...value)
          : // @ts-ignore
            gl[uniformX](location, value);
      };
    if (initialValue) setter(initialValue);
    return setter;
  }

  /**
   * Creates the uniforms for the WebGL program.
   *
   * @param {Object<string, ClipSpaceUniform>} uniforms uniforms
   */
  setupUniforms(uniforms) {
    for (const [name, uniform] of Object.entries(uniforms)) {
      const prefixedName = ClipSpace.prefixName(name, "u_");

      switch (uniform.type) {
        case undefined:
          Array.isArray(uniform.value) &&
            uniform.value.forEach(
              /**
               * @param {*} member struct member
               * @param {number} i index
               */
              (member, i) => {
                const structName = name;
                const prefixedStructName = prefixedName;
                for (const [name, uniform] of Object.entries(member)) {
                  const key = `${structName}[${i}].${name}`;
                  const prefixedKey = `${prefixedStructName}[${i}].${name}`;
                  this._uniforms[key] = this.createUniformSetter(
                    prefixedKey,
                    uniform.type,
                    uniform.value
                  );
                }
              }
            );
          break;
        default:
          this._uniforms[name] = this.createUniformSetter(
            prefixedName,
            uniform.type,
            uniform.value
          );
      }
    }
  }

  /**
   * Setter for uniforms.
   *
   * @param {string} uniformName uniform name
   * @param {any} newValue new value
   */
  setUniform(uniformName, newValue) {
    this._uniforms[uniformName](newValue);
  }

  /**
   * Deletes the WebGL program and buffers.
   */
  delete() {
    const { gl } = this;

    gl.deleteProgram(this.program);
    for (const [, attribute] of Object.entries(this._attributes)) {
      this.gl.deleteBuffer(attribute.buffer);
    }
  }
}

// ---------------------------------------------------------------------
// WaveGradient
// ---------------------------------------------------------------------

/**
 * WaveGradient options.
 *
 * @typedef {object} WaveGradientOptions
 * @property {number} [amplitude] Gradient waves amplitude.
 * @property {string[]} [colors] Gradient color layers. Limited to 10.
 * @property {number[]} [density] Level of detail of the plane geometry.
 * @property {number} [fps] Frames per second for rendering.
 * @property {number} [seed] Seed for the noise function.
 * @property {number} [speed] Speed of the gradient waves.
 * @property {number} [time] Initial time of the animation.
 * @property {boolean} [wireframe] Wireframe render mode.
 */

/** @typedef {number} DOMHighResTimeStamp */

/**
 * Class that recreates the https://stripe.com animated gradient.
 */
export class WaveGradient {
  /**
   * Create a gradient instance. The element must be a canvas HTML
   * element.
   *
   * @param {HTMLCanvasElement} canvas - canvas element
   * @param {WaveGradientOptions} options - gradient options
   * @throws {TypeError} if the canvas element is not a valid canvas
   * element
   * @throws {Error} if it can't acquire a WebGL 2.0 context
   */
  constructor(canvas, options) {
    // get a WebGL2 rendering context
    const gl = canvas.getContext("webgl2", {
      antialias: true,
      depth: false,
      powerPreference: "low-power",
    });
    if (!gl) throw new Error("can't get WebGL2 context");

    // mix in default options
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

    // get canvas display (css) dimensions
    const { clientWidth, clientHeight } = canvas;

    // set initial canvas size
    canvas.width = clientWidth;
    canvas.height = clientHeight;
    gl.viewport(0, 0, clientWidth, clientHeight);

    // Enable culling of back triangle faces
    gl.enable(gl.CULL_FACE);

    // Not-needed since I am using at least `mediump` precision in the
    // fragment shader
    gl.disable(gl.DITHER);

    // Enabling depth testing hurts performance in my testing. It is
    // disabled by default but I am just making the choice explicit for
    // documentation
    gl.disable(gl.DEPTH_TEST);

    // create the initial plane geometry
    const geometry = ClipSpace.createPlaneGeometry(
      clientWidth * density[0],
      clientHeight * density[1]
    );

    /**
     * For reference, the original stripe gradient preset values were:
     *
     * time:                   1253106
     * shadow_power:           6 {canvas.y < 600 ? 5 : 6}
     * global.noiseSpeed:      5e-6
     * global.noiseFreq:       [14e-5, 29e-5]
     * vertDeform.noiseFreq:   [3, 4]
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
     *   noiseFreq:  [2 + (i / sectionColors.length),
     *               3 + (i / sectionColors.length)]
     *   noiseSeed:  seed + (10 * i),
     *   noiseSpeed: 11 + (0.3 * i),
     */

    // create the clip space
    const clipSpace = new ClipSpace({
      gl,
      shaders: [vert, frag],
      attributes: { position: geometry.positions },
      elements: geometry.indices,
      uniforms: {
        amplitude: { value: amplitude, type: "1f" },
        baseColor: { value: parseRGB(colors[0]), type: "3f" },
        realtime: { value: time, type: "1f" },
        resolution: { value: [clientWidth, clientHeight], type: "2f" },
        seed: { value: seed, type: "1f" },
        shadowPower: { value: 6, type: "1f" },
        layerCount: { value: colors.length - 1, type: "1i" },
        waveLayers: {
          value: colors.slice(1).map((color, i, array) => {
            const r = (i + 1) / array.length + 1;
            return {
              noiseCeil: { value: 0.63 + 0.07 * (i + 1), type: "1f" },
              noiseFloor: { value: 0.1, type: "1f" },
              noiseFlow: { value: 6.5 + 0.3 * (i + 1), type: "1f" },
              noiseSeed: { value: seed + 10 * (i + 1), type: "1f" },
              noiseSpeed: { value: 11 + 0.3 * (i + 1), type: "1f" },
              noiseFreq: { value: [2 + r, 3 + r], type: "2f" },
              color: { value: parseRGB(color), type: "3f" },
            };
          }),
        },
      },
    });

    /** @private */
    this.gl = gl;

    /** @private */
    this.clipSpace = clipSpace;

    /** @private */
    this.density = density;

    /** @private */
    this.speed = speed;

    /** @private */
    this.frameInterval = 1000 / fps;

    /** @private */
    this.lastFrameTime = 0;

    /** @private */
    this.shouldRender = true;

    /** @private */
    this.drawMode = wireframe ? this.gl.LINES : this.gl.TRIANGLES;

    /** @private */
    this.drawCount = geometry.count;

    /**
     * The time the animation has been running in milliseconds. Can be
     * set while the animation is running to seek to a specific point in
     * the animation.
     *
     * @type {number}
     */
    this.time = time;

    // Start the render loop
    requestAnimationFrame((now) => {
      this.render(now);
    });
  }

  /**
   * Resize the canvas (and geometry) to match the size it's displayed
   * at.
   *
   * @private
   */
  resize() {
    const { gl, gl: { canvas }, clipSpace } = this; // prettier-ignore
    const { width, clientWidth, height, clientHeight } = canvas;
    const resized = width !== clientWidth || height !== clientHeight;

    if (resized) {
      // Update canvas, viewport and resolution uniform
      canvas.width = clientWidth;
      canvas.height = clientHeight;
      gl.viewport(0, 0, clientWidth, clientHeight);
      this.clipSpace.setUniform("resolution", [clientWidth, clientHeight]);

      // Create new geometry
      const geometry = ClipSpace.createPlaneGeometry(
        clientWidth * this.density[0],
        clientHeight * this.density[1]
      );

      // Update geometry attributes
      clipSpace.setAttribute("position", geometry.positions);

      // Update index buffer and draw count
      clipSpace.setElements(geometry.indices);
      this.drawCount = geometry.count;
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
      // Enqueue the next frame
      requestAnimationFrame((now) => {
        this.render(now);
      });
    } else {
      return;
    }

    const delta = now - this.lastFrameTime;
    if (delta < this.frameInterval) {
      // Resizing is relatively expensive because we have to regenerate
      // the geometry. So do it on the off-frames and add some
      // randomness to reduce the frequency a little more.
      if (Math.random() > 0.75 === true) this.resize();
      return;
    }

    // I learned this trick to get a more acuate framerate from:
    // https://gist.github.com/addyosmani/5434533
    this.lastFrameTime = now - (delta % this.frameInterval);

    // Update the `time` uniform
    this.time += Math.min(delta, this.frameInterval) * this.speed;
    this.clipSpace.setUniform("realtime", this.time);

    // execute the WebGL draw call
    this.gl.drawElements(
      this.drawMode,
      this.drawCount,
      this.gl.UNSIGNED_INT,
      0
    );
  }

  /**
   * Clears resources used by the gradient instance and stops rendering.
   */
  destroy() {
    // Delete the clipSpace
    this.clipSpace.delete();

    // @ts-ignore
    delete this.gl;

    // stop rendering. break the requestAnimationFrame loop.
    this.shouldRender = false;
  }
}
