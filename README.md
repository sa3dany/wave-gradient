# Learning about the stripe landing page animated gradients

![An image showing a static
gradient](https://raw.githubusercontent.com/sa3dany/stripe-gradients/main/public/github-readme-hero.webp)

I really liked the effect of the animated gradients on the [stripe.com](https://stripe.com)
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

## What is this repo about?

As a first step, I am working on recreating the gradient effect in [three.js](https://threejs.org), a popular 3D graphics library for the web.
Next, I will release the effect as library which can then be added to npm.
Finally, I will try to optimize the code to make it as lightweight as possible (size-wise). This might involve dropping three.js and reimplementing the effect in a more lightweight graphics library.
The reason I choose three.js as a starting point is because it abstracts away a lot of the details of the underlying openGL code and will make this project easier to implement for a beginner in 3D graphics like me.
