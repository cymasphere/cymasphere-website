/**
 * Utility functions for audio effects management
 */
import * as Tone from "tone";

/**
 * Initializes a complete effects chain for audio processing
 * @param {Object} effects - Optional effects configuration
 * @param {Object} Tone - The Tone.js library object
 * @returns {Promise<Object>} Promise resolving to the effects chain object
 */
export const initializeEffectsChain = async (effects = {}, Tone = null) => {
  // Use imported Tone library instance or throw an error if not provided
  if (!Tone) {
    throw new Error("Tone library must be passed as a parameter");
  }

  const ToneLib = Tone;

  // Create a master volume control at the end of the chain
  const masterVolume = new ToneLib.Volume(-6).toDestination();

  // Master effects chain with stronger limiting to prevent distortion
  const masterLimiter = new ToneLib.Limiter(-4).connect(masterVolume);

  const masterCompressor = new ToneLib.Compressor({
    ratio: 4, // Less aggressive ratio
    threshold: -24,
    release: 0.25,
    attack: 0.03,
    knee: 10,
  }).connect(masterLimiter);

  // Add a soft clipper before the compressor for smoother saturation instead of hard clipping
  const softClipper = new ToneLib.Distortion({
    distortion: 0.1, // Reduced distortion
    wet: 0.2, // Less wet signal
    oversample: "4x",
  }).connect(masterCompressor);

  // Create a shared reverb that will be used by all synths
  const sharedReverb = new ToneLib.Reverb({
    decay: 10,
    preDelay: 0.1,
    wet: 0.6,
  }).connect(softClipper);

  // Create a shared delay effect
  const sharedDelay = new ToneLib.PingPongDelay({
    delayTime: "8n",
    feedback: 0.4,
    wet: 0.3,
  }).connect(sharedReverb);

  // Create a shared chorus effect
  const sharedChorus = new ToneLib.Chorus({
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
  const stereoWidener = new ToneLib.StereoWidener(0.7).connect(sharedChorus);

  // Wait for reverb to generate its impulse response
  await sharedReverb.generate();

  // Return the effects chain
  return {
    reverb: sharedReverb,
    compressor: masterCompressor,
    limiter: masterLimiter,
    chorus: sharedChorus,
    delay: sharedDelay,
    stereoWidener: stereoWidener,
    softClipper: softClipper,
    masterVolume: masterVolume, // Add master volume to the chain

    // Method to get a specific effect
    getEffect: function (name) {
      return this[name];
    },
  };
};

/**
 * Disposes of an effects chain and its components
 * @param {Object} effectsChain - Effects chain to dispose
 */
export const disposeEffectsChain = (effectsChain) => {
  if (!effectsChain) return;

  // Clean up effects
  Object.values(effectsChain).forEach((effect) => {
    if (effect && typeof effect === "object" && effect.dispose) {
      try {
        effect.dispose();
      } catch (e) {
        console.warn("Error disposing effect:", e);
      }
    }
  });
};
