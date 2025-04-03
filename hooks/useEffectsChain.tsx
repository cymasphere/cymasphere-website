"use client";

import { useState, useEffect } from "react";
import * as Tone from "tone";
import {
  initializeEffectsChain,
  disposeEffectsChain,
} from "../utils/effectsUtils";

/**
 * Custom hook for initializing and managing the effects chain
 * @returns {Object} The effects chain object
 */
const useEffectsChain = () => {
  const [effectsChain, setEffectsChain] = useState(null);

  useEffect(() => {
    // Initialize effects chain
    const initEffects = async () => {
      try {
        // Pass the Tone library to the initializeEffectsChain function
        const effects = await initializeEffectsChain({}, Tone);
        console.log("Effects chain initialized:", effects);
        setEffectsChain(effects);
      } catch (error) {
        console.error("Error initializing effects chain:", error);
      }
    };

    initEffects();

    // Clean up on unmount
    return () => {
      if (effectsChain) {
        disposeEffectsChain(effectsChain);
      }
    };
  }, []);

  return effectsChain;
};

export default useEffectsChain;
