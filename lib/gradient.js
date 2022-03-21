import {
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGL1Renderer,
} from "three";

/**
 * Default options
 * @constant
 */
const DEFAULTS = {
  wireframe: false,
  density: [0.06, 0.16],
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
function getCanvas(input) {
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
  const top = height / -2;
  if (camera === undefined) {
    camera = new OrthographicCamera(left, -left, top, -top, near, far);
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
  return new PlaneGeometry(width, height, wSegments, hSegments);
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
    if (!element) {
      throw new Error("element is required");
    }

    this.config = getOptions(options);

    this.domElement = getCanvas(element);
    const { clientWidth, scrollHeight } = this.domElement;

    this.camera = setCamera(this.camera, clientWidth, scrollHeight);
    this.geometry = setGeometry(clientWidth, scrollHeight, this.config.density);
    this.material = new MeshBasicMaterial({
      wireframe: options.wireframe || false,
    });
    this.mesh = new Mesh(this.geometry, this.material);
    this.scene = new Scene();
    this.scene.add(this.mesh);
    this.renderer = new WebGL1Renderer();
    this.renderer.setSize(clientWidth, scrollHeight);
    this.domElement.appendChild(this.renderer.domElement);
  }

  play() {
    requestAnimationFrame(this.play.bind(this));
    render.call(this);
  }

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
  }

  dispose() {
    this.scene.clear();
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    this.domElement.removeChild(this.renderer.domElement);
  }
}
