/**
 * Demo ppage showcasing the wave gradients.
 */

import dynamic from "next/dynamic";
import { getPlaiceholder } from "plaiceholder";
import { useEffect, useState } from "react";
import Layout from "../components/layout";
import { usePalette } from "../lib/huemint";

const WaveGradient = dynamic(() => import("../components/gradient"));

/**
 * Prepares the CSS for the placeholder
 * @returns {object}
 */
export const getStaticProps = async () => {
  const { css } = await getPlaiceholder("/gradient-placeholder.webp", {
    size: 8,
  });
  return { props: { css } };
};

/**
 * Demo Page
 * @returns {React.ReactElement}
 */
export default function DemoPage({ css }) {
  const palette = usePalette();

  const [reducedMotion, setReducedMotion] = useState();
  const [colors, setColors] = useState(["#5a43a8", "#ffc674", "#8fb7f3"]);

  // Respect `prefers-reduced-motion`
  useEffect(() => {
    const { matches } = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(matches);
  }, []);

  return (
    <Layout>
      <div className="relative -z-50 -mx-5 h-1/2 overflow-hidden">
        {/* Placeholder using static CSS gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            style={css}
            className="h-full rotate-6 scale-150 blur-3xl saturate-150"
          />
        </div>

        {reducedMotion === false && (
          <WaveGradient
            className="animate-fadein will-change-transform"
            // --
            colors={colors}
            seed={2411.5}
            time={8000}
            wireframe={false}
          />
        )}
      </div>
    </Layout>
  );
}
