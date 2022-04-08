/** @module */

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
import vertexShader from "./shader/noise.vert";
import fragmentShader from "./shader/color.frag";

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
  fps: 24,
  frequency: [0.00014, 0.00029],
  seed: 5,
  time: 0,
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
  const gridX = Math.ceil(density[0] * width);
  const gridY = Math.ceil(density[1] * height);
  const geometry = new PlaneGeometry(width, height, gridX, gridY);

  // Rotate to be flat across the z axis (to match strip's plane)
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
 * vertex and fragment shaders. Also adds the required uniform
 * declarations to the start of the glsl shader file string.
 * @param {Object} uniforms
 * @returns {THREE.ShaderMaterial} three.js shader material
 */
function setMaterial(options = {}) {
  return new RawShaderMaterial({
    uniforms: options.uniforms,
    vertexShader,
    fragmentShader,
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
  const frameTime = 1000 / this.config.fps;
  const shouldSkipFrame = now - this.state.lastFrameTime < frameTime;

  if (!shouldSkipFrame) {
    this.time += Math.min(now - this.state.lastFrameTime, frameTime);
    this.state.lastFrameTime = now;
    this.uniforms["u_time"].value = this.time;
    this.renderer.render(this.scene, this.camera);
  }

  if (this.state.playing) requestAnimationFrame(animate.bind(this));
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
    const { clientWidth, clientHeight } = this.container;

    /** @private */
    this.uniforms = {
      resolution: { value: new Float32Array([clientWidth, clientHeight]) },
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
    this.camera = setCamera(this.camera, clientWidth, clientHeight);

    /** @private */
    this.geometry = setGeometry(clientWidth, clientHeight, this.config.density);

    /** @private */
    this.material = setMaterial({
      uniforms: this.uniforms,
    });

    /** @private */
    this.mesh = this.config.wireframe
      ? new LineSegments(this.geometry, this.material)
      : new Mesh(this.geometry, this.material);

    /** @private */
    this.scene = new Scene();
    this.scene.add(this.mesh);

    /** @private */
    this.renderer = new WebGLRenderer({
      canvas: this.domElement,
      antialias: true,
    });
    this.renderer.setSize(clientWidth, clientHeight);
    this.renderer.setClearAlpha(0);

    /** @private */
    this.state = {
      playing: false,
      lastFrameTime: -Infinity,
    };

    /** @public */
    this.time = this.config.time;

    // Render one frame on init
    requestAnimationFrame(animate.bind(this));
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
   * Stop animating the gradient.
   * @returns {WaveGradient} self for chaining
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
   * @returns {WaveGradient} self for chaining
   */
  resize() {
    const { clientWidth, clientHeight } = this.container;

    this.geometry.dispose();
    this.geometry = setGeometry(clientWidth, clientHeight, this.config.density);

    const oldMesh = this.mesh;
    this.mesh = new Mesh(this.geometry, this.material);
    this.scene.remove(oldMesh);
    this.scene.add(this.mesh);

    setCamera(this.camera, clientWidth, clientHeight);
    this.renderer.setSize(clientWidth, clientHeight);
    this.uniforms.resolution.value = new Float32Array([
      clientWidth,
      clientHeight,
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
