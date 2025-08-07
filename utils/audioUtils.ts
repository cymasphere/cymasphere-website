import * as Tone from "tone";
// Remove unused import
// import { createPadSynth } from './synthUtils';

// Add interface for window with webkitAudioContext
interface WindowWithWebAudio extends Window {
  AudioContext: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
}

// Initialize with simple web audio API instead of Tone.js synths
let audioContext: AudioContext | null = null;
let convolver: ConvolverNode | null = null;
let initialized = false;

// Add a click counter to prevent spam clicking
let activeLydianChords = 0;
const MAX_ACTIVE_CHORDS = 7;

// Simple function to convert note names to frequencies
const noteToFreq = (note: string): number => {
  const notes = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const octave = parseInt(note.slice(-1));
  const noteIndex = notes.indexOf(note.slice(0, -1));

  if (noteIndex === -1) return 440; // Default to A4 if invalid

  // A4 = 440Hz, which is note 'A' in octave 4
  return 440 * Math.pow(2, octave - 4 + (noteIndex - 9) / 12);
};

// Initialize audio context
export const initAudio = async (): Promise<void> => {
  // Only initialize on client side
  if (typeof window === 'undefined') return;
  
  if (initialized) return;

  try {
    // Create audio context with proper typecasting
    const windowWithWebAudio = window as WindowWithWebAudio;
    audioContext = new (windowWithWebAudio.AudioContext ||
      windowWithWebAudio.webkitAudioContext ||
      AudioContext)();

    // Resume audio context if it's suspended (needed for some browsers)
    if (audioContext?.state === "suspended") {
      await audioContext.resume();
      console.log("Audio context resumed from suspended state");
    }

    // Create reverb effect using convolver node and impulse response
    if (audioContext) {
      convolver = audioContext.createConvolver();

      // Create impulse response for reverb - passing the audioContext explicitly to avoid null checks
      const impulseResponse = createImpulseResponse(audioContext, 3, 2.5); // 3 seconds decay, 2.5 pre-delay
      convolver.buffer = impulseResponse;

      // Connect convolver to output
      convolver.connect(audioContext.destination);

      console.log(
        "Simple Web Audio API initialized with state:",
        audioContext.state
      );
      initialized = true;

      // Trigger a silent sound to unlock audio on iOS/Safari
      const unlockAudio = (): void => {
        if (!audioContext) return;
        const silentBuffer = audioContext.createBuffer(1, 1, 22050);
        const source = audioContext.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(audioContext.destination);
        source.start(0);
        console.log("Audio unlocked via silent sound");
      };

      unlockAudio();

      // Add event listener to unlock audio on user interaction
      const unlockOnTouch = (): void => {
        unlockAudio();
        document.removeEventListener("touchstart", unlockOnTouch);
        document.removeEventListener("touchend", unlockOnTouch);
        document.removeEventListener("mousedown", unlockOnTouch);
        document.removeEventListener("keydown", unlockOnTouch);
        console.log("Audio unlocked via user interaction");
      };

      document.addEventListener("touchstart", unlockOnTouch);
      document.addEventListener("touchend", unlockOnTouch);
      document.addEventListener("mousedown", unlockOnTouch);
      document.addEventListener("keydown", unlockOnTouch);
    }
  } catch (error) {
    console.error("Error initializing audio:", error);
  }
};

// Create impulse response for reverb
function createImpulseResponse(
  context: AudioContext,
  duration: number,
  predelay: number
): AudioBuffer {
  const sampleRate = 44100;
  const length = sampleRate * duration;
  const impulse = context.createBuffer(2, length, sampleRate);
  const impulseL = impulse.getChannelData(0);
  const impulseR = impulse.getChannelData(1);

  // Predelay in samples
  const predelaySamples = Math.floor((predelay * sampleRate) / 1000);

  // Fill with noise and apply decay curve
  for (let i = 0; i < length; i++) {
    if (i < predelaySamples) {
      // Silent during predelay
      impulseL[i] = 0;
      impulseR[i] = 0;
    } else {
      // Random noise with exponential decay
      const decay = Math.exp((-4 * (i - predelaySamples)) / length);
      impulseL[i] = (Math.random() * 2 - 1) * decay;
      impulseR[i] = (Math.random() * 2 - 1) * decay;
    }
  }

  return impulse;
}

