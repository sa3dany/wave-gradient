import { MiniGl } from "./minigl";
import { normalizeColor } from "./utils";
import {
  blendShader,
  fragmentShader,
  noiseShader,
  vertexShader,
} from "./shaders";

export class Gradient {
  constructor({ wireframe = false } = {}) {
    this.conf = {
      density: [0.06 / 2, 0.16 / 2],
      wireframe,
    };

    this.computedCanvasStyle = undefined;
    this.el = undefined;
    this.geometry = undefined;
    this.height = undefined;
    this.material = undefined;
    this.mesh = undefined;
    this.minigl = undefined;
    this.sectionColors = undefined;
    this.shaderFiles = undefined;
    this.uniforms = undefined;
    this.vertexShader = undefined;
    this.width = undefined;
    this.xSegCount = undefined;
    this.ySegCount = undefined;

    this.activeColors = [1, 1, 1, 1];
    this.amp = 320;
    this.angle = 0;
    this.cssVarRetries = 0;
    this.disconnected = false;
    this.freqX = 14e-5;
    this.freqY = 29e-5;
    this.last = 0;
    this.maxCssVarRetries = 200;
    this.seed = 5;
    this.t = 1253106;
  }

  resize() {
    this.width = this.el.scrollWidth;
    this.height = this.el.scrollHeight;
    this.minigl.setSize(this.width, this.height);
    this.minigl.setOrthographicCamera();
    this.xSegCount = Math.ceil(this.width * this.conf.density[0]);
    this.ySegCount = Math.ceil(this.height * this.conf.density[1]);
    this.mesh.geometry.setTopology(this.xSegCount, this.ySegCount);
    this.mesh.geometry.setSize(this.width, this.height);
    this.mesh.material.uniforms.u_shadow_power.value = this.width < 600 ? 5 : 6;
  }

  animate(e) {
    if (!this.disconnected) {
      if (!this.shouldSkipFrame(e)) {
        if (
          ((this.t += Math.min(e - this.last, 1e3 / 15)),
          (this.last = e),
          false)
        ) {
          let e = 160;
          this.t += e;
        }
        this.mesh.material.uniforms.u_time.value = this.t;
        this.minigl.render();
      }

      requestAnimationFrame(this.animate.bind(this));
    }
  }

  initGradient(selector) {
    this.el = document.querySelector(selector);
    this.connect();
    return this;
  }

  connect() {
    this.shaderFiles = {
      vertex: vertexShader,
      noise: noiseShader,
      blend: blendShader,
      fragment: fragmentShader,
    };

    if (document.querySelectorAll("canvas").length) {
      this.minigl = new MiniGl(this.el, null, null, true, this.conf.wireframe);
      requestAnimationFrame(() => {
        if (this.el) {
          this.computedCanvasStyle = getComputedStyle(this.el);
          this.waitForCssVars();
        }
      });
    }
  }

  disconnect() {
    this.disconnected = true;
    window.removeEventListener("resize", () => {
      this.resize();
    });
  }

