import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { StripeGradient } from "../lib/gradient";
import { Gradient } from "../lib/vendor/gradient";

const COLORS = ["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"];

export default function HomePage() {
  const [canvas_1, canvas_2] = [useRef(), useRef()];
  const canvas_3 = useRef();
  const [wireframeOn, setWireframeOn] = useState(true);

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
  }, [canvas_1, canvas_2]);

  // Setup three.js Gradients
  useEffect(() => {
    const gradient = new StripeGradient(canvas_3.current, {
      density: [0.06 / 2, 0.16 / 2],
      wireframe: false,
    });
    const onResize = () => {
      gradient.resize();
    };

    gradient.play();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      gradient.dispose();
    };
  }, []);

  return (
    <main className="mx-5 mb-12">
      <Head>
        <title>3D Animated Gradients</title>
      </Head>

      <header className="mx-auto max-w-screen-lg font-bold leading-none tracking-wider sm:tracking-widest">
        <h1 className="max-w-fit rounded-b-3xl bg-gray-900 px-6 pt-12 pb-6 font-display text-3xl uppercase text-white sm:text-5xl">
          3D Animated Gradients
        </h1>
      </header>

      <section className="relative mx-auto max-w-screen-lg">
        <header className="absolute top-6 left-6 z-10 font-bold">
          <h2 className="text-xl text-white opacity-75 sm:text-3xl">
            Stripe&apos;s Implementation
          </h2>
        </header>
        <div
          className="relative mx-auto mt-6 h-64 max-w-screen-lg overflow-clip rounded-3xl"
          onClick={() => {
            setWireframeOn(!wireframeOn);
          }}
        >
          <canvas
            id="stripe-canvas"
            ref={canvas_1}
            className="block h-full w-full"
          />
          <canvas
            data-js-darken-top=""
            id="stripe-canvas-wireframe"
            ref={canvas_2}
            className={`absolute inset-0 h-full w-full opacity-5 ${
              wireframeOn ? "" : "hidden"
            }`}
          />
        </div>
      </section>

      <section className="relative mx-auto max-w-screen-lg">
        <header className="absolute top-6 left-6 z-10 font-bold">
          <h2 className="text-xl text-white opacity-75 sm:text-3xl">
            Three.js Implementation
          </h2>
        </header>
        <div
          ref={canvas_3}
          className="relative mx-auto mt-6 h-64 max-w-screen-lg overflow-clip rounded-3xl"
        ></div>
      </section>
    </main>
  );
}
