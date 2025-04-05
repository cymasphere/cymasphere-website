/**
 * Utility functions for synthesizer creation and management
 */
import * as Tone from 'tone';

// Define types for our synth modules
interface ModulationComponents {
  filter?: Tone.Filter;
  autoFilter?: Tone.AutoFilter;
  phaser?: Tone.Phaser;
  vibrato?: Tone.Vibrato;
  chorus?: Tone.Chorus;
  freeverb?: Tone.Freeverb;
  bitCrusher?: Tone.BitCrusher;
  tremolo?: Tone.Tremolo;
  autoPanner?: Tone.AutoPanner;
  distortion?: Tone.Distortion;
  modulationInterval?: NodeJS.Timeout;
  dispose: () => void;
}

interface SynthWithModulation extends Tone.PolySynth {
  modulation: ModulationComponents;
}

interface MultivoxSynth {
  voices: {
    voice1: Tone.PolySynth<Tone.Synth>;
    voice2: Tone.PolySynth<Tone.Synth>;
    voice3: Tone.PolySynth<Tone.Synth>;
    voice4: Tone.PolySynth<Tone.Synth>;
  };
  modulation?: ModulationComponents;
  triggerAttack: (notes: any, time: any, velocity: any) => void;
  releaseAll: () => void;
  dispose: () => void;
}

interface EffectsChain {
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  chorus: Tone.Chorus;
  stereoWidener: Tone.StereoWidener;
  limiter: Tone.Limiter;
  [key: string]: any;
}

// Define a minimal type for modulationInterval
type ModulationIntervalType = ReturnType<typeof setInterval> | null;

/**
 * Creates a polyphonic synthesizer with warm analog character
 * @param {EffectsChain} effectsChain - Master effects chain to connect to
 * @returns {SynthWithModulation} Synthesizer instance with modulation components
 */
