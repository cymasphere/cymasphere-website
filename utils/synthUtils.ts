/**
 * Utility functions for synthesizer creation and management
 */
import * as Tone from "tone";
import type { Frequency } from "tone";
import { EffectsChain } from "@/utils/effectsUtils";

// Define a more specific type for modulation components
interface SynthModulation {
  dispose: () => void;
  [key: string]: unknown; // Replace any with unknown for modulation components
}

// Declare augmented types for Tone.js with voices property for type checking
// Note: We're using type assertions to bypass TypeScript's type checking for Tone.js internal structure
interface ToneVoiceInternals {
  voices?: Array<Tone.Synth | Tone.FMSynth | Tone.AMSynth>;
  maxPolyphony?: number;
}

// Define extended Tone.js types with the custom modulation property
type PolySynthWithModulation = Tone.PolySynth &
  ToneVoiceInternals & {
    modulation?: SynthModulation;
  };

type FMSynthWithModulation = Tone.PolySynth &
  ToneVoiceInternals & {
    modulation?: SynthModulation & { modulationInterval?: number | null };
  };

// Define interface for the custom Pad Synth structure
interface PadSynthType {
  voices: {
    [key: string]: Tone.PolySynth | Tone.FMSynth | null;
  };
  triggerAttack: (
    notes: Array<Tone.Unit.Frequency | string | number>,
    time?: Tone.Unit.Time,
    velocity?: number
  ) => void;
  releaseAll: () => void;
  dispose: () => void;
  disconnect: () => void;
  modulation?: SynthModulation;
  _disposed?: boolean;
  // Replace any with unknown for other properties
  [key: string]: unknown;
}

// Type alias for synths handled by disposeSynth - export it
export type DisposableSynth =
  | PolySynthWithModulation
  | FMSynthWithModulation
  | PadSynthType
  | null
  | undefined;

// Type guard to check if a synth is our custom PadSynthType
function isPadSynth(synth: unknown): synth is PadSynthType {
  return (
    synth !== null &&
    typeof synth === "object" &&
    "voices" in synth &&
    !(synth instanceof Tone.PolySynth)
  );
}

/**
 * Creates a polyphonic synthesizer with warm analog character
 * @param {EffectsChain} effectsChain - Master effects chain to connect to
 * @returns {PolySynthWithModulation} Synthesizer instance with modulation components
 */
