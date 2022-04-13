import Head from "next/head";
import { useEffect, useRef, useState } from "react";

import { WaveGradient } from "wave-gradients";
import { GithubIcon } from "../components/icons";
import { usePalette } from "../lib/huemint";

// ---------------------------------------------------------------------
// Page components
// ---------------------------------------------------------------------

function Layout({ children }) {
  return (
    <div className="relative mx-auto h-full px-5">
      <Head>
        <title>Wave Gradients</title>
      </Head>

      {/* Navigation */}
      <nav className="container relative z-10 mx-auto flex items-center justify-between pt-5 text-white mix-blend-overlay">
        {/* Logo */}
        <header className="select-none">
          <h1 className="font-display text-3xl font-bold uppercase leading-none tracking-wider lg:text-4xl">
            Wave Gradients
          </h1>
        </header>
        {/* Github repo link */}
        <a href="https://github.com/sa3dany/wave-gradients">
          <span className="sr-only">GitHub repo</span>
          <GithubIcon className="h-8 w-8 lg:h-10 lg:w-10" />
        </a>
      </nav>

      {/* Page */}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------

export default function DemoPaage() {
  const [gradient, setGradient] = useState();
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  const canvas = useRef();

  const colors = usePalette();

  useEffect(() => {
    if (!colors) {
      return;
    }

    // Get rid of a three.js warning due to HMR during development
    if (process.env.NODE_ENV === "development") {
      delete window.__THREE__;
    }

    const gradient = new WaveGradient(canvas.current, {
      colors,
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
  }, [colors, canvas, time, wireframe, isPlaying]);

  return (
    <Layout>
      <div className="absolute inset-0 overflow-hidden">
        <canvas ref={canvas} />
      </div>
    </Layout>
  );
}