  initMaterial() {
    this.uniforms = {
      u_time: new this.minigl.Uniform({
        value: 0,
      }),
      u_shadow_power: new this.minigl.Uniform({
        value: 5,
      }),
      u_darken_top: new this.minigl.Uniform({
        value: "" === this.el.dataset.jsDarkenTop ? 1 : 0,
      }),
      u_active_colors: new this.minigl.Uniform({
        value: this.activeColors,
        type: "vec4",
      }),
      u_global: new this.minigl.Uniform({
        value: {
          noiseFreq: new this.minigl.Uniform({
            value: [this.freqX, this.freqY],
            type: "vec2",
          }),
          noiseSpeed: new this.minigl.Uniform({
            value: 5e-6,
          }),
        },
        type: "struct",
      }),
      u_vertDeform: new this.minigl.Uniform({
        value: {
          incline: new this.minigl.Uniform({
            value: Math.sin(this.angle) / Math.cos(this.angle),
          }),
          offsetTop: new this.minigl.Uniform({
            value: -0.5,
          }),
          offsetBottom: new this.minigl.Uniform({
            value: -0.5,
          }),
          noiseFreq: new this.minigl.Uniform({
            value: [3, 4],
            type: "vec2",
          }),
          noiseAmp: new this.minigl.Uniform({
            value: this.amp,
          }),
          noiseSpeed: new this.minigl.Uniform({
            value: 10,
          }),
          noiseFlow: new this.minigl.Uniform({
            value: 3,
          }),
          noiseSeed: new this.minigl.Uniform({
            value: this.seed,
          }),
        },
        type: "struct",
        excludeFrom: "fragment",
      }),
      u_baseColor: new this.minigl.Uniform({
        value: this.sectionColors[0],
        type: "vec3",
        excludeFrom: "fragment",
      }),
      u_waveLayers: new this.minigl.Uniform({
        value: [],
        excludeFrom: "fragment",
        type: "array",
      }),
    };
    for (let e = 1; e < this.sectionColors.length; e += 1)
      this.uniforms.u_waveLayers.value.push(
        new this.minigl.Uniform({
          value: {
            color: new this.minigl.Uniform({
              value: this.sectionColors[e],
              type: "vec3",
            }),
            noiseFreq: new this.minigl.Uniform({
              value: [
                2 + e / this.sectionColors.length,
                3 + e / this.sectionColors.length,
              ],
              type: "vec2",
            }),
            noiseSpeed: new this.minigl.Uniform({
              value: 11 + 0.3 * e,
            }),
            noiseFlow: new this.minigl.Uniform({
              value: 6.5 + 0.3 * e,
            }),
            noiseSeed: new this.minigl.Uniform({
              value: this.seed + 10 * e,
            }),
            noiseFloor: new this.minigl.Uniform({
              value: 0.1,
            }),
            noiseCeil: new this.minigl.Uniform({
              value: 0.63 + 0.07 * e,
            }),
          },
          type: "struct",
        })
      );
    return (
      (this.vertexShader = [
        this.shaderFiles.noise,
        this.shaderFiles.blend,
        this.shaderFiles.vertex,
      ].join("\n\n")),
      new this.minigl.Material(
        this.vertexShader,
        this.shaderFiles.fragment,
        this.uniforms
      )
    );
  }

  initMesh() {
    this.material = this.initMaterial();
    this.geometry = new this.minigl.PlaneGeometry();
    this.mesh = new this.minigl.Mesh(this.geometry, this.material);
  }

  shouldSkipFrame(e) {
    return !!window.document.hidden || parseInt(e, 10) % 2 == 0;
  }

  updateFrequency(e) {
    this.freqX += e;
    this.freqY += e;
  }

  toggleColor(index) {
    this.activeColors[index] = 0 === this.activeColors[index] ? 1 : 0;
  }

  init() {
    this.initGradientColors();
    this.initMesh();
    this.resize();
    requestAnimationFrame(this.animate.bind(this));
    window.addEventListener("resize", () => {
      this.resize();
    });
  }

  waitForCssVars() {
    if (
      this.computedCanvasStyle &&
      -1 !==
        this.computedCanvasStyle
          .getPropertyValue("--gradient-color-1")
          .indexOf("#")
    )
      this.init();
    else {
      if (
        ((this.cssVarRetries += 1), this.cssVarRetries > this.maxCssVarRetries)
      ) {
        return (
          (this.sectionColors = [16711680, 16711680, 16711935, 65280, 255]),
          void this.init()
        );
      }
      requestAnimationFrame(() => this.waitForCssVars());
    }
  }

  initGradientColors() {
    this.sectionColors = [
      "--gradient-color-1",
      "--gradient-color-2",
      "--gradient-color-3",
      "--gradient-color-4",
    ]
      .map((cssPropertyName) => {
        let hex = this.computedCanvasStyle
          .getPropertyValue(cssPropertyName)
          .trim();
        if (4 === hex.length) {
          const hexTemp = hex
            .substr(1)
            .split("")
            .map((hexTemp) => hexTemp + hexTemp)
            .join("");
          hex = `#${hexTemp}`;
        }
        return hex && `0x${hex.substr(1)}`;
      })
      .filter(Boolean)
      .map(normalizeColor);
  }
}
