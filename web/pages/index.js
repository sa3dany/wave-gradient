import Head from "next/head";
import { useEffect, useRef, useState } from "react";

import Controls from "../components/controls";
import PageHeader from "../components/pagehead";
import CanvasHeader from "../components/canvashead";

export default function DemoPaage() {
  const GRADIENT_COLORS = ["#ef008f", "#6ec3f4", "#7038ff", "#ffba27"];
  const [gradientClass, setGradientClass] = useState({});
  const threeContainer = useRef();
  const [three, setThree] = useState({});
  const [wireframe, setWireframe] = useState(false);
  const [time, setTime] = useState(Math.random() * 1000 * 60 * 60);
  const [isPlaying, setIsPlaying] = useState(true);

  // Load gradient source
  useEffect(() => {
    import("wave-gradients").then(({ WaveGradient }) => {
      setGradientClass({ WaveGradient });
    });
  }, []);

  // Get rid of the three.js warning about multiple instances when
  // developing
  useEffect(() => {
    delete window.__THREE__;
  });

  // three.js gradient init
  useEffect(() => {
    if (!gradientClass.WaveGradient) return;
    const gradient = new gradientClass.WaveGradient(threeContainer.current, {
      colors: GRADIENT_COLORS,
      density: [0.06, 0.16],
      wireframe,
    });
    const onResize = () => {
      gradient.resize();
    };
    gradient.time = time;
    window.addEventListener("resize", onResize);
    setThree(gradient);
    return () => {
      window.removeEventListener("resize", onResize);
      gradient.dispose();
    };
  }, [gradientClass, threeContainer, wireframe, time]);

  useEffect(() => {
    if (three.state) {
      if (isPlaying) {
        three.play();
      } else {
        three.state.playing = isPlaying;
      }
    }
  }, [isPlaying, three]);

  return (
    <Layout>
      <div className="relative z-10 items-end justify-between space-y-6 sm:flex sm:h-24 sm:space-y-0">
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
          usePlay={() => [
            isPlaying,
            () => {
              setIsPlaying(!isPlaying);
            },
          ]}
        />
      </div>

      <div className="absolute inset-0 overflow-y-hidden">
        <canvas ref={threeContainer} />
      </div>
    </Layout>
  );
}
