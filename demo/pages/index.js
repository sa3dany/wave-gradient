import Head from "next/head";
import { useEffect, useRef, useState } from "react";

import Controls from "../components/controls";

// ---------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------

function Layout({ children }) {
  return <div className="relative mx-auto h-full px-5">{children}</div>;
}

function PageHeader({ children }) {
  return (
    <header className="flex-auto self-stretch font-bold leading-none tracking-wider">
      <h1 className="flex h-full max-w-fit select-none items-end rounded-b-3xl bg-gray-900 p-4 font-display text-3xl uppercase text-white dark:bg-gray-50 dark:text-black sm:p-6 sm:text-5xl">
        {children}
      </h1>
    </header>
  );
}

// ---------------------------------------------------------------------
// Page Componenst
// ---------------------------------------------------------------------

export default function DemoPaage() {
  const [waveGradient, setWaveGradient] = useState({
    loaded: false,
    Class: null,
  });

  const [gradient, setGradient] = useState();
  const [time, setTime] = useState(Math.random() * 1000 * 60 * 60);
  const [isPlaying, setIsPlaying] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  const canvas = useRef();

  /**
   * Load the wave gradient library
   */
  useEffect(() => {
    import("wave-gradients").then(({ WaveGradient }) => {
      setWaveGradient({ Class: WaveGradient });
    });
  }, []);

  /**
   * Initialize the gradient
   */
  useEffect(() => {
    if (!waveGradient.Class) {
      return;
    }

    // Get rid of a three.js warning due to HMR during development
    if (process.env.NODE_ENV === "development") {
      delete window.__THREE__;
    }

    const gradient = new waveGradient.Class(canvas.current, {
      colors: ["#9b5de5", "#f15bb5", "#fee440", "#00bbf9", "#00f5d4"],
      density: [0.048, 0.12],
      time,
      wireframe,
    });

    setGradient(gradient);
    isPlaying && gradient.play();

    function resizeGradient() {
      gradient.resize();
    }
    window.addEventListener("resize", resizeGradient);

    return () => {
      window.removeEventListener("resize", resizeGradient);
      gradient.dispose();
    };
  }, [waveGradient.Class, canvas, time, wireframe, isPlaying]);

  return (
    <Layout>
      <div className="absolute inset-0 overflow-hidden">
        <canvas ref={canvas} />
      </div>

      <div className="isolate items-end justify-between space-y-6 mix-blend-normal sm:flex sm:h-24 sm:space-y-0">
        <PageHeader>
          Wave Gradients
          <Head>
            <title>Wave Gradients</title>
          </Head>
        </PageHeader>

        <Controls
          useWireframe={() => [
            wireframe,
            () => {
              setWireframe(!wireframe);
              setTime(gradient.time);
            },
          ]}
          usePlay={() => [
            isPlaying,
            () => {
              setIsPlaying(!isPlaying);
              setTime(gradient.time);
            },
          ]}
        />
      </div>
    </Layout>
  );
}
