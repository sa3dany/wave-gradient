import { useEffect, useState } from "react";

const adjacencyMatrix = [
  "0",
  "65",
  "45",
  "35",
  "65",
  "0",
  "35",
  "65",
  "45",
  "35",
  "0",
  "35",
  "35",
  "65",
  "35",
  "0",
];

/**
 * @see https://huemint.com/about
 * @returns {Promise<Response>}
 */
export function getPalettes() {
  return fetch("https://api.huemint.com/color", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      mode: "transformer",
      num_colors: 4,
      temperature: "1.2", // 0.0 - 2.4
      num_results: 50, // <= 50
      adjacency: adjacencyMatrix,
    }),
  });
}

/**
 * Default color palette.
 *
 * @constant
 * @type {string[]}
 */
const DEFAULT_COLORS = ["#ffffff", "#fe30f8", "#dca6ca", "#58bcfe"];

/**
 * Custom hook for use in react componenets.
 *
 * @returns {object}
 */
export function usePalette() {
  const [colors, setColors] = useState([]);

  // Helpers -----------------------------------------------------------

  const getCache = () => {
    try {
      const palettes = JSON.parse(localStorage.getItem("palettes"));
      return palettes.length ? palettes : null;
    } catch (e) {
      return null;
    }
  };

  const setCache = (palettes) => {
    localStorage.setItem("palettes", JSON.stringify(palettes));
  };

  // Hook --------------------------------------------------------------

  useEffect(() => {
    const cache = getCache();

    if (cache) {
      setColors(cache.pop());
      setCache(cache);
    } else {
      setColors(DEFAULT_COLORS);
      getPalettes()
        .then((res) => {
          if (res.ok) {
            return res.json();
          } else {
            throw new Error("Failed to fetch colors");
          }
        })
        .then(({ results }) => {
          setCache(results.map((p) => p.palette));
        })
        .catch(() => {
          // It's okay if the API is down.
        });
    }
  }, []);

  return colors;
}
