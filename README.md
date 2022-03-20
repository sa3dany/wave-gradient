# Learning about the stripe landing page animated gradients

![An image showing a static
gradient](https://raw.githubusercontent.com/sa3dany/stripe-gradients/main/public/github-readme-hero.webp)

I really liked the effect of the animated gradients on the stipe.com
home page and was curious of how it was crated. Turns out it is more
complex that it seems at first.

## It's not actually 2D at all

The first thing that came to mind when I saw the gradients was that they
were simply using a canvas surface for drawing and animating a bunch of
different gradients. Turns out it's actually a 3D scene rendered with
OpenGL that uses an [orthographic
camera](https://en.wikipedia.org/wiki/Orthographic_projection), a plane
mesh and
[two](https://github.com/sa3dany/stripe-gradients/blob/main/lib/vendor/shaders/vertex.js)
[kinds](https://github.com/sa3dany/stripe-gradients/blob/main/lib/vendor/shaders/fragment.js)
[of](https://github.com/sa3dany/stripe-gradients/blob/main/lib/vendor/shaders/noise.js)
[GLSL
shaders](https://developer.mozilla.org/en-US/docs/Games/Techniques/3D_on_the_web/GLSL_Shaders).