export const createPolySynth = (
  effectsChain: EffectsChain
): PolySynthWithModulation => {
  // Create a modulation network for the polysynth

  // Chorus for richness
  const chorus = new Tone.Chorus({
    frequency: 0.85,
    delayTime: 4,
    depth: 0.7,
    type: "sine",
    spread: 180,
    wet: 0.5,
  }).connect(effectsChain.stereoWidener);
  chorus.start();

  // Vibrato for expression
  const vibrato = new Tone.Vibrato({
    frequency: 4.5,
    depth: 0.1,
    type: "sine",
    wet: 0.3,
  }).connect(chorus);

  // Phaser for subtle movement
  const phaser = new Tone.Phaser({
    frequency: 0.2,
    octaves: 2,
    baseFrequency: 500,
    Q: 10,
    wet: 0.25,
  }).connect(vibrato);

  // Auto filter with envelope follower
  const autoFilter = new Tone.AutoFilter({
    frequency: 0.1,
    depth: 0.4,
    filter: {
      type: "lowpass",
      rolloff: -12,
      Q: 2,
    },
    wet: 0.4,
  })
    .start()
    .connect(phaser);

  // Create the synth with constructor then cast to our custom type that includes voices
  const polySynth = new Tone.PolySynth(Tone.Synth);
  const newSynth = polySynth as unknown as PolySynthWithModulation;

  // Set parameters after creation
  newSynth.volume.value = -12;

  // Attempt to configure voices if accessible
  // This is implementation-dependent and may not work in all Tone.js versions
  try {
    // Access voices array if available in this version of Tone.js
    if (newSynth.voices && Array.isArray(newSynth.voices)) {
      for (let i = 0; i < newSynth.voices.length; i++) {
        try {
          const voice = newSynth.voices[i] as Tone.Synth;
          // Set oscillator parameters
          voice.oscillator.type = "fatsawtooth";

          if (typeof voice.oscillator.set === "function") {
            voice.oscillator.set({
              partials: [1, 0.6, 0.3, 0.15, 0.075],
              count: 3,
              spread: 40,
            });
          }

          // Set envelope parameters
          if (typeof voice.envelope.set === "function") {
            voice.envelope.set({
              attack: 0.15,
              decay: 0.5,
              sustain: 0.8,
              release: 3.5,
              attackCurve: "sine",
              decayCurve: "exponential",
              releaseCurve: "exponential",
            });
          }
        } catch (err) {
          console.warn(`Error configuring voice ${i}:`, err);
        }
      }
    }
  } catch (err) {
    console.warn("Could not access synth voices:", err);
  }

  // Create a filter after the synth
  const filter = new Tone.Filter({
    frequency: 1200,
    type: "lowpass",
    rolloff: -24,
    Q: 2,
  }).connect(autoFilter);

  // Connect synth to the filter
  newSynth.connect(filter);

  // Store modulation components for cleanup
  newSynth.modulation = {
    filter,
    autoFilter,
    phaser,
    vibrato,
    chorus,
    dispose: () => {
      filter.dispose();
      autoFilter.dispose();
      phaser.dispose();
      vibrato.dispose();
      chorus.dispose();
    },
  };

  // Set effect parameters for polysynth
  effectsChain.reverb.wet.value = 0.4;
  effectsChain.delay.wet.value = 0.25;
  effectsChain.delay.delayTime.value = 0.25;
  effectsChain.delay.feedback.value = 0.35;
  effectsChain.chorus.wet.value = 0.35;

  return newSynth;
};

/**
 * Creates an FM synthesizer with complex modulation
 * @param {EffectsChain} effectsChain - Master effects chain to connect to
 * @returns {FMSynthWithModulation} Synthesizer instance with modulation components
 */