export const createPolySynth = (effectsChain: EffectsChain): SynthWithModulation => {
  // Create a modulation network for the polysynth
  
  // Chorus for richness
  const chorus = new Tone.Chorus({
    frequency: 0.85,
    delayTime: 4,
    depth: 0.7,
    type: "sine",
    spread: 180,
    wet: 0.5
  }).connect(effectsChain.stereoWidener);
  chorus.start();
  
  // Vibrato for expression
  const vibrato = new Tone.Vibrato({
    frequency: 4.5,
    depth: 0.1,
    type: "sine",
    wet: 0.3
  }).connect(chorus);
  
  // Phaser for subtle movement
  const phaser = new Tone.Phaser({
    frequency: 0.2,
    octaves: 2,
    baseFrequency: 500,
    Q: 10,
    wet: 0.25
  }).connect(vibrato);
  
  // Auto filter with envelope follower
  const autoFilter = new Tone.AutoFilter({
    frequency: 0.1,
    depth: 0.4,
    filter: {
      type: "lowpass",
      rolloff: -12,
      Q: 2
    },
    wet: 0.4
  }).start().connect(phaser);
  
  // Warm, rich polysynth with analog character
  const newSynth = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 16,
    volume: -12,
    oscillator: {
      type: "fatcustom",
      partials: [1, 0.6, 0.3, 0.15, 0.075],
      partialCount: 8,
      spread: 40,
      count: 3
    },
    envelope: {
      attack: 0.15, 
      decay: 0.5,
      sustain: 0.8,
      release: 3.5,
      attackCurve: "sine",
      releaseCurve: "exponential"
    }
  }) as SynthWithModulation;
  
  // Create a filter after the synth
  const filter = new Tone.Filter({
    frequency: 1200,
    type: "lowpass",
    rolloff: -24,
    Q: 2
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
    }
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
 * @returns {SynthWithModulation} Synthesizer instance with modulation components
 */
export const createFMSynth = (effectsChain: EffectsChain): SynthWithModulation => {
  // Create a modulation network for the FM synth
  
  // Create a distinctive distortion for more edge
  const distortion = new Tone.Distortion({
    distortion: 0.3,
    wet: 0.3
  }).connect(effectsChain.stereoWidener);
  
  // Auto-panner for stereo movement
  const autoPanner = new Tone.AutoPanner({
    frequency: 0.15,
    depth: 0.8,
    type: "sine"
  }).start().connect(distortion);
  
  // Tremolo for rhythmic volume changes
  const tremolo = new Tone.Tremolo({
    frequency: 2.5,
    depth: 0.3,
    spread: 90,
    type: "sine"
  }).start().connect(autoPanner);
  
  // Chorus for thickening
  const chorus = new Tone.Chorus({
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.6,
    type: "sine",
    spread: 180,
    wet: 0.4
  }).start().connect(tremolo);
  
  // Create a complex bitcrusher for digital texture
  const bitCrusher = new Tone.BitCrusher({
    bits: 8,
    wet: 0.15
  }).connect(chorus);
  
  // Shimmering FM pad with complex modulation
  const newSynth = new Tone.PolySynth(Tone.FMSynth, {
    maxPolyphony: 12,
    volume: -14,
    harmonicity: 2.5,
    modulationIndex: 3.5,
    oscillator: {
      type: "custom",
      partials: [1, 0.5, 0.3, 0]
    },
    envelope: {
      attack: 0.1,
      decay: 0.2,
      sustain: 0.9,
      release: 5
    },
    modulation: {
      type: "square"
    },
    modulationEnvelope: {
      attack: 0.5,
      decay: 0.5,
      sustain: 0.5,
      release: 7
    }
  }) as SynthWithModulation;
  
  // Create a freeverb for additional space
  const freeverb = new Tone.Freeverb({
    roomSize: 0.8,
    dampening: 3000,
    wet: 0.3
  }).connect(bitCrusher);
  
  // Use dynamic parameter changes instead of direct LFO connections
  // Set up modulation via interval for better compatibility
  let modulationInterval: ReturnType<typeof setInterval> | null = null;
  const setupModulation = () => {
    const startTime = Tone.now();
    
    // Clean up any existing interval
    if (modulationInterval) {
      clearInterval(modulationInterval);
    }
    
    // Set up an interval for parameter modulation
    modulationInterval = setInterval(() => {
      const now = Tone.now() - startTime;
      
      // Modulate harmonicity - ensure value is always positive
      const harmonicityValue = Math.max(0.1, 1 + Math.sin(now * 0.15 * Math.PI * 2) * 1.5);
      newSynth.set({ harmonicity: harmonicityValue });
      
      // Modulate modulation index - ensure value is always positive
      const modIndexValue = Math.max(0.1, 2 + Math.sin(now * 0.2 * Math.PI * 2) * 4);
      newSynth.set({ modulationIndex: modIndexValue });
    }, 50); // Update every 50ms
  };
  
  // Start modulation
  setupModulation();
  
  // Connect synth to the effects
  newSynth.connect(freeverb);
  
  // Store modulation components for cleanup
  (newSynth as any).modulation = {
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
    }
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
 * @returns {MultivoxSynth} Multivox pad synthesizer instance
 */
export const createPadSynth = (effectsChain: EffectsChain): MultivoxSynth => {
  // Create filter for padsynth
  const padFilter = new Tone.Filter({
    frequency: 1500,
    type: "lowpass",
    rolloff: -24,
    Q: 1.2
  }).connect(effectsChain.stereoWidener);
  
  // Auto filter for movement
  const autoFilter = new Tone.AutoFilter({
    frequency: 0.08,
    depth: 0.7,
    type: "sine",
    wet: 0.6,
    baseFrequency: 200,
    octaves: 3
  }).start().connect(padFilter);
  
  // Create a tremolo for subtle amplitude modulation
  const tremolo = new Tone.Tremolo({
    frequency: 0.2,
    depth: 0.3,
    type: "sine",
    spread: 180
  }).start().connect(autoFilter);
  
  // Add auto-panner for stereo movement
  const autoPanner = new Tone.AutoPanner({
    frequency: 0.05,
    depth: 0.8,
    type: "sine"
  }).start().connect(tremolo);
  
  // Create phaser for further motion
  const phaser = new Tone.Phaser({
    frequency: 0.2,
    octaves: 5,
    baseFrequency: 400,
    Q: 10,
    wet: 0.3
  }).connect(autoPanner);
  
  // Create vibrato for pitch modulation
  const vibrato = new Tone.Vibrato({
    frequency: 0.4,
    depth: 0.1,
    type: "sine"
  }).connect(phaser);
  
  // Voice 1: Main pad - fat, detuned sawtooth waves for rich harmonics
  const voice1 = new Tone.PolySynth(Tone.Synth, {
    volume: -8,
    oscillator: {
      type: "fatsawtooth",
      count: 5,
      spread: 80
    },
    envelope: {
      attack: 3.5,
      decay: 4,
      sustain: 0.8,
      release: 15,
      attackCurve: "sine",
      releaseCurve: "exponential"
    }
  }).connect(vibrato);
  
  // Voice 2: Upper harmonics layer - softer triangle waves an octave up
  const voice2 = new Tone.PolySynth(Tone.Synth, {
    volume: -12,
    oscillator: {
      type: "fattriangle",
      count: 3,
      spread: 60
    },
    envelope: {
      attack: 5,
      decay: 4,
      sustain: 0.6,
      release: 18,
      attackCurve: "sine",
      releaseCurve: "exponential"
    }
  }).connect(vibrato);
  
  // Voice 3: Low end foundation - sine waves an octave down
  const voice3 = new Tone.PolySynth(Tone.Synth, {
    volume: -10,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 6,
      decay: 5,
      sustain: 0.9,
      release: 20,
      attackCurve: "sine",
      releaseCurve: "exponential"
    }
  }).connect(vibrato);
  
  // Voice 4: Harmonically rich layer using FM synthesis
  const voice4 = new Tone.PolySynth(Tone.FMSynth, {
    volume: -16,
    harmonicity: 2.5,
    modulationIndex: 1.5,
    oscillator: {
      type: "sine"
    },
    envelope: {
      attack: 4,
      decay: 4,
      sustain: 0.7,
      release: 15
    },
    modulation: {
      type: "triangle"
    },
    modulationEnvelope: {
      attack: 8,
      decay: 6,
      sustain: 0.4,
      release: 15
    }
  }).connect(vibrato);
  
  // Create a container object to hold all voices
  const newSynth = {
    voices: {
      voice1,
      voice2,
      voice3,
      voice4
    },
    // Method to trigger attacks on all voices
    triggerAttack: (notes, time, velocity) => {
      // If time is not provided, use Tone.now()
      const timeValue = time || Tone.now();
      
      if (Array.isArray(notes)) {
        // For chord playing
        voice1.triggerAttack(notes, timeValue, velocity * 0.95);
        
        // Voice 2 plays an octave higher
        const notesUp = notes.map(n => {
          const freq = typeof n === 'number' ? n : Tone.Frequency(n).toFrequency();
          return freq * 2;
        });
        voice2.triggerAttack(notesUp, timeValue, velocity * 0.7);
        
        // Voice 3 plays an octave lower (just the root note)
        if (notes.length > 0) {
          const rootNote = typeof notes[0] === 'number' ? notes[0] : Tone.Frequency(notes[0]).toFrequency();
          voice3.triggerAttack(rootNote * 0.5, timeValue, velocity * 0.8);
        }
        
        // Voice 4 plays the same notes as voice 1 but with FM synthesis
        voice4.triggerAttack(notes, timeValue, velocity * 0.6);
      }
    },
    // Method to release all voices
    releaseAll: () => {
      voice1.releaseAll();
      voice2.releaseAll();
      voice3.releaseAll();
      voice4.releaseAll();
    },
    // Method to dispose of all voices
    dispose: () => {
      voice1.dispose();
      voice2.dispose();
      voice3.dispose();
      voice4.dispose();
      vibrato.dispose();
      phaser.dispose();
      autoPanner.dispose();
      tremolo.dispose();
      autoFilter.dispose();
      padFilter.dispose();
    }
  } as MultivoxSynth;
  
  // Store modulation components for cleanup
  (newSynth as any).modulation = {
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
    }
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
 * Creates and configures a synth based on the specified type
 * @param {string} type - Type of synth to create ('polysynth')
 * @param {EffectsChain} effectsChain - Master effects chain to connect to
 * @returns {SynthWithModulation | MultivoxSynth} Configured synthesizer instance
 */
export const createSynth = (type: string, effectsChain: EffectsChain): SynthWithModulation | MultivoxSynth => {
  if (type === 'polysynth') {
    return createPolySynth(effectsChain);
  } else if (type === 'padsynth') {
    return createPadSynth(effectsChain);
  } else if (type === 'fmsynth') {
    return createFMSynth(effectsChain);
  } else {
    throw new Error(`Unknown synth type: ${type}`);
  }
};

/**
 * Safely disposes of a synthesizer and its resources
 * @param {SynthWithModulation | MultivoxSynth} synth - The synthesizer to dispose
 */
export const disposeSynth = (synth: SynthWithModulation | MultivoxSynth): void => {
  if (!synth) {
    console.log("No synth to dispose");
    return;
  }
  
  console.log("Disposing synth:", synth);
  
  // Define a helper function to safely handle operations that might fail
  const safeExecute = (operation: () => void, description: string): void => {
    try {
      operation();
    } catch (error: unknown) {
      console.error(`Error ${description}:`, error instanceof Error ? error.message : String(error));
    }
  };
  
  // Check if the synth is already disposed
  if (synth._disposed) {
    console.log("Synth already marked as disposed, cleaning up references only");
    // Just clean up references and return
    try {
      // Clean up references
      for (const prop in synth) {
        if (prop !== '_disposed' && typeof synth[prop] === 'object' && synth[prop] !== null) {
          try {
            synth[prop] = null;
          } catch (e) {
            // Silently ignore read-only properties
          }
        }
      }
    } catch (error) {
      console.warn("Error cleaning already-disposed synth:", error.message);
    }
    return;
  }
  
  // Step 1: Handle interval timers first (for FM synth)
  if (synth.modulation && synth.modulation.modulationInterval) {
    safeExecute(() => {
      clearInterval(synth.modulation.modulationInterval);
      synth.modulation.modulationInterval = null;
    }, "clearing modulation interval");
  }
  
  // Step 2: Safely release any active notes before disposal
  if (typeof synth.releaseAll === 'function') {
    safeExecute(() => synth.releaseAll(), "releasing all notes");
  }
  
  // Step 3: Handle pad synth's multiple voices if present
  if (synth.voices) {
    console.log("Disposing padsynth with multiple voices");
    
    // First disconnect and release all voices
    Object.entries(synth.voices).forEach(([voiceName, voice]) => {
      if (!voice) return;
      
      // First try to release all notes
      if (typeof voice.releaseAll === 'function') {
        safeExecute(() => voice.releaseAll(), `releasing ${voiceName} notes`);
      }
      
      // Then disconnect the voice
      if (typeof voice.disconnect === 'function') {
        safeExecute(() => voice.disconnect(), `disconnecting ${voiceName}`);
      }
    });
    
    // Then dispose all voices after disconnection
    Object.entries(synth.voices).forEach(([voiceName, voice]) => {
      if (!voice) return;
      
      if (typeof voice.dispose === 'function') {
        safeExecute(() => voice.dispose(), `disposing ${voiceName}`);
        
        // Null out the reference to help garbage collection
        try {
          synth.voices[voiceName] = null;
        } catch (e) {
          console.warn(`Could not null out ${voiceName} reference, may be read-only`);
        }
      }
    });
  }
  
  // Step 4: Handle modulation components (if they exist)
  if (synth.modulation) {
    // If there's a custom dispose method for modulation, use it
    if (typeof synth.modulation.dispose === 'function') {
      safeExecute(() => synth.modulation.dispose(), "disposing modulation components");
    } else {
      // Otherwise try to dispose each modulation component individually
      const componentKeys = Object.keys(synth.modulation).filter(key => 
        key !== 'dispose' && 
        typeof synth.modulation[key] === 'object' && 
        synth.modulation[key] !== null &&
        typeof synth.modulation[key].dispose === 'function'
      );
      
      // First disconnect all components
      componentKeys.forEach(key => {
        const component = synth.modulation[key];
        if (!component) return;
        
        if (typeof component.disconnect === 'function') {
          safeExecute(() => component.disconnect(), `disconnecting ${key} component`);
        }
      });
      
      // Then dispose each component
      componentKeys.forEach(key => {
        const component = synth.modulation[key];
        if (!component) return;
        
        safeExecute(() => component.dispose(), `disposing ${key} component`);
        
        try {
          synth.modulation[key] = null; // Clear reference to help garbage collection
        } catch (e) {
          console.warn(`Could not null out modulation.${key}, may be read-only`);
        }
      });
    }
    
    // Null out the modulation reference to help garbage collection
    try {
      synth.modulation = null;
    } catch (e) {
      console.warn("Could not null out modulation reference, may be read-only");
    }
  }
  
  // Step 5: Handle the main synth instance
  // First disconnect if possible
  if (typeof synth.disconnect === 'function') {
    safeExecute(() => synth.disconnect(), "disconnecting synth");
  }
  
  // Then dispose if possible
  let disposedSuccessfully = false;
  if (typeof synth.dispose === 'function') {
    // Skip if already disposed
    if (synth._disposed) {
      console.log("Synth already disposed, skipping disposal");
    } else {
      disposedSuccessfully = safeExecute(() => synth.dispose(), "disposing synth");
    }
  }
  
  // Special case for custom pad synth - ensure dispose method is called
  if (!disposedSuccessfully && synth.dispose && typeof synth.dispose === 'function' && !synth._disposed) {
    safeExecute(() => synth.dispose(), "disposing custom synth");
  }
  
  // Step 6: Mark as disposed even if the disposal failed
  try {
    synth._disposed = true;
  } catch (e) {
    console.warn("Could not mark synth as disposed, may be read-only");
  }
  
  // Step 7: Clear any remaining object properties to help garbage collection
  try {
    // Use Object.getOwnPropertyNames to get all properties including non-enumerable ones
    const props = Object.getOwnPropertyNames(synth);
    
    for (const prop of props) {
      if (prop !== '_disposed' && typeof synth[prop] === 'object' && synth[prop] !== null) {
        try {
          synth[prop] = null;
        } catch (e) {
          // Silently ignore read-only properties
        }
      }
    }
  } catch (error) {
    console.warn("Error cleaning up synth properties:", error.message);
  }
  
  console.log("Synth disposal completed");
};

/**
 * Convert MIDI note number to frequency
 * @param {number} midiNote - MIDI note number (0-127)
 * @returns {number} - Frequency in Hz
 */
export const midiToFreq = (midiNote: number): number => {
  if (typeof midiNote !== 'number' || isNaN(midiNote)) {
    console.warn('Invalid MIDI note:', midiNote);
    return 440; // Default to A4 if invalid input
  }
  return 440 * Math.pow(2, (midiNote - 69) / 12);
}; 