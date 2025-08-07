/**
 * Utility functions for audio effects management
 */
import * as Tone from "tone";
import { DisposableSynth } from "./synthUtils";

// Define the type for the effects chain object
export interface EffectsChain {
  reverb: Tone.Reverb;
  compressor: Tone.Compressor;
  limiter: Tone.Limiter;
  chorus: Tone.Chorus;
  delay: Tone.PingPongDelay;
  stereoWidener: Tone.StereoWidener;
  softClipper: Tone.Distortion;
  masterVolume: Tone.Volume;
  getEffect: (
    name: keyof Omit<EffectsChain, "getEffect">
  ) => Tone.ToneAudioNode | undefined;
}

/**
 * Initializes a complete effects chain for audio processing
 * @param {typeof Tone | null} toneLib - The Tone.js library object instance
 * @param {DisposableSynth} synth - Optional synth to connect to the effects chain
 * @returns {Promise<EffectsChain>} Promise resolving to the effects chain object
 */
export const initializeEffectsChain = async (
  toneLib: typeof Tone | null = null,
  synth: DisposableSynth = null
): Promise<EffectsChain> => {
  // Use imported Tone library instance or throw an error if not provided
  if (!toneLib) {
    throw new Error("Tone library must be passed as a parameter");
  }

  // Check and start AudioContext if needed
  if (toneLib.context.state !== "running") {
    try {
      console.log("Starting Tone.js AudioContext...");
      await toneLib.start();
      console.log("Tone.js AudioContext started successfully");
    } catch (error) {
      console.warn("Failed to start Tone.js AudioContext:", error);
      // Continue anyway - the context might start later with user interaction
    }
  }

  // Create a master volume control at the end of the chain
  const masterVolume = new toneLib.Volume(-6).toDestination();

  // Master effects chain with stronger limiting to prevent distortion
  const masterLimiter = new toneLib.Limiter(-4).connect(masterVolume);

  const masterCompressor = new toneLib.Compressor({
    ratio: 4, // Less aggressive ratio
    threshold: -24,
    release: 0.25,
    attack: 0.03,
    knee: 10,
  }).connect(masterLimiter);

  // Add a soft clipper before the compressor for smoother saturation instead of hard clipping
  const softClipper = new toneLib.Distortion({
    distortion: 0.1, // Reduced distortion
    wet: 0.2, // Less wet signal
    oversample: "4x",
  }).connect(masterCompressor);

  // Create a shared reverb that will be used by all synths
  const sharedReverb = new toneLib.Reverb({
    decay: 10,
    preDelay: 0.1,
    wet: 0.6,
  }).connect(softClipper);

  // Create a shared delay effect
  const sharedDelay = new toneLib.PingPongDelay({
    delayTime: "8n",
    feedback: 0.4,
    wet: 0.3,
  }).connect(sharedReverb);

  // Create a shared chorus effect
  const sharedChorus = new toneLib.Chorus({
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.7,
    type: "sine",
    spread: 180,
    wet: 0.3,
  })
    .start()
    .connect(sharedDelay);

  // Create a shared stereo widener
  const stereoWidener = new toneLib.StereoWidener(0.7).connect(sharedChorus);

  // Wait for reverb to generate its impulse response
  await sharedReverb.generate();

  // Connect synth to the effects chain if provided
  if (synth) {
    // Type guard to ensure synth has connect method
    if (
      typeof synth === "object" &&
      synth !== null &&
      "connect" in synth &&
      typeof synth.connect === "function"
    ) {
      // Check for disposed state
      const isDisposed =
        "_disposed" in synth
          ? synth._disposed
          : "disposed" in synth
          ? synth.disposed
          : false;

      if (!isDisposed) {
        synth.connect(stereoWidener);
      }
    }
  }

  // Return the effects chain
  const chain: EffectsChain = {
    reverb: sharedReverb,
    compressor: masterCompressor,
    limiter: masterLimiter,
    chorus: sharedChorus,
    delay: sharedDelay,
    stereoWidener: stereoWidener,
    softClipper: softClipper,
    masterVolume: masterVolume, // Add master volume to the chain

    // Method to get a specific effect
    getEffect: function (
      name: keyof Omit<EffectsChain, "getEffect">
    ): Tone.ToneAudioNode | undefined {
      // Type assertion needed because Object.values loses type info
      const effect = (this as EffectsChain)[name] as Tone.ToneAudioNode;
      return effect;
    },
  };
  return chain;
};

/**
 * Disposes of an effects chain and its components
 * @param {EffectsChain | null | undefined} effectsChain - Effects chain to dispose
 */
export const disposeEffectsChain = (
  effectsChain: EffectsChain | null | undefined
) => {
  if (!effectsChain) return;

  // Clean up effects - Iterate over known keys to preserve type safety
  const effectKeys = Object.keys(effectsChain).filter(
    (key) => key !== "getEffect"
  ) as Array<keyof Omit<EffectsChain, "getEffect">>;

  effectKeys.forEach((key) => {
    const effect = effectsChain[key];
    if (effect && typeof effect.dispose === "function") {
      try {
        effect.dispose();
      } catch (e) {
        console.warn(`Error disposing effect '${key}':`, e);
      }
    }
  });
};