// Play a single note with multiple oscillators for richer sound
function playNote(
  frequency: number,
  duration: number,
  delay: number,
  velocity: number
): void {
  if (!audioContext) return;

  // Create oscillators for richer sound
  const oscillators = [
    { type: "sine" as OscillatorType, gain: 0.7 }, // Main sine wave
    { type: "triangle" as OscillatorType, gain: 0.2 }, // Add some triangle for harmonics
    { type: "square" as OscillatorType, gain: 0.05 }, // Tiny amount of square for edge
  ];

  // Create main gain for the note
  const mainGain = audioContext.createGain();
  mainGain.gain.value = 0;

  // Create filter for tone shaping
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 2000 + velocity * 2000; // Higher velocity = brighter sound
  filter.Q.value = 1;

  // Connect filter to main gain
  filter.connect(mainGain);

  // Create outputs - send to both direct output and reverb
  const dryGain = audioContext.createGain();
  dryGain.gain.value = 0.15;

  const wetGain = audioContext.createGain();
  wetGain.gain.value = 0.35;

  mainGain.connect(dryGain);
  dryGain.connect(audioContext.destination);

  mainGain.connect(wetGain);
  if (convolver) {
    wetGain.connect(convolver);
  }

  // Set up oscillator timing
  const startTime = audioContext.currentTime + (delay || 0);
  const endTime = startTime + duration;

  // Create and connect all oscillators
  const createdOscillators = oscillators.map((oscSettings) => {
    // Create oscillator with specified type
    const osc = audioContext!.createOscillator();
    osc.type = oscSettings.type;
    osc.frequency.value = frequency;

    // Add slight detune for chorus-like effect
    if (oscSettings.type !== "sine") {
      osc.detune.value = Math.random() * 10 - 5; // +/- 5 cents detune
    }

    // Create individual gain for this oscillator
    const oscGain = audioContext!.createGain();
    oscGain.gain.value = oscSettings.gain * velocity;

    // Connect oscillator to its gain, then to filter
    osc.connect(oscGain);
    oscGain.connect(filter);

    return { osc, gain: oscGain };
  });

  // Attack (fast - 10ms)
  mainGain.gain.setValueAtTime(0, startTime);
  mainGain.gain.linearRampToValueAtTime(velocity * 0.7, startTime + 0.01);

  // Release (50ms)
  mainGain.gain.setValueAtTime(velocity * 0.7, endTime - 0.05);
  mainGain.gain.linearRampToValueAtTime(0, endTime);

  // Start all oscillators
  createdOscillators.forEach(({ osc }) => {
    osc.start(startTime);
    osc.stop(endTime + 0.1);
  });

  // Clean up after playback
  setTimeout(() => {
    createdOscillators.forEach(({ osc, gain }) => {
      osc.disconnect();
      gain.disconnect();
    });
    filter.disconnect();
    mainGain.disconnect();
    dryGain.disconnect();
    wetGain.disconnect();
  }, (endTime - audioContext.currentTime + 0.2) * 1000);
}

// Define interfaces for chord types
interface ChordConfig {
  root: string;
  type: string;
  extensions?: number[];
}

// Simple chord voicing function
const buildChordVoicing = (
  rootNote: string,
  chordType: string,
  extensions: number[] = []
): string[] => {
  // Different voicing intervals depending on chord type - match original exactly
  let intervals: number[];

  switch (chordType) {
    case "major7":
      // Major 7th chord: Root, 3rd, 5th, 7th, 9th (matches original Cmaj7, Fmaj7)
      intervals = [0, 4, 7, 11];
      break;
    case "minor7":
      // Minor 7th chord: Root, minor 3rd, 5th, minor 7th, 9th (matches original Dmin7, Emin7, Amin7)
      intervals = [0, 3, 7, 10];
      break;
    case "dominant7":
      // Dominant 7th chord: Root, 3rd, 5th, minor 7th, 9th (matches original G7sus4)
      // Note: For G7sus4 we'd normally use [0, 5, 7, 10] but keeping same structure
      intervals = [0, 4, 7, 10];
      break;
    case "halfDiminished":
      // Half-diminished chord: Root, minor 3rd, diminished 5th, minor 7th, 9th (matches original Bm7b5)
      intervals = [0, 3, 6, 10];
      break;
    case "minor":
      // Minor triad: Root, minor 3rd, 5th
      intervals = [0, 3, 7];
      break;
    case "major":
    default:
      // Major triad: Root, 3rd, 5th
      intervals = [0, 4, 7];
      break;
  }

  // Add any extensions (like 9th)
  if (extensions && extensions.length > 0) {
    intervals = [...intervals, ...extensions];
  }

  // Convert intervals to actual notes
  const notes = intervals.map((interval) => {
    // Using Tone.js only for note calculation
    return Tone.Frequency(rootNote).transpose(interval).toNote();
  });

  return notes;
};

