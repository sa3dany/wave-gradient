import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { WaveGradient } from "wave-gradients";
import Layout from "../components/layout";
import { usePalette } from "../lib/huemint";

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

    const resizeGradient = debounce(
      () => {
        gradient.resize();
      },
      128,
      { trailing: true }
    );
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
