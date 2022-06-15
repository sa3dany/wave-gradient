# [![Wave Gradient](art/readme-hero.jpg)](https://wave-gradient.netlify.app/)

[![npm](https://img.shields.io/npm/v/wave-gradient?style=for-the-badge)](https://www.npmjs.com/package/wave-gradient)
[![npm bundle
size](https://img.shields.io/bundlephobia/minzip/wave-gradient?style=for-the-badge)](https://bundlephobia.com/package/wave-gradient)

stripe.com landing page style animated gradients.

## Installation

```shell
npm i wave-gradient
```

## Usage

```js
import { WaveGradient } from "wave-gradient";

const canvasElement = document.querySelector("canvas");

try {
  // Throws if it can't get a WebGL 2.0 context. For example, if the
  // browser does not support it.
  const gradient = new WaveGradient(canvasElement, {
    colors: ["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"],
    fps: 30,
    seed: 0,
    speed: 1.25,
  });
} catch (e) {
  console.error(e);
}
```

### Options

| Option    | Type             | Description                           |
| --------- | ---------------- | ------------------------------------- |
| amplitude | number           | Gradient waves amplitude              |
| colors    | string[]         | Gradient color layers. Limited to 10  |
| density   | [number, number] | Level of detail of the plane geometry |
| fps       | number           | Frames per second for rendering       |
| seed      | number           | Seed for the noise function           |
| speed     | number           | Speed of the gradient waves           |
| time      | number           | Initial time of the animation         |
| wireframe | boolean          | Wireframe render mode                 |

#### amplitude

Default: `320`

#### colors

Default: `["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"]`

#### density

Default: `[0.06, 0.16]`

#### fps

Default: `24`

#### seed

Default: `0`

#### speed

Default: `1.25`

#### time

Default: `0`

#### wireframe

Default: `false`

## Browser Compatibility

[WebGL 2.0 compatible browsers.](https://caniuse.com/webgl2)

## How it works

It's a 3D scene [(not
really)](packages/wave-gradient/src/wave-gradient.js#L89) with a plane
geometry that fills the entire viewport and a
[vertex](packages/wave-gradient/src/shaders/.vert) and
[fragment](packages/wave-gradient/src/shaders/.frag) [shaders
](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/GLSL_Shaders).

![3D plane rotating gif](https://user-images.githubusercontent.com/21214427/160907503-3cdd110c-ff48-4e2f-965c-d2c5bd173051.gif)

## Credits

- [Stripe](https://stripe.com)
- [Kevin
  Hufnagl](https://kevinhufnagl.com/how-to-stripe-website-gradient-effect/)
  for the de-minified code
- Ashima Arts and Stefan Gustavson for the [Simplex noise functions](https://github.com/stegu/webgl-noise)
- Jamie Owen for the GLSL shader [color blending function](https://github.com/jamieowen/glsl-blend)
- [huemint](https://huemint.com) for the demo color palette generation

## References

- Khronos [reference
  card](https://www.khronos.org/files/webgl/webgl-reference-card-1_0.pdf)
- [Working with Simplex
  Noise](https://cmaher.github.io/posts/working-with-simplex-noise) by
  Christian Maher