// Play chord with atmospheric reverb
export const playChordPad = async (chordRoot: string): Promise<void> => {
  // Only play on client side
  if (typeof window === 'undefined') return;
  
  if (!initialized) {
    await initAudio();
  }

  // Specific chord type mapping for the chord buttons
  const specificChordMap: Record<string, ChordConfig> = {
    // 7th chords
    Cmaj7: { root: "C4", type: "major7" },
    Dmin7: { root: "D4", type: "minor7" },
    Emin7: { root: "E4", type: "minor7" },
    Fmaj7: { root: "F4", type: "major7" },
    G7: { root: "G4", type: "dominant7" },
    Amin7: { root: "A4", type: "minor7" },
    Bm7b5: { root: "B4", type: "halfDiminished" },

    // Triads
    C: { root: "C4", type: "major" },
    Dm: { root: "D4", type: "minor" },
    Em: { root: "E4", type: "minor" },
    F: { root: "F4", type: "major" },
    G: { root: "G4", type: "major" },
    Am: { root: "A4", type: "minor" },
    Bdim: { root: "B4", type: "halfDiminished" },

    // 9th chords
    Cmaj9: { root: "C4", type: "major7", extensions: [14] },
    Dm9: { root: "D4", type: "minor7", extensions: [14] },
    Em9: { root: "E4", type: "minor7", extensions: [14] }, // Fixed duplicate key
    Fmaj9: { root: "F4", type: "major7", extensions: [14] },
    G9: { root: "G4", type: "dominant7", extensions: [14] },
    Am9: { root: "A4", type: "minor7", extensions: [14] },
    Bm7b5add9: { root: "B4", type: "halfDiminished", extensions: [14] }, // Fixed duplicate key
  };

  // Get the chord config from the map or use defaults
  const chordConfig = specificChordMap[chordRoot] || {
    root: "C4",
    type: "major",
  };
  const rootNote = chordConfig.root;
  const chordType = chordConfig.type;
  const extensions = chordConfig.extensions || [];

  // Get the bass note (two octaves lower)
  const bassRoot = Tone.Frequency(rootNote).transpose(-24).toNote();

  // Get the higher bass note (one octave lower)
  const bassRootHigher = Tone.Frequency(rootNote).transpose(-12).toNote();

  // Fifth above the bass
  const bassFifth = Tone.Frequency(rootNote)
    .transpose(-12 + 7)
    .toNote();

  // Get the chord voicing with extensions if present
  const chordVoicing = buildChordVoicing(rootNote, chordType, extensions);

  // Sort notes from low to high
  const sortedVoicing = [...chordVoicing].sort((a, b) => {
    return noteToFreq(a) - noteToFreq(b);
  });

  // Play the main bass note first
  playNote(noteToFreq(bassRoot), 0.5, 0, 0.8);

  // Play the higher bass note slightly delayed
  playNote(noteToFreq(bassRootHigher), 0.4, 0.08, 0.64);

  // Play the fifth above the bass slightly more delayed
  playNote(noteToFreq(bassFifth), 0.4, 0.12, 0.7);

  // Play the chord as a quick arpeggio
  sortedVoicing.forEach((note, index) => {
    const noteVelocity =
      index === sortedVoicing.length - 1 ? 0.36 : 0.6 * (1 - index * 0.08);
    const noteDelay = 0.15 + index * 0.05;
    playNote(noteToFreq(note), 0.2, noteDelay, noteVelocity);
  });
};

