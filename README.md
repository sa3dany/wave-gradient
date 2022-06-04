# ![Wave Gradient](art/readme-hero.jpg)

![npm](https://img.shields.io/npm/v/wave-gradient?style=for-the-badge)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/wave-gradient?style=for-the-badge)

stripe.com landing page style animated gradients.

## Usage

```shell
npm i wave-gradient
```

## How it works

It's a 3D scene (not really!) with a plane geometry that fills the
entire viewport and a [vertex](packages/wave-gradient/src/shaders/.vert)
and [fragment](packages/wave-gradient/src/shaders/.frag) [shaders
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
