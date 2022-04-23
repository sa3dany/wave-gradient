/**
 * React component for the wave gradients.
 */

import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { WaveGradient } from "wave-gradients";

/**
 * WaveGradeints react component.
 * @param {object} props Gradient options
 * @returns {React.ReactElement}
 */
export default function WaveGradientsReact(props) {
  // Used to hold a refernce to the canvas HTML element
  const canvasElement = useRef();

  // Holds the active instance of the wave gradients object
  const [currentGradient, setCurrentGradient] = useState();

  /**
   * Initializes the wave gradients object.
   */
  useEffect(() => {
    const gradient = new WaveGradient(canvasElement.current, props);

    if (!props.paused) {
      // Start animating the gradient
      gradient.play();
    }

    // Register the resize event handler
    const onResize = debounce(gradient.resize.bind(gradient), 50);
    window.addEventListener("resize", onResize);

    // Store active gradeint instance
    setCurrentGradient(gradient);

    // hook cleanup funnction
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [canvasElement, props]);

  // The target canvas element
  return (
    <canvas ref={canvasElement} style={{ width: "100%", height: "100%" }} />
  );
}
