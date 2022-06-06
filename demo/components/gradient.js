import { useEffect, useRef, useState } from "react";
import { WaveGradient } from "wave-gradient";

/**
 * Wave Gradient react component.
 * @param {object} props Gradient options
 * @returns {React.ReactElement}
 */
export default function WaveGradientsReact(props) {
  // Used to hold a reference to the canvas HTML element
  const canvasElement = useRef();

  // Destructure the props
  const { options, ...rest } = props;

  /**
   * Initializes the wave gradients object.
   */
  useEffect(() => {
    const gradient = new WaveGradient(canvasElement.current, options);

    return () => {
      gradient.destroy();
    };
  }, [canvasElement, options]);

  return (
    <canvas
      ref={canvasElement}
      style={{ width: "100%", height: "100%" }}
      {...rest}
    />
  );
}
