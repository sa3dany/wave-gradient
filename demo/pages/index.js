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
  const [colors, setColors] = useState([
    "#eaab36",
    "#f2d768",
    "#49b3fc",
    "#a1d093",
  ]);

  // Respect `prefers-reduced-motion`
  useEffect(() => {
    const { matches } = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(matches);
  }, []);

  return (
    <Layout>
      <div className="relative -z-50 -mx-5 h-full overflow-hidden">
        {/* Placeholder using static CSS gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <div style={css} className="h-full rotate-1 scale-125 blur-3xl" />
        </div>

        {reducedMotion === false && (
          <WaveGradient
            className="animate-fadein"
            options={{ colors, seed: 2411.5, time: 8000, wireframe: false }}
          />
        )}
      </div>
    </Layout>
  );
}
