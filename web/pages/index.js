import Head from "next/head";
import { useEffect, useRef, useState } from "react";

import { StripeGradient, WaveGradient } from "wave-gradients";
import Controls from "../components/controls";
import PageHeader from "../components/pagehead";
import CanvasHeader from "../components/canvashead";

const GRADIENT_COLORS = ["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"];

export default function HomePage() {
  const [stripeContainer, threeContainer] = [useRef(), useRef()];
  const [three, setThree] = useState({});
  const [wireframe, setWireframe] = useState(false);
  const [time, setTime] = useState(Math.random() * 1000 * 60 * 60);

  // Get rid of the three.js warning about multiple instances when
  // developing
  useEffect(() => {
    delete window.__THREE__;
  });

  // Stripe gradient init
  useEffect(() => {
    const gradient = new StripeGradient({ wireframe });
    gradient.t = time;
    gradient.initGradient("#stripe-canvas");
    GRADIENT_COLORS.forEach((hex, i) => {
      stripeContainer.current.style.setProperty(
        `--gradient-color-${i + 1}`,
        hex
      );
    });
    return () => {
      gradient.disconnect();
    };
  }, [stripeContainer, wireframe, time]);

  // three.js gradient init
  useEffect(() => {
    const gradient = new WaveGradient(threeContainer.current, {
      colors: GRADIENT_COLORS,
      density: [0.06, 0.16],
      wireframe,
    });
    const onResize = () => {
      gradient.resize();
    };
    gradient.time = time;
    gradient.play();
    window.addEventListener("resize", onResize);
    setThree(gradient);
    return () => {
      window.removeEventListener("resize", onResize);
      gradient.dispose();
    };
  }, [threeContainer, wireframe, time]);

  return (
    <main className="mx-auto mb-6 max-w-screen-lg px-5">
      <div className="flex items-end justify-between">
        <PageHeader className="sm:flex-1">
          Wave Gradient
          <Head>
            <title>Wave Gradient</title>
          </Head>
        </PageHeader>

        <Controls
          useWireframe={() => [
            wireframe,
            () => {
              setWireframe(!wireframe);
              setTime(three.time);
            },
          ]}
        />
      </div>

      <section className="relative mt-6">
        <CanvasHeader>stripe&apos;s Implementation</CanvasHeader>
        <div className="h-64 overflow-clip rounded-3xl border-4 border-black dark:border-white md:h-80">
          <canvas
            id="stripe-canvas"
            ref={stripeContainer}
            className="block h-full w-full"
          />
        </div>
      </section>

      <section className="relative mt-6">
        <CanvasHeader>three.js Implementation</CanvasHeader>
        <div className="h-64 overflow-clip rounded-3xl border-4 border-black dark:border-white md:h-80">
          <canvas ref={threeContainer} />
        </div>
      </section>
    </main>
  );
}
