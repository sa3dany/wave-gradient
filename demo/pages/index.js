/**
 * Demo ppage showcasing the wave gradients.
 */

import { Transition } from "@headlessui/react";
import { getPlaiceholder } from "plaiceholder";
import { useState } from "react";
import WaveGradientsReact from "../components/gradient";
import Layout from "../components/layout";
import { usePalette } from "../lib/huemint";

export const getStaticProps = async () => {
  const { css } = await getPlaiceholder("/gradient-placeholder.webp", {
    size: 16,
  });

  return {
    props: { css },
  };
};

/**
 * Demo Page
 * @returns {React.ReactElement}
 */
export default function DemoPage({ img, css }) {
  const colors = usePalette();
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <Layout>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Placeholder */}
        <Transition
          show={!isLoaded}
          leave="transition-opacity duration-[3000ms] ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          className="saturate-125 absolute inset-0 h-full w-full scale-150 blur-2xl"
          style={css}
        >
          Hello
        </Transition>

        {/* Real gradient */}
        <WaveGradientsReact
          colors={["#5a43a8", "#ffc674", "#e7eceb", "#8fb7f3"]}
          paused={false}
          onLoad={() => {
            setIsLoaded(true);
          }}
          seed={2411.5}
          speed={1.25}
          time={1000 * 8}
          wireframe={false}
        />
      </div>
    </Layout>
  );
}
