# ![Wave Gradients](art/readme-hero.jpg)

I really liked the effect of the animated gradients on the
[stripe.com](https://stripe.com) home page and was curious of how it was
crated. Turns out it is more complex that it seems at first.

## It's not actually 2D at all

The first thing that came to mind when I saw the gradients was that they
were simply using a canvas surface for drawing and animating a bunch of
different gradients. Turns out it's actually a 3D scene rendered with
OpenGL that uses an [orthographic
camera](https://en.wikipedia.org/wiki/Orthographic_projection), a plane
mesh and
[two](https://github.com/sa3dany/stripe-gradients/blob/main/lib/vendor/shaders/vertex.js)
[kinds](https://github.com/sa3dany/stripe-gradients/blob/main/lib/vendor/shaders/fragment.js)
of [GLSL
shaders](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/GLSL_Shaders).

## What is this repo about?

As a first step, I am working on recreating the gradient effect in
[three.js](https://threejs.org), a popular 3D graphics library for the
web. Next, I will publish the effect as a library which can then be added
to npm. Finally, I will try to optimize the code to make it as
lightweight as possible (size-wise). This might involve dropping
three.js and reimplementing the effect in a more lightweight graphics
library. The reason I choose three.js as a starting point is because it
abstracts away a lot of the details of the underlying openGL code and
will make this project easier to implement for a beginner in 3D graphics
like me.

## Todo

- [x] Port code to three.js.
- [x] Get the thee.js gradient working.
- [x] Make the gradient to behave exaclty the same as the stripe gradient
- [ ] Recreate the neccessary vertex and fragment shader from scratch
  (excluding the external noise & blend functions which I will keep
  and which are apropriatly attributed) so that I am not just coping
  stripe's code.
- [ ] Add control to add/edit colors, config, etc. for the gradient
  instance.
- [ ] Compare bundle size with the original stripe gradient.

## Credits

- [Stripe](https://stripe.com)
- [Kevin
  Hufnagl](https://kevinhufnagl.com/how-to-stripe-website-gradient-effect/)
  for the de-minified code
