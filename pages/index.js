import Head from "next/head";
import { useEffect, useRef } from "react";
import { Gradient } from "../lib/vendor/gradient";

const COLORS = ["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"];

export default function HomePage() {
  const [canvas_1, canvas_2] = [useRef(), useRef()];

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

  return (
    <main className="mx-5 mt-10">
      <Head>
        <title>3D Plane Gradients</title>
      </Head>

      <section className="relative mx-auto max-w-screen-lg">
        <canvas
          id="stripe-canvas"
          ref={canvas_1}
          data-transition-in
          style={{ height: "calc(50vh - 2.5*1.5rem)" }}
          className="w-full rounded-3xl"
        />
        <canvas
          id="stripe-canvas-wireframe"
          ref={canvas_2}
          data-transition-in
          style={{ height: "calc(50vh - 2.5*1.5rem)" }}
          className="w-full rounded-3xl absolute top-0 opacity-5"
        />
      </section>
    </main>
  );
}