// Play Lydian Maj7 chord
export const playLydianMaj7Chord = async (): Promise<void> => {
  // Only play on client side
  if (typeof window === 'undefined') return;
  
  // Prevent spam clicking by limiting the number of simultaneous chord sounds
  if (activeLydianChords >= MAX_ACTIVE_CHORDS) {
    console.log(
      `Too many active chords (${activeLydianChords}). Ignoring click.`
    );
    return;
  }

  // Increment the counter
  activeLydianChords++;

  // Create a synth with extremely short envelope settings
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: "sine",
    },
    envelope: {
      attack: 0.1, // Keep attack fast
      decay: 0.1, // Keep decay fast
      sustain: 0.2, // Keep sustain low
      release: 0.8, // Increased from 0.5 to 0.8 to blend better with reverb
    },
  }).toDestination();

  // Keep volume low
  synth.volume.value = -17; // Increased from -20 to -17 (approx. 3dB louder)

  // Enhanced reverb with more presence
  const reverb = new Tone.Reverb({
    decay: 7.0, // Increased from 5.0 to 7.0 for longer tail
    wet: 0.95, // Increased from 0.8 to 0.95 for more pronounced reverb
    preDelay: 0.03, // Increased from 0.02 to 0.03 for more depth
  }).toDestination();
  synth.connect(reverb);

  // Possible chord types
  const chordTypes = [
    {
      name: "Maj7(9)",
      intervals: [0, 4, 7, 11, 14], // 1, 3, 5, 7, 9
    },
    {
      name: "Maj7(#11)",
      intervals: [0, 4, 7, 11, 18], // 1, 3, 5, 7, #11
    },
    {
      name: "Min(add9)",
      intervals: [0, 3, 7, 14], // 1, b3, 5, 9
    },
    {
      name: "Maj(add9)",
      intervals: [0, 4, 7, 14], // 1, 3, 5, 9
    },
    {
      name: "Min7(9)",
      intervals: [0, 3, 7, 10, 14], // 1, b3, 5, b7, 9
    },
  ];

  // Possible root notes (MIDI numbers for octave 3)
  const rootNotes = [48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59]; // C3 to B3

  // Select a random chord type and root note
  const randomChordType =
    chordTypes[Math.floor(Math.random() * chordTypes.length)];
  const randomRoot = rootNotes[Math.floor(Math.random() * rootNotes.length)];

  // Build the chord notes
  const chordNotes = randomChordType.intervals.map(
    (interval) => randomRoot + interval
  );

  // Get bass note (an octave lower)
  const bassNote = randomRoot - 12;

  // Get fifth note
  const fifthNote = randomRoot - 12 + 7;

  // Calculate note name for logging
  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const rootName = noteNames[randomRoot % 12];

  console.log(
    `Logo click: Playing random ${rootName} ${randomChordType.name} chord (active: ${activeLydianChords})`
  );

  // Sort chord notes from low to high to create a more natural strum
  const sortedChordNotes = [...chordNotes].sort((a, b) => a - b);

  // Add octave shift to the "2nd voice" (the 3rd in the sequence)
  if (sortedChordNotes.length >= 3) {
    // The 3rd note (index 2) should be shifted up an octave
    sortedChordNotes[2] += 12;
  }

  // Play the bass note first
  synth.triggerAttack(
    Tone.Frequency(bassNote, "midi").toFrequency(),
    Tone.now(),
    0.42
  );

  // Play the fifth after a short delay
  synth.triggerAttack(
    Tone.Frequency(fifthNote, "midi").toFrequency(),
    Tone.now() + 0.03,
    0.28
  );

  // Define a more pronounced strum effect
  const strumBaseDelay = 0.05; // Base delay between notes

  // Play the chord notes with a strum effect
  sortedChordNotes.forEach((note, index) => {
    // Create a more noticeable strum with progressively longer delays
    const strumDelay = strumBaseDelay * (index + 1) * 1.2;

    // Calculate velocity with a gradual curve
    const noteVelocity = Math.max(0.14, 0.42 - index * 0.056);

    synth.triggerAttack(
      Tone.Frequency(note, "midi").toFrequency(),
      Tone.now() + 0.06 + strumDelay, // Add strum timing
      noteVelocity
    );
  });

  // Release the notes quickly but leave enough time for reverb to develop
  setTimeout(() => {
    synth.releaseAll();

    // Dispose the synth and reverb after the reverb tail has finished
    setTimeout(() => {
      synth.dispose();
      reverb.dispose();

      // Decrement the counter after chord is fully complete
      activeLydianChords--;
      console.log(
        `Chord cleanup complete. Active chords: ${activeLydianChords}`
      );
    }, 5000); // Wait 5 seconds to match the reverb decay time
  }, 700); // Keep releasing notes after 0.7 seconds (still extremely short)
};

// Drum sound generators
const playKick = (time = 0): OscillatorNode | null => {
  if (!audioContext) return null;

  // Create oscillator for kick drum
  const osc = audioContext.createOscillator();
  const oscGain = audioContext.createGain();

  // Set up kick sound (frequency sweep from 150 to 40Hz)
  osc.frequency.value = 150;
  osc.frequency.exponentialRampToValueAtTime(
    40,
    audioContext.currentTime + time + 0.3
  );

  // Set up volume envelope - INCREASED VOLUME
  oscGain.gain.value = 1.2; // Increased from 0.8 to 1.2
  oscGain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + time + 0.4
  );

  // Connect nodes
  osc.connect(oscGain);
  oscGain.connect(audioContext.destination);

  // Play the kick
  osc.start(audioContext.currentTime + time);
  osc.stop(audioContext.currentTime + time + 0.4);

  return osc;
};

