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
 * Validates that an element or an css selector is or returns a canvas
 * element
 * @param {string|HTMLElement} input
 * @returns {HTMLElement} HTML canvas element
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
    const aspect = scrollHeight / clientWidth;

    this.camera = new OrthographicCamera(
      (aspect * clientWidth) / -0.88,
      (aspect * clientWidth) / 0.88,
      scrollHeight / 2,
      scrollHeight / -2,
      0,
      1
    );

    this.geometry = new PlaneGeometry(
      clientWidth,
      scrollHeight,
      this.config.density[0] * clientWidth,
      this.config.density[1] * scrollHeight
    );

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
    const aspect = scrollHeight / clientWidth;

    this.camera.left = (aspect * clientWidth) / -0.88;
    this.camera.right = (aspect * clientWidth) / 0.88;
    this.camera.top = scrollHeight / 2;
    this.camera.bottom = scrollHeight / -2;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(clientWidth, scrollHeight);
  }

  dispose() {
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    this.domElement.removeChild(this.renderer.domElement);
  }
}
