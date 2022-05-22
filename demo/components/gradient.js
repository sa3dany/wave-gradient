/**
 * React component for the wave gradients.
 */

import { useEffect, useRef, useState } from "react";
import { WaveGradient } from "wave-gradient";
// import glsllint from "../lib/glsllint";

/**
 * WaveGradeints react component.
 * @param {object} props Gradient options
 * @returns {React.ReactElement}
 */
export default function WaveGradientsReact(props) {
  // Used to hold a refernce to the canvas HTML element
  const canvasElement = useRef();

  // Destructure the props
  const { colors, seed, speed, time, wireframe, ...rest } = props;

  // useEffect(() => {
  //   glsllint();
  // }, []);

  /**
   * Initializes the wave gradients object.
   */
  useEffect(() => {
    const gradient = new WaveGradient(canvasElement.current, {
      colors,
      seed,
      speed,
      time,
      wireframe,
    });

    return () => {
      gradient.destroy();
    };
  }, [canvasElement, colors, seed, speed, time, wireframe]);

  return (
    <canvas
      ref={canvasElement}
      style={{ width: "100%", height: "100%" }}
      {...rest}
    />
  );
}