const playSnare = (time = 0): AudioBufferSourceNode | null => {
  if (!audioContext) return null;

  // Create noise for snare drum
  const bufferSize = audioContext.sampleRate * 0.1;
  const buffer = audioContext.createBuffer(
    1,
    bufferSize,
    audioContext.sampleRate
  );
  const data = buffer.getChannelData(0);

  // Fill buffer with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  // Create noise source and gain
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;

  const noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0.3; // Increased from 0.1 to 0.3
  noiseGain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + time + 0.2
  );

  // Add a bit of tone for the snare body
  const osc = audioContext.createOscillator();
  osc.frequency.value = 250;
  const oscGain = audioContext.createGain();
  oscGain.gain.value = 0.2; // Increased from 0.1 to 0.2
  oscGain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + time + 0.1
  );

  // Connect nodes
  noise.connect(noiseGain);
  noiseGain.connect(audioContext.destination);

  osc.connect(oscGain);
  oscGain.connect(audioContext.destination);

  // Play the snare
  noise.start(audioContext.currentTime + time);
  noise.stop(audioContext.currentTime + time + 0.2);

  osc.start(audioContext.currentTime + time);
  osc.stop(audioContext.currentTime + time + 0.1);

  return noise;
};

const playHihat = (time = 0, isOpen = false): AudioBufferSourceNode | null => {
  if (!audioContext) return null;

  // Create noise for hihat
  const bufferSize = audioContext.sampleRate * 0.05;
  const buffer = audioContext.createBuffer(
    1,
    bufferSize,
    audioContext.sampleRate
  );
  const data = buffer.getChannelData(0);

  // Fill buffer with white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  // Create noise source and gain
  const noise = audioContext.createBufferSource();
  noise.buffer = buffer;

  // Create a bandpass filter for hihat tone
  const filter = audioContext.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 8000;
  filter.Q.value = 5;

  const hihatGain = audioContext.createGain();
  hihatGain.gain.value = 0.3; // Increased from 0.15 to 0.3

  // Duration depends on open/closed hihat
  const duration = isOpen ? 0.3 : 0.05;
  hihatGain.gain.exponentialRampToValueAtTime(
    0.001,
    audioContext.currentTime + time + duration
  );

  // Connect nodes
  noise.connect(filter);
  filter.connect(hihatGain);
  hihatGain.connect(audioContext.destination);

  // Play the hihat
  noise.start(audioContext.currentTime + time);
  noise.stop(audioContext.currentTime + time + duration);

  return noise;
};

// Pattern timing (in 16th notes)
const KICK_PATTERN = [0, 4, 8, 12]; // Basic four-on-the-floor
const SNARE_PATTERN = [4, 12]; // On 2 and 4
const HIHAT_PATTERN = [0, 2, 4, 6, 8, 10, 12, 14]; // Eighth notes
const OPEN_HIHAT_PATTERN = [2, 6, 10, 14]; // Offbeat open hihats

// Keeps track of the drum pattern interval
let drumPatternInterval: number | null = null;

// Play a basic drum pattern alongside the chord progression
export const playDrumPattern = (bpm = 120): number | null => {
  // Only play on client side
  if (typeof window === 'undefined') return null;
  
  if (!initialized) {
    initAudio();
  }

  // Stop any existing pattern
  stopDrumPattern();

  // Calculate timing - chord changes happen every 2 seconds (120 BPM for quarter notes)
  const secondsPerBeat = 60 / bpm;
  const secondsPer16th = secondsPerBeat / 4;

  console.log(
    "Starting drum pattern at",
    bpm,
    "BPM, 16th note interval:",
    secondsPer16th * 1000,
    "ms"
  );

  // Keep track of current 16th note position
  let step = 0;

  // Create interval to play the pattern
  drumPatternInterval = window.setInterval(() => {
    // Play kick drum
    if (KICK_PATTERN.includes(step % 16)) {
      console.log("Playing kick at step", step % 16);
      playKick();
    }

    // Play snare drum
    if (SNARE_PATTERN.includes(step % 16)) {
      console.log("Playing snare at step", step % 16);
      playSnare();
    }

    // Play hihat (closed or open)
    if (HIHAT_PATTERN.includes(step % 16)) {
      const isOpen = OPEN_HIHAT_PATTERN.includes(step % 16);
      console.log(
        `Playing ${isOpen ? "open" : "closed"} hihat at step`,
        step % 16
      );
      playHihat(0, isOpen);
    }

    // Increment step
    step += 1;
  }, secondsPer16th * 1000);

  return drumPatternInterval;
};

// Stop the drum pattern
export const stopDrumPattern = (): void => {
  if (drumPatternInterval) {
    clearInterval(drumPatternInterval);
    drumPatternInterval = null;
  }
};
