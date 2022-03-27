import Head from "next/head";
import { Switch } from "@headlessui/react";
import { useEffect, useRef, useState } from "react";

import { StripeGradient, WaveGradient } from "wave-gradients";

const GRADIENT_COLORS = ["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"];

export default function HomePage() {
  const [stripeContainer, threeContainer] = [useRef(), useRef()];
  const [three, setThree] = useState({});
  const [wireframe, setWireframe] = useState(false);
  const [time, setTime] = useState(Math.random() * 1000 * 60 * 60);

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
      <PageHeader>
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

function PageHeader({ children }) {
  return (
    <header className="font-bold leading-none tracking-wider">
      <h1 className="max-w-fit select-none rounded-b-3xl bg-gray-900 px-6 py-6 font-display text-3xl uppercase text-white dark:bg-gray-50 dark:text-black sm:text-5xl">
        {children}
      </h1>
    </header>
  );
}

function CanvasHeader({ children }) {
  return (
    <header className="absolute top-6 left-6 z-10 font-bold mix-blend-exclusion">
      <h2 className="select-none text-xl text-white md:text-3xl">{children}</h2>
    </header>
  );
}

function Controls({ useWireframe }) {
  const [wireframe, onToggleWireframe] = useWireframe();

  return (
    <section className="mt-6 max-w-fit rounded-3xl border-4 border-gray-900 p-6 dark:border-white">
      <Switch.Group className="flex select-none space-x-3" as="div">
        <Switch.Label className="font-bold uppercase">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
            className="h-6 w-6"
            fill="currentColor"
          >
            <path d="M448 32C483.3 32 512 60.65 512 96V416C512 451.3 483.3 480 448 480H64C28.65 480 0 451.3 0 416V96C0 60.65 28.65 32 64 32H448zM152 96H64V160H152V96zM208 160H296V96H208V160zM448 96H360V160H448V96zM64 288H152V224H64V288zM296 224H208V288H296V224zM360 288H448V224H360V288zM152 352H64V416H152V352zM208 416H296V352H208V416zM448 352H360V416H448V352z" />
          </svg>
        </Switch.Label>
        <Switch
          checked={wireframe}
          onChange={onToggleWireframe}
          className={`${
            wireframe ? "bg-red-600" : "bg-black dark:bg-white"
          } relative inline-flex h-6 w-11 items-center rounded-full`}
        >
          <span className="sr-only">Enable wireframe render mode</span>
          <span
            className={`${
              wireframe ? "translate-x-6" : "translate-x-1"
            } inline-block h-4 w-4 transform rounded-full bg-white dark:bg-black`}
          />
        </Switch>
      </Switch.Group>
    </section>
  );
}
