/**
 * @fileoverview Custom hook for initializing and managing audio effects chain.
 * @module hooks/useEffectsChain
 * @description Provides Tone.js effects chain initialization and cleanup.
 * Automatically initializes effects on mount and disposes them on unmount.
 */

"use client";

import { useState, useEffect } from "react";
import * as Tone from "tone";
import {
  initializeEffectsChain,
  disposeEffectsChain,
  EffectsChain,
} from "@/utils/effectsUtils";

/**
 * @brief Custom hook for initializing and managing the effects chain.
 * @description Initializes the audio effects chain (reverb, delay, chorus, etc.)
 * on component mount and automatically disposes it on unmount to prevent memory leaks.
 * @returns {EffectsChain | null} The effects chain object or null if not initialized.
 * @note Effects chain is initialized asynchronously and may be null initially.
 * @note Automatically cleans up effects chain on component unmount.
 * @example
 * const effectsChain = useEffectsChain();
 * if (effectsChain) {
 *   effectsChain.reverb.set({ wet: 0.5 });
 * }
 */
const useEffectsChain = (): EffectsChain | null => {
  const [effectsChain, setEffectsChain] = useState<EffectsChain | null>(null);

  useEffect(() => {
    let initializedChain: EffectsChain | null = null;

    // Initialize effects chain only once on mount
    const initEffects = async () => {
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
