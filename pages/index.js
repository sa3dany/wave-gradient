import Head from "next/head";
import { useEffect, useRef } from "react";
import { Gradient } from "../lib/vendor/gradient";

import {
  Scene,
  PerspectiveCamera,
  WebGL1Renderer,
  BoxGeometry,
  MeshBasicMaterial,
  Mesh,
} from "three";
import { PlaneGeometry } from "three";
import { OrthographicCamera } from "three";

const COLORS = ["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"];

export default function HomePage() {
  const [canvas_1, canvas_2] = [useRef(), useRef()];
  const canvas_3 = useRef();

  // Setup Stripe gradienats
  useEffect(() => {
    const gradient_1 = new Gradient().initGradient("#stripe-canvas");
    COLORS.forEach((hex, i) => {
      canvas_1.current.style.setProperty(`--gradient-color-${i + 1}`, hex);
    });
    const gradient_2 = new Gradient({ wireframe: true }).initGradient(
      "#stripe-canvas-wireframe"
    );
    ["#000", "#000"].forEach((hex, i) => {
      canvas_2.current.style.setProperty(`--gradient-color-${i + 1}`, hex);
    });
    return () => {
      gradient_1.disconnect();
      gradient_2.disconnect();
    };
  });

  // Setup three.js Gradients
  useEffect(() => {
    const conf = {
      density: [0.06 / 2, 0.16 / 2],
    };

    const renderNode = canvas_3.current;
    const sizingNode = canvas_3.current.parentNode;

    const { clientWidth: width, scrollHeight: height } = sizingNode;
    const aspect = height / width;

    const scene = new Scene();
    const orthoCamera = new OrthographicCamera(
      (aspect * width) / -0.88,
      (aspect * width) / 0.88,
      height / 2,
      height / -2,
      -2e3,
      2e3
    );

    const renderer = new WebGL1Renderer({ canvas: renderNode });
    renderer.setSize(width, height);

    const onResize = () => {
      const sizingNode = canvas_3.current.parentNode;
      const { clientWidth: width, scrollHeight: height } = sizingNode;
      const aspect = height / width;
      orthoCamera.left = (aspect * width) / -0.88;
      orthoCamera.right = (aspect * width) / 0.88;
      orthoCamera.top = height / 2;
      orthoCamera.bottom = height / -2;
      orthoCamera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", onResize);

    const geometry = new PlaneGeometry(
      width,
      height,
      width * conf.density[0],
      height * conf.density[1]
    );
    const material = new MeshBasicMaterial({
      color: 0xffffff,
      wireframe: true,
    });
    const plane = new Mesh(geometry, material);
    scene.add(plane);

    function animate() {
      const sizingNode = canvas_3.current.parentNode;
      const { clientWidth: width, scrollHeight: height } = sizingNode;
      requestAnimationFrame(animate);
      renderer.render(scene, orthoCamera);
    }

    animate();

    return () => {
      window.removeEventListener("resize", onResize);
      renderer.dispose(), geometry.dispose(), material.dispose();
    };
  });

  return (
    <main className="mx-5 mt-10">
      <Head>
        <title>3D Plane Gradients</title>
      </Head>

      <section className="relative mx-auto max-w-screen-lg">
        <canvas
          id="stripe-canvas"
          ref={canvas_1}
          style={{ height: "calc(50vh - 2.5*1.5rem)" }}
          className="w-full rounded-3xl"
        />
        <canvas
          id="stripe-canvas-wireframe"
          ref={canvas_2}
          style={{ height: "calc(50vh - 2.5*1.5rem)" }}
          className="w-full rounded-3xl absolute top-0 opacity-5"
        />
      </section>

      <section className="mx-auto mt-10 max-w-screen-lg">
        <canvas
          id="three-canvas"
          ref={canvas_3}
          style={{ height: "calc(50vh - 2.5*1.5rem)" }}
          className="w-full rounded-3xl"
        />
      </section>
    </main>
  );
}
