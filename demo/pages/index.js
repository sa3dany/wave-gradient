/**
 * Demo ppage showcasing the wave gradients.
 */

import { getPlaiceholder } from "plaiceholder";
import { useState } from "react";
import WaveGradientsReact from "../components/gradient";
import Layout from "../components/layout";
import { usePalette } from "../lib/huemint";

export const getStaticProps = async () => {
  const { css } = await getPlaiceholder("/gradient-placeholder.webp", {
    size: 5,
  });

  return {
    props: { css },
  };
};

/**
 * Demo Page
 * @returns {React.ReactElement}
 */
export default function DemoPage({ css }) {
  const colors = usePalette();
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Layout>
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <div
          style={css}
          className="absolute inset-0 h-full w-full rotate-6 scale-150 blur-3xl saturate-150"
        />
        <WaveGradientsReact
          className="animate-fadein"
          options={{
            colors: ["#5a43a8", "#ffc674", "#e7eceb", "#8fb7f3"],
            paused: false,
            seed: 2411.5,
            speed: 1.25,
            time: 1000 * 8,
            wireframe: false,
            onLoad: () => {
              setIsLoaded(true);
            },
          }}
        />
      </div>
    </Layout>
  );
}
