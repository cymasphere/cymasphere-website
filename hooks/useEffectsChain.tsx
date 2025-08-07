"use client";

import { useState, useEffect } from "react";
import * as Tone from "tone";
import {
  initializeEffectsChain,
  disposeEffectsChain,
  EffectsChain,
} from "@/utils/effectsUtils";

/**
 * Custom hook for initializing and managing the effects chain
 * @returns {EffectsChain | null} The effects chain object or null if not initialized
 */
const useEffectsChain = (): EffectsChain | null => {
  const [effectsChain, setEffectsChain] = useState<EffectsChain | null>(null);

  useEffect(() => {
    let initializedChain: EffectsChain | null = null;

    // Initialize effects chain only once on mount and only on client side
    const initEffects = async () => {
      // Only initialize on client side
      if (typeof window === 'undefined') return;
      
      try {
        const effects = await initializeEffectsChain(Tone);
        console.log("Effects chain initialized successfully.");
        initializedChain = effects; // Store in local variable for cleanup
        setEffectsChain(effects);
      } catch (error) {
        console.error("Error initializing effects chain:", error);
      }
    };

    initEffects();

    // Clean up the specific initialized chain on unmount
    return () => {
      if (initializedChain) {
        disposeEffectsChain(initializedChain);
        console.log("Effects chain disposed on unmount.");
      }
    };
    // Empty dependency array ensures this effect runs only once on mount
  }, []);

  return effectsChain;
};

export default useEffectsChain;
