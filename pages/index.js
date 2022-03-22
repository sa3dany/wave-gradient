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
      wireframe: true,
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
    <main className="mx-5 mt-10">
      <Head>
        <title>3D Plane Gradients</title>
      </Head>

      <section className="relative mx-auto max-w-screen-lg">
        <canvas
          // data-js-darken-top=""
          id="stripe-canvas"
          ref={canvas_1}
          style={{ height: "calc(50vh - 2.5*1.5rem)" }}
          className="w-full rounded-3xl"
        />
        <canvas
          onClick={() => {
            setWireframeOn(!wireframeOn);
          }}
          id="stripe-canvas-wireframe"
          ref={canvas_2}
          style={{ height: "calc(50vh - 2.5*1.5rem)" }}
          className={`w-full rounded-3xl absolute top-0 ${
            wireframeOn ? "opacity-5" : "opacity-0"
          }`}
        />
      </section>

      <section
        ref={canvas_3}
        className="mx-auto mt-10 max-w-screen-lg rounded-3xl overflow-hidden"
        style={{ height: "calc(50vh - 2.5*1.5rem)" }}
      ></section>
    </main>
  );
}
