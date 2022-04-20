/**
 * Demo ppage showcasing the wave gradients.
 */

import WaveGradientsReact from "../components/gradient";
import Layout from "../components/layout";
import { usePalette } from "../lib/huemint";

/**
 * Demo Page
 * @returns {React.ReactElement}
 */
export default function DemoPage() {
  const colors = usePalette();

  return (
    <Layout>
      <div className="absolute inset-0 -z-10">
        <WaveGradientsReact
          colors={colors}
          density={[0.048, 0.12]}
          paused={false}
          seed={Math.random() * 100}
          time={0}
          wireframe={false}
        />
      </div>
    </Layout>
  );
}