export const createFMSynth = (
  effectsChain: EffectsChain
): FMSynthWithModulation => {
  // Create a modulation network for the FM synth

  // Create a distinctive distortion for more edge
  const distortion = new Tone.Distortion({
    distortion: 0.3,
    wet: 0.3,
  }).connect(effectsChain.stereoWidener);

  // Auto-panner for stereo movement
  const autoPanner = new Tone.AutoPanner({
    frequency: 0.15,
    depth: 0.8,
    type: "sine",
  })
    .start()
    .connect(distortion);

  // Tremolo for rhythmic volume changes
  const tremolo = new Tone.Tremolo({
    frequency: 2.5,
    depth: 0.3,
    spread: 90,
    type: "sine",
  })
    .start()
    .connect(autoPanner);

  // Chorus for thickening
  const chorus = new Tone.Chorus({
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.6,
    type: "sine",
    spread: 180,
    wet: 0.4,
  })
    .start()
    .connect(tremolo);

  // Correct BitCrusher instantiation
  const bitCrusher = new Tone.BitCrusher({ bits: 8 });
  bitCrusher.wet.value = 0.15;
  bitCrusher.connect(chorus);

  // Create the FM synth with constructor then cast to our custom type
  const fmPolySynth = new Tone.PolySynth(Tone.FMSynth);
  const newSynth = fmPolySynth as unknown as FMSynthWithModulation;

  // Set parameters after creation
  newSynth.volume.value = -14;

  // Attempt to configure voices if accessible
  try {
    // Access voices array if available in this Tone.js version
    if (newSynth.voices && Array.isArray(newSynth.voices)) {
      for (let i = 0; i < newSynth.voices.length; i++) {
        try {
          const voice = newSynth.voices[i] as Tone.FMSynth;

          // Set FM specific parameters
          voice.harmonicity.value = 2.5;
          voice.modulationIndex.value = 3.5;

          // Configure oscillator
          voice.oscillator.type = "custom";
          if (typeof voice.oscillator.set === "function") {
            voice.oscillator.set({
              partials: [1, 0.5, 0.3, 0],
            });
          }

          // Configure envelopes
          if (typeof voice.envelope.set === "function") {
            voice.envelope.set({
              attack: 0.1,
              decay: 0.2,
              sustain: 0.9,
              release: 5,
              attackCurve: "linear",
              decayCurve: "exponential",
              releaseCurve: "exponential",
            });
          }

          voice.modulation.type = "square";

          if (typeof voice.modulationEnvelope.set === "function") {
            voice.modulationEnvelope.set({
              attack: 0.5,
              decay: 0.5,
              sustain: 0.5,
              release: 7,
              attackCurve: "linear",
              decayCurve: "exponential",
              releaseCurve: "exponential",
            });
          }
        } catch (err) {
          console.warn(`Error configuring FM voice ${i}:`, err);
        }
      }
    }
  } catch (err) {
    console.warn("Could not access FM synth voices:", err);
  }

  // Create a freeverb for additional space
  const freeverb = new Tone.Freeverb({
    roomSize: 0.8,
    dampening: 3000,
    wet: 0.3,
  }).connect(bitCrusher);

  let modulationInterval: number | null = null;
  const setupModulation = () => {
    // Remove unused startTime variable
    if (modulationInterval) {
      clearInterval(modulationInterval);
    }
    modulationInterval = setInterval(() => {
      // Removed dynamic setting of harmonicity and modulationIndex to fix type errors
    }, 50) as unknown as number;
  };
  setupModulation();

  newSynth.connect(freeverb);

  newSynth.modulation = {
    freeverb,
    bitCrusher,
    chorus,
    tremolo,
    autoPanner,
    distortion,
    modulationInterval,
    dispose: () => {
      if (modulationInterval) {
        clearInterval(modulationInterval);
      }
      freeverb.dispose();
      bitCrusher.dispose();
      chorus.dispose();
      tremolo.dispose();
      autoPanner.dispose();
      distortion.dispose();
    },
  };

  // Set effect parameters for fmsynth
  effectsChain.reverb.wet.value = 0.6;
  effectsChain.delay.wet.value = 0.35;
  effectsChain.delay.delayTime.value = 0.375;
  effectsChain.delay.feedback.value = 0.45;
  effectsChain.chorus.frequency.value = 0.6;
  effectsChain.chorus.depth = 0.7;
  effectsChain.stereoWidener.width.value = 0.9;

  return newSynth;
};

/**
 * Creates a pad synthesizer with multiple voices for rich textures
 * @param {EffectsChain} effectsChain - Master effects chain to connect to
 * @returns {PadSynthType} Synthesizer instance (custom object structure)
 */
export const createPadSynth = (effectsChain: EffectsChain): PadSynthType => {
  // Create filter for padsynth
  const padFilter = new Tone.Filter({
    frequency: 1500,
    type: "lowpass",
    rolloff: -24,
    Q: 1.2,
  }).connect(effectsChain.stereoWidener);

  // Auto filter for movement
  const autoFilter = new Tone.AutoFilter({
    frequency: 0.08,
    depth: 0.7,
    type: "sine",
    wet: 0.6,
    baseFrequency: 200,
    octaves: 3,
  })
    .start()
    .connect(padFilter);

  // Create a tremolo for subtle amplitude modulation
  const tremolo = new Tone.Tremolo({
    frequency: 0.2,
    depth: 0.3,
    type: "sine",
    spread: 180,
  })
    .start()
    .connect(autoFilter);

  // Add auto-panner for stereo movement
  const autoPanner = new Tone.AutoPanner({
    frequency: 0.05,
    depth: 0.8,
    type: "sine",
  })
    .start()
    .connect(tremolo);

  // Create phaser for further motion
  const phaser = new Tone.Phaser({
    frequency: 0.2,
    octaves: 5,
    baseFrequency: 400,
    Q: 10,
    wet: 0.3,
  }).connect(autoPanner);

  // Create vibrato for pitch modulation
  const vibrato = new Tone.Vibrato({
    frequency: 0.4,
    depth: 0.1,
    type: "sine",
  }).connect(phaser);

  // Helper to safely create a PolySynth
  const createSafePolySynth = (
    constructor: typeof Tone.Synth | typeof Tone.AMSynth | typeof Tone.FMSynth,
    options: { maxPolyphony?: number; volume?: number } = {}
  ): Tone.PolySynth => {
    // Create a basic PolySynth with the provided constructor
    // Using 'unknown' as an intermediate step is safer than 'any'
    const synth = new Tone.PolySynth(
      constructor as unknown as typeof Tone.Synth
    );

    // Set options if provided
    if (options.maxPolyphony !== undefined) {
      (synth as { maxPolyphony?: number }).maxPolyphony = options.maxPolyphony;
    }
    if (options.volume !== undefined) {
      synth.volume.value = options.volume;
    }

    return synth;
  };

  // Create individual voices for the pad synth
  const voice1 = createSafePolySynth(Tone.Synth, {
    maxPolyphony: 8,
    volume: -18,
  });
  const voice2 = createSafePolySynth(Tone.Synth, {
    maxPolyphony: 8,
    volume: -22,
  });
  const voice3 = createSafePolySynth(Tone.AMSynth, {
    maxPolyphony: 4,
    volume: -20,
  });
  const voice4 = createSafePolySynth(Tone.FMSynth, {
    maxPolyphony: 6,
    volume: -24,
  });

  // Configure voices with specific settings
  // Try to access internal voice array if available
  try {
    type ToneVoice = Tone.Synth | Tone.AMSynth | Tone.FMSynth;

    const configureVoice = <T extends ToneVoice>(
      synth: Tone.PolySynth,
      configFn: (voice: T) => void
    ): void => {
      // Cast to access potential internal voices array
      const voicesObj = synth as unknown as { voices?: T[] };
      if (voicesObj.voices && Array.isArray(voicesObj.voices)) {
        for (let i = 0; i < voicesObj.voices.length; i++) {
          try {
            configFn(voicesObj.voices[i]);
          } catch (err) {
            console.warn(`Error configuring pad voice:`, err);
          }
        }
      }
    };

    // Configure voice1 (basic sawtooth)
    configureVoice<Tone.Synth>(voice1, (v) => {
      v.oscillator.type = "fatsawtooth";
      if (typeof v.oscillator.set === "function") {
        v.oscillator.set({ spread: 60, count: 3 });
      }
      if (typeof v.envelope.set === "function") {
        v.envelope.set({
          attack: 1.5,
          decay: 2.5,
          sustain: 0.9,
          release: 8.0,
          decayCurve: "exponential",
          attackCurve: "linear",
          releaseCurve: "exponential",
        });
      }
    });

    // Configure voice2 (sine texture)
    configureVoice<Tone.Synth>(voice2, (v) => {
      v.oscillator.type = "fatsine";
      if (typeof v.oscillator.set === "function") {
        v.oscillator.set({ spread: 80, count: 4 });
      }
      if (typeof v.envelope.set === "function") {
        v.envelope.set({
          attack: 2.0,
          decay: 3.0,
          sustain: 0.8,
          release: 9.0,
          decayCurve: "exponential",
          attackCurve: "linear",
          releaseCurve: "exponential",
        });
      }
    });

    // Configure voice3 (AM bass)
    configureVoice<Tone.AMSynth>(voice3, (v) => {
      v.harmonicity.value = 1.5;

      if (typeof v.envelope.set === "function") {
        v.envelope.set({
          attack: 2.5,
          decay: 4.0,
          sustain: 0.7,
          release: 10.0,
          decayCurve: "exponential",
          attackCurve: "linear",
          releaseCurve: "exponential",
        });
      }

      if (typeof v.modulationEnvelope.set === "function") {
        v.modulationEnvelope.set({
          attack: 3.0,
          decay: 1.0,
          sustain: 1.0,
          release: 6.0,
          decayCurve: "exponential",
          attackCurve: "linear",
          releaseCurve: "exponential",
        });
      }
    });

    // Configure voice4 (FM texture)
    configureVoice<Tone.FMSynth>(voice4, (v) => {
      v.harmonicity.value = 3.0;
      v.modulationIndex.value = 5;

      if (typeof v.envelope.set === "function") {
        v.envelope.set({
          attack: 1.8,
          decay: 3.5,
          sustain: 0.85,
          release: 9.5,
          decayCurve: "exponential",
          attackCurve: "linear",
          releaseCurve: "exponential",
        });
      }

      if (typeof v.modulationEnvelope.set === "function") {
        v.modulationEnvelope.set({
          attack: 2.2,
          decay: 1.5,
          sustain: 0.9,
          release: 7.0,
          decayCurve: "exponential",
          attackCurve: "linear",
          releaseCurve: "exponential",
        });
      }
    });
  } catch (err) {
    console.warn("Error configuring pad voices:", err);
  }

  // Connect voices to the effects chain
  voice1.connect(vibrato);
  voice2.connect(vibrato);
  voice3.connect(vibrato);
  voice4.connect(vibrato);

  // Define type for voices to ensure .releaseAll() exists
  type VoiceWithReleaseAll = {
    releaseAll: () => void;
    triggerAttack: (
      notes: Array<number>,
      time?: Tone.Unit.Time,
      velocity?: number
    ) => void;
    dispose: () => void;
    disconnect: () => void;
  };

  // Cast voices to the correct type
  const typedVoice1 = voice1 as unknown as VoiceWithReleaseAll;
  const typedVoice2 = voice2 as unknown as VoiceWithReleaseAll;
  const typedVoice3 = voice3 as unknown as VoiceWithReleaseAll;
  const typedVoice4 = voice4 as unknown as VoiceWithReleaseAll;

  const newSynth: PadSynthType = {
    voices: { voice1, voice2, voice3, voice4 },
    triggerAttack: (
      notes: Array<Tone.Unit.Frequency | string | number>,
      time?: Tone.Unit.Time,
      velocity: number = 1
    ) => {
      const timeValue = time || Tone.now();
      // Convert to frequency numbers (Hz)
      const safeFreqNumbers = notes
        .map((n) => {
          try {
            return Tone.Frequency(n).toFrequency();
          } catch {
            return null;
          }
        })
        .filter((f) => typeof f === "number") as number[];

      if (safeFreqNumbers.length === 0) return;

      // Pass frequency numbers (number[]) to triggerAttack
      typedVoice1.triggerAttack(safeFreqNumbers, timeValue, velocity * 0.95);
      const notesUp = safeFreqNumbers
        .map((freq) => {
          try {
            return Tone.Frequency(freq).transpose(12).toFrequency();
          } catch {
            return null;
          }
        })
        .filter((f) => typeof f === "number") as number[];
      typedVoice2.triggerAttack(notesUp, timeValue, velocity * 0.7);
      const rootFreq = safeFreqNumbers[0];
      if (rootFreq) {
        try {
          const rootFreqDown = Tone.Frequency(rootFreq)
            .transpose(-12)
            .toFrequency();
          // Ensure rootFreqDown is valid number before passing
          if (typeof rootFreqDown === "number") {
            typedVoice3.triggerAttack(
              [rootFreqDown],
              timeValue,
              velocity * 0.8
            );
          }
        } catch (e) {
          console.warn("Error transposing root note down:", e);
        }
      }
      typedVoice4.triggerAttack(safeFreqNumbers, timeValue, velocity * 0.6);
    },
    releaseAll: () => {
      typedVoice1.releaseAll();
      typedVoice2.releaseAll();
      typedVoice3.releaseAll();
      typedVoice4.releaseAll();
    },
    dispose: () => {
      typedVoice1.dispose();
      typedVoice2.dispose();
      typedVoice3.dispose();
      typedVoice4.dispose();
      vibrato.dispose();
      phaser.dispose();
      autoPanner.dispose();
      tremolo.dispose();
      autoFilter.dispose();
      padFilter.dispose();
      newSynth._disposed = true;
    },
    disconnect: () => {
      typedVoice1.disconnect();
      typedVoice2.disconnect();
      typedVoice3.disconnect();
      typedVoice4.disconnect();
    },
    modulation: {
      vibrato,
      phaser,
      autoPanner,
      tremolo,
      autoFilter,
      padFilter,
      dispose: () => {
        vibrato.dispose();
        phaser.dispose();
        autoPanner.dispose();
        tremolo.dispose();
        autoFilter.dispose();
        padFilter.dispose();
      },
    },
  };

  // Set effect parameters for padsynth - extreme ambience
  effectsChain.reverb.wet.value = 0.9;
  effectsChain.reverb.decay = 15;
  effectsChain.delay.wet.value = 0.7;
  effectsChain.delay.delayTime.value = 0.5;
  effectsChain.delay.feedback.value = 0.6;
  effectsChain.chorus.wet.value = 0.5;
  effectsChain.stereoWidener.width.value = 1;

  return newSynth;
};

/**
 * Factory function to create different synth types
 * @param {string} type - Type of synth ('polysynth', 'fmsynth', 'padsynth')
 * @param {EffectsChain} effectsChain - Master effects chain
 * @returns {PolySynthWithModulation | FMSynthWithModulation | PadSynthType | null} The created synth instance or null
 */
export const createSynth = (
  type: string,
  effectsChain: EffectsChain
): PolySynthWithModulation | FMSynthWithModulation | PadSynthType | null => {
  console.log(`Creating synth of type: ${type}`);
  switch (type) {
    case "polysynth":
      return createPolySynth(effectsChain);
    case "fmsynth":
      return createFMSynth(effectsChain);
    case "padsynth":
      return createPadSynth(effectsChain);
    default:
      console.warn(`Unknown synth type: ${type}`);
      return null;
  }
};

/**
 * Disposes of a synth instance and its modulation components
 * @param {DisposableSynth} synth - Synth instance to dispose
 */
export const disposeSynth = (synth: DisposableSynth) => {
  if (!synth) {
    console.log("No synth to dispose");
    return;
  }

  console.log("Disposing synth:", synth);

  const safeExecute = (operation: () => void, description: string) => {
    try {
      operation();
      return true;
    } catch (error) {
      console.warn(`Error during ${description}:`, (error as Error).message);
      return false;
    }
  };

  // Check Tone.js disposed state BEFORE any operations
  if (synth instanceof Tone.PolySynth && synth.disposed) {
    console.log("Tone.js synth already disposed, skipping disposal.");
    return; // Exit early if already disposed
  }

  // Check custom disposed state for PadSynth BEFORE any operations
  if (isPadSynth(synth) && (synth as PadSynthType)._disposed) {
    console.log("Custom synth already marked as _disposed, skipping disposal.");
    return; // Exit early
  }

  // Step 1: Clear interval (FM Synth)
  const fmSynth = synth as FMSynthWithModulation;
  if (fmSynth.modulation && fmSynth.modulation.modulationInterval) {
    safeExecute(() => {
      if (fmSynth.modulation) {
        clearInterval(fmSynth.modulation.modulationInterval as number);
        fmSynth.modulation.modulationInterval = null;
      }
    }, "clearing modulation interval");
  }

  // Step 2: Release notes
  if (typeof synth.releaseAll === "function") {
    safeExecute(() => synth.releaseAll(), "releasing all notes");
  }

  // Step 3: Dispose Pad Synth voices
  if (isPadSynth(synth)) {
    const padSynth = synth as PadSynthType;
    console.log("Disposing padsynth voices");

    // Use type assertion to handle voice methods
    Object.entries(padSynth.voices).forEach(([voiceName, voice]) => {
      if (voice) {
        // Type assertion to handle potential property access
        const typedVoice = voice as unknown as {
          releaseAll?: () => void;
          disconnect?: () => void;
          dispose?: () => void;
        };

        if (typedVoice.releaseAll) {
          safeExecute(
            () => typedVoice.releaseAll?.(),
            `releasing ${voiceName} notes`
          );
        }
        if (typedVoice.disconnect) {
          safeExecute(
            () => typedVoice.disconnect?.(),
            `disconnecting ${voiceName}`
          );
        }
      }
    });

    Object.entries(padSynth.voices).forEach(([voiceName, voice]) => {
      if (voice) {
        const typedVoice = voice as unknown as { dispose?: () => void };
        if (typedVoice.dispose) {
          safeExecute(() => typedVoice.dispose?.(), `disposing ${voiceName}`);
          try {
            padSynth.voices[voiceName] = null;
          } catch (err) {
            console.warn(
              `Could not null out ${voiceName}:`,
              (err as Error).message
            );
          }
        }
      }
    });
  }

  // Step 4: Dispose modulation
  if (synth.modulation && typeof synth.modulation.dispose === "function") {
    safeExecute(() => {
      if (synth.modulation) {
        synth.modulation.dispose();
      }
    }, "disposing modulation components");
    try {
      // Use a more specific type for setting modulation to null
      (synth as { modulation?: SynthModulation }).modulation = undefined;
    } catch (err) {
      console.warn("Could not null out modulation:", (err as Error).message);
    }
  }

  // Step 5: Disconnect main synth
  if (typeof synth.disconnect === "function") {
    safeExecute(() => {
      // Cast to a known type with disconnect method
      const disconnectable = synth as { disconnect: () => void };
      disconnectable.disconnect();
    }, "disconnecting synth");
  }

  // Step 6: Dispose main synth (if not already handled by checks above)
  if (typeof synth.dispose === "function") {
    // Re-check Tone.js disposed flag just before final dispose call for safety
    if (!(synth instanceof Tone.PolySynth && synth.disposed)) {
      safeExecute(() => synth.dispose(), "disposing main synth");
    }
  }

  // Step 7: Set custom disposed flag for PadSynth AFTER disposal attempt
  if (isPadSynth(synth)) {
    try {
      (synth as PadSynthType)._disposed = true;
    } catch (err) {
      console.warn("Could not set _disposed flag:", (err as Error).message);
    }
  }

  // Step 8: Final cleanup (Optional)
  try {
    const props = Object.getOwnPropertyNames(synth);
    for (const prop of props) {
      const descriptor = Object.getOwnPropertyDescriptor(synth, prop);
      if (descriptor && !descriptor.configurable) continue;

      // Use proper typing for property access
      type SynthWithProps = {
        [key: string]: unknown;
        _disposed?: boolean;
      };

      const typedSynth = synth as SynthWithProps;

      if (
        prop !== "_disposed" &&
        typeof typedSynth[prop] === "object" &&
        typedSynth[prop] !== null
      ) {
        try {
          typedSynth[prop] = null;
        } catch (err) {
          console.warn(
            `Could not null out property ${prop} during final cleanup:`,
            (err as Error).message
          );
        }
      }
    }
  } catch (error) {
    console.warn(
      "Error cleaning up synth properties:",
      (error as Error).message
    );
  }

  console.log("Synth disposal completed");
};

/**
 * Convert MIDI note number to frequency
 * @param {number} midiNote - MIDI note number (0-127)
 * @returns {number} - Frequency in Hz
 */
export const midiToFreq = (midiNote: number): number => {
  if (typeof midiNote !== "number" || isNaN(midiNote)) {
    console.warn("Invalid MIDI note:", midiNote);
    return 440; // Default to A4 if invalid input
  }
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};
