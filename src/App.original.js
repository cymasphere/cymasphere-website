import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import * as Tone from 'tone';
import SynthSelector from './components/synth/SynthSelector';
import ChordBank from './components/synth/ChordBank';
import MIDIDeviceSelector from './components/synth/MIDIDeviceSelector';
import StopButton from './components/synth/StopButton';
import ParticleSystem from './components/synth/ParticleSystem';

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [midiOutput, setMidiOutput] = useState(null);
  const [midiAccess, setMidiAccess] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null);
  const [midiOutputs, setMidiOutputs] = useState([]);
  const [previousNotes, setPreviousNotes] = useState(null);
  const [activeNotes, setActiveNotes] = useState([]);
  const [selectedSynth, setSelectedSynth] = useState('polysynth');
  const [synth, setSynth] = useState(null);
  const [particleProps, setParticleProps] = useState({
    active: false,
    position: { x: 0, y: 0 },
    color: '#000000'
  });
  const [faqOpen, setFaqOpen] = useState(null);

  // Add effectsChainRef to store the effects chain
  const effectsChainRef = useRef(null);

  // Define available synth types
  const synthTypes = {
    internal: {
      name: 'Internal MIDI',
      create: () => null
    },
    polysynth: {
      name: 'Poly Synth',
      create: () => new Tone.PolySynth().toDestination()
    },
    fmsynth: {
      name: 'FM Synth',
      create: () => new Tone.FMSynth().toDestination()
    },
    amsynth: {
      name: 'AM Synth',
      create: () => new Tone.AMSynth().toDestination()
    },
    duosynth: {
      name: 'Duo Synth',
      create: () => new Tone.DuoSynth().toDestination()
    },
    padsynth: {
      name: 'Pad Synth',
      create: () => {
        const synth = new Tone.PolySynth(Tone.Synth, {
          oscillator: {
            type: 'sine'
          },
          envelope: {
            attack: 0.5,
            decay: 0.2,
            sustain: 0.8,
            release: 1.5
          }
        }).toDestination();
        synth.volume.value = -6; // Reduce volume slightly
        return synth;
      }
    }
  };

  // Initialize synth when type changes
  useEffect(() => {
    if (selectedSynth === 'internal') {
      setSynth(null);
      return;
    }

    const newSynth = synthTypes[selectedSynth].create();
    setSynth(newSynth);

    return () => {
      if (newSynth) {
        newSynth.dispose();
      }
    };
  }, [selectedSynth]);

  // Initialize synth when component mounts
  useEffect(() => {
    // Initialize the default synth (polysynth)
    if (selectedSynth !== 'internal' && !synth) {
      handleSynthChange({ target: { value: selectedSynth } });
    }
  }, [effectsChainRef.current]);

  // Handle synth type change
  const handleSynthChange = (event) => {
    const type = event.target.value;
    setSelectedSynth(type);
    
    if (type === 'internal') {
      if (synth) {
        // Clean up modulation components if they exist
        if (synth.modulation && typeof synth.modulation.dispose === 'function') {
          synth.modulation.dispose();
        }
        synth.dispose();
      }
      setSynth(null);
      return;
    }

    // Dispose of previous synth if it exists
    if (synth) {
      // Clean up modulation components if they exist
      if (synth.modulation && typeof synth.modulation.dispose === 'function') {
        synth.modulation.dispose();
      }
      synth.dispose();
    }
    
    // Make sure effects chain is initialized
    if (!effectsChainRef.current) return;
    
    let newSynth;
    
    // Custom effect chains for each synth type
    if (type === 'polysynth') {
      // Create a modulation network for the polysynth
      
      // Chorus for richness
      const chorus = new Tone.Chorus({
        frequency: 0.85,
        delayTime: 4,
        depth: 0.7,
        type: "sine",
        spread: 180,
        wet: 0.5
      }).connect(effectsChainRef.current.stereoWidener);
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
      newSynth = new Tone.PolySynth(Tone.Synth, {
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
      });
      
      // Create a filter after the synth
      const filter = new Tone.Filter({
        frequency: 1200,
        type: "lowpass",
        rolloff: -24,
        Q: 2
      }).connect(autoFilter);
      
      // Use AutoFilter instead of direct LFO connection for filter modulation
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
      effectsChainRef.current.reverb.wet.value = 0.4;
      effectsChainRef.current.delay.wet.value = 0.25;
      effectsChainRef.current.delay.delayTime.value = 0.25;
      effectsChainRef.current.delay.feedback.value = 0.35;
      effectsChainRef.current.chorus.wet.value = 0.35;
    }
    else if (type === 'fmsynth') {
      // Create a modulation network for the FM synth
      
      // Create a distinctive distortion for more edge
      const distortion = new Tone.Distortion({
        distortion: 0.3,
        wet: 0.3
      }).connect(effectsChainRef.current.stereoWidener);
      
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
      newSynth = new Tone.PolySynth(Tone.FMSynth, {
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
      });
      
      // Create a freeverb for additional space
      const freeverb = new Tone.Freeverb({
        roomSize: 0.8,
        dampening: 3000,
        wet: 0.3
      }).connect(bitCrusher);
      
      // Use dynamic parameter changes instead of direct LFO connections
      // Set up modulation via interval for better compatibility
      let modulationInterval = null;
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
        }
      };
      
      // Set effect parameters for fmsynth
      effectsChainRef.current.reverb.wet.value = 0.6;
      effectsChainRef.current.delay.wet.value = 0.35;
      effectsChainRef.current.delay.delayTime.value = 0.375;
      effectsChainRef.current.delay.feedback.value = 0.45;
      effectsChainRef.current.chorus.frequency.value = 0.6;
      effectsChainRef.current.chorus.depth = 0.7;
      effectsChainRef.current.stereoWidener.width.value = 0.9;
    }
    else if (type === 'padsynth') {
      // Create filter for padsynth
      const padFilter = new Tone.Filter({
        frequency: 1500,
        type: "lowpass",
        rolloff: -24,
        Q: 1.2
      }).connect(effectsChainRef.current.stereoWidener);
      
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
        volume: -12,
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
        volume: -16,
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
        volume: -14,
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
        volume: -20,
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
      newSynth = {
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
            voice1.triggerAttack(notes, time, velocity * 0.9);
            
            // Voice 2 plays an octave higher
            const notesUp = notes.map(n => {
              const freq = typeof n === 'number' ? n : Tone.Frequency(n).toFrequency();
              return freq * 2;
            });
            voice2.triggerAttack(notesUp, time, velocity * 0.6);
            
            // Voice 3 plays an octave lower (just the root note)
            if (notes.length > 0) {
              const rootNote = typeof notes[0] === 'number' ? notes[0] : Tone.Frequency(notes[0]).toFrequency();
              voice3.triggerAttack(rootNote * 0.5, time, velocity * 0.7);
            }
            
            // Voice 4 plays the same notes as voice 1 but with FM synthesis
            voice4.triggerAttack(notes, time, velocity * 0.5);
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
      };
      
      // Set effect parameters for padsynth - extreme ambience
      effectsChainRef.current.reverb.wet.value = 0.9;
      effectsChainRef.current.reverb.decay = 15;
      effectsChainRef.current.delay.wet.value = 0.7;
      effectsChainRef.current.delay.delayTime.value = 0.5;
      effectsChainRef.current.delay.feedback.value = 0.7;
      effectsChainRef.current.chorus.wet.value = 0.8;
      effectsChainRef.current.chorus.frequency.value = 0.3;
      effectsChainRef.current.chorus.delayTime = 8;
      effectsChainRef.current.chorus.depth = 0.9;
      effectsChainRef.current.stereoWidener.width.value = 1.0;
    }
    else {
      newSynth = null;
    }

    setSynth(newSynth);
  };

  // Convert MIDI note number to frequency
  const midiToFreq = (midiNote) => {
    return 440 * Math.pow(2, (midiNote - 69) / 12);
  };

  // Initialize MIDI
  useEffect(() => {
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess({ sysex: false })
        .then(access => {
          setMidiAccess(access);
          const outputs = Array.from(access.outputs.values());
          setMidiOutputs(outputs);
          
          if (outputs.length > 0) {
            setMidiOutput(outputs[0]);
            setSelectedPort(outputs[0].name);
          }

          access.onstatechange = (e) => {
            console.log('MIDI port state changed:', e.port.name, e.port.state);
            const updatedOutputs = Array.from(access.outputs.values());
            setMidiOutputs(updatedOutputs);
          };
        })
        .catch(err => console.error('MIDI access denied:', err));
    }

    // Initialize Tone.js
    Tone.start();

    return () => {
      if (midiOutput) {
        for (let channel = 0; channel < 16; channel++) {
          midiOutput.send([0xB0 + channel, 0x7B, 0]);
        }
      }
      if (synth) {
        synth.dispose();
      }
    };
  }, []);

  const handleMidiDeviceChange = (event) => {
    const selectedDevice = midiOutputs.find(device => device.name === event.target.value);
    if (selectedDevice) {
      setMidiOutput(selectedDevice);
      setSelectedPort(selectedDevice.name);
      console.log('Selected MIDI device:', selectedDevice.name);
    }
  };

  // Define chord voicings for each mode with bass notes
  const chordVoicings = {
    'C': [48, 60, 64, 67, 71],  // Cmaj7 (I) - C bass
    'D': [50, 62, 65, 69, 72],  // Dmin7 (ii) - D bass
    'E': [52, 64, 67, 71, 74],  // Emin7 (iii) - E bass
    'F': [53, 65, 69, 72, 76],  // Fmaj7 (IV) - F bass
    'G': [55, 67, 71, 74, 77],  // G7sus4 (V) - G bass
    'A': [57, 69, 72, 76, 79],  // Amin7 (vi) - A bass
    'B': [59, 71, 74, 77, 80]   // Bm7b5 (viiø) - B bass
  };

  // Define Roman numerals and chord names
  const chordInfo = {
    'C': { numeral: 'I', name: 'Cmaj7' },
    'D': { numeral: 'ii', name: 'Dmin7' },
    'E': { numeral: 'iii', name: 'Emin7' },
    'F': { numeral: 'IV', name: 'Fmaj7' },
    'G': { numeral: 'V', name: 'G7sus4' },
    'A': { numeral: 'vi', name: 'Amin7' },
    'B': { numeral: 'viiº', name: 'Bm7b5' }
  };

  // Function to find closest note within an octave
  const findClosestNote = (target, candidates) => {
    let closestNote = candidates[0];
    let minDistance = Math.abs((target % 12) - (candidates[0] % 12));
    
    candidates.forEach(note => {
      const distance = Math.abs((target % 12) - (note % 12));
      if (distance < minDistance) {
        minDistance = distance;
        closestNote = note;
      }
    });
    
    // Adjust the octave to be closest to the target
    const octaveAdjust = Math.round((target - (closestNote % 12)) / 12) * 12;
    return closestNote % 12 + octaveAdjust;
  };

  // Function to find optimal voice leading
  const findOptimalVoicing = (prevNotes, newChord) => {
    if (!prevNotes) return newChord;

    const bassNote = newChord[0]; // Keep bass note separate
    const prevUpperVoices = prevNotes.slice(1);
    const newUpperVoices = newChord.slice(1);
    
    // Find closest new notes to each previous note
    const voicedUpperNotes = prevUpperVoices.map((prevNote, index) => {
      // Get available notes for this voice (allow crossing voices)
      const availableNotes = newUpperVoices.map(note => {
        // Consider notes in nearby octaves
        return [note - 12, note, note + 12];
      }).flat();
      
      return findClosestNote(prevNote, availableNotes);
    });

    // Sort the voiced notes to maintain proper spacing
    voicedUpperNotes.sort((a, b) => a - b);
    
    return [bassNote, ...voicedUpperNotes];
  };

  // Function to stop all active notes
  const stopAllNotes = () => {
    if (selectedSynth === 'internal' && midiOutput) {
      // Handle MIDI note off
      activeNotes.forEach(note => {
        midiOutput.send([0x80, note, 0]);
      });
    } else if (synth) {
      try {
        // Properly handle Tone.js synth release
        synth.releaseAll();
      } catch (error) {
        console.warn('Error releasing synth notes:', error);
      }
    }
    
    // Clear active notes state
    setActiveNotes([]);
    setPreviousNotes(null);
  };

  // Update sendMidiChord to handle both MIDI output and synth
  const sendMidiChord = (note, isNoteOn = true) => {
    const chord = chordVoicings[note];
    const voicedChord = findOptimalVoicing(previousNotes, chord);
    const velocity = 100;
    const channel = 0;

    if (isNoteOn) {
      // Stop currently playing notes
      activeNotes.forEach(midiNote => {
        if (midiOutput && selectedSynth === 'internal') {
          console.log(`Sending Note Off: note=${midiNote}, channel=${channel + 1}`);
          midiOutput.send([0x80 + channel, midiNote, 0]);
        }
        if (synth && selectedSynth !== 'internal') {
          synth.triggerRelease(midiToFreq(midiNote));
        }
      });

      // Send Note On for each note in the chord
      voicedChord.forEach((midiNote, index) => {
        setTimeout(() => {
          if (midiOutput && selectedSynth === 'internal') {
            console.log(`Sending Note On: note=${midiNote}, velocity=${velocity}, channel=${channel + 1}`);
            midiOutput.send([0x90 + channel, midiNote, velocity]);
          }
          if (synth && selectedSynth !== 'internal') {
            synth.triggerAttack(midiToFreq(midiNote), Tone.now(), 0.7); // Add velocity parameter 
          }
        }, index * 20); // Slight arpeggio effect
      });

      setPreviousNotes(voicedChord);
      setActiveNotes(voicedChord);
    }
  };

  const playSound = (mode) => {
    // Stop any currently playing notes first
    stopAllNotes();
    
    if (selectedSynth === 'internal') {
      sendMidiChord(mode.note);
      return;
    }

    if (!synth) return;

    const baseNote = mode.note;
    let chord = [];
    
    // Generate notes for the chord based on chord type
    switch (mode.name) {
      case 'Cmaj7':
        chord = [0, 4, 7, 11]; // Major 7th chord
        break;
      case 'Dmin7': 
        chord = [0, 3, 7, 10]; // Minor 7th chord
        break;
      case 'Emin7':
        chord = [0, 3, 7, 10]; // Minor 7th chord
        break;
      case 'Fmaj7':
        chord = [0, 4, 7, 11]; // Major 7th chord
        break;
      case 'G7sus4':
        chord = [0, 5, 7, 10]; // 7sus4 chord
        break;
      case 'Amin7':
        chord = [0, 3, 7, 10]; // Minor 7th chord
        break;
      case 'Bm7b5':
        chord = [0, 3, 6, 10]; // Half-diminished chord
        break;
      default:
        chord = [0, 4, 7]; // Major triad as fallback
    }

    // Map note names to MIDI numbers
    const noteToMidi = {
      'C': 60, 'D': 62, 'E': 64, 'F': 65, 'G': 67, 'A': 69, 'B': 71
    };
    
    const baseMidi = noteToMidi[baseNote];
    
    // Calculate optimal voicing for the chord
    let voicing = chord.map(interval => baseMidi + interval);
    
    // Use voice leading algorithm if we have previous notes
    if (previousNotes) {
      voicing = findOptimalVoicing(previousNotes, voicing);
    }
    
    // Store for next voice leading calculation
    setPreviousNotes(voicing);
    
    // Convert MIDI numbers to frequencies for the synth
    const frequencies = voicing.map(note => midiToFreq(note));
    
    // Add slight staggering for more natural sound
    frequencies.forEach((freq, i) => {
      const time = Tone.now() + (i * 0.03);
      const velocity = 0.7 - (i * 0.05); // Slightly quieter for upper voices
      synth.triggerAttack(freq, time, velocity);
    });
    
    // Store for note off
    setActiveNotes(voicing);
    
    // Update particle props for visual feedback
    const buttonElement = document.querySelector(`[data-note="${mode.note}"]`);
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const position = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };
      
      setParticleProps({
        active: true,
        position,
        color: mode.color
      });
    }
    
    // Reset particle system after animation
    setTimeout(() => {
      setParticleProps(prev => ({ ...prev, active: false }));
    }, 1000);
  };
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const toggleFaq = (index) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Add debug info to the UI
  const debugInfo = midiAccess ? (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'rgba(0,0,0,0.8)',
      padding: '10px',
      borderRadius: '5px',
      color: 'white',
      fontSize: '12px',
      zIndex: 1000
    }}>
      <div>Selected MIDI Port: {selectedPort || 'None'}</div>
      <div>MIDI Status: {midiOutput ? 'Connected' : 'Not Connected'}</div>
    </div>
  ) : null;

  // Initialize effects chain when component mounts
  useEffect(() => {
    const initializeEffectsChain = async () => {
      // Master effects chain
      const masterLimiter = new Tone.Limiter(-1).toDestination();
      
      const masterCompressor = new Tone.Compressor({
        ratio: 4,
        threshold: -15,
        release: 0.5,
        attack: 0.05
      }).connect(masterLimiter);
      
      // Create a shared reverb that will be used by all synths
      const sharedReverb = new Tone.Reverb({
        decay: 10,
        preDelay: 0.1,
        wet: 0.6
      }).connect(masterCompressor);
      
      // Create a shared delay effect
      const sharedDelay = new Tone.PingPongDelay({
        delayTime: "8n",
        feedback: 0.4,
        wet: 0.3
      }).connect(sharedReverb);
      
      // Create a shared chorus effect
      const sharedChorus = new Tone.Chorus({
        frequency: 1.5,
        delayTime: 3.5,
        depth: 0.7,
        type: "sine",
        spread: 180,
        wet: 0.3
      }).start().connect(sharedDelay);
      
      // Create a shared stereo widener
      const stereoWidener = new Tone.StereoWidener(0.7).connect(sharedChorus);
      
      // Wait for reverb to generate its impulse response
      await sharedReverb.generate();
      
      // Store the effects chain in a ref or state
      effectsChainRef.current = {
        reverb: sharedReverb,
        compressor: masterCompressor,
        limiter: masterLimiter,
        chorus: sharedChorus,
        delay: sharedDelay,
        stereoWidener: stereoWidener
      };
    };
    
    initializeEffectsChain();
    
    return () => {
      // Clean up effects when component unmounts
      if (effectsChainRef.current) {
        Object.values(effectsChainRef.current).forEach(effect => {
          if (effect && effect.dispose) effect.dispose();
        });
      }
    };
  }, []);

  return (
    <div className="App">
      {/* Header */}
      <header style={{
        backgroundColor: scrolled ? 'rgba(18, 18, 18, 0.95)' : '#121212',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        width: '100%',
        top: 0,
        left: 0,
        zIndex: 1000,
        boxShadow: scrolled ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={process.env.PUBLIC_URL + '/logo.png'} 
            alt="Cymasphere" 
            style={{ 
              height: '40px', 
              width: 'auto',
              marginRight: '15px',
              verticalAlign: 'middle'
            }}
          />
          <h2 style={{
            margin: 0,
            fontFamily: "'Montserrat', 'Helvetica Neue', sans-serif",
            fontSize: '1.4rem',
            fontWeight: '600',
            letterSpacing: '3px',
            color: 'white',
            textTransform: 'uppercase'
          }}>
            Cymasphere
          </h2>
        </div>
        
        <div className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
          display: 'none',
          cursor: 'pointer',
          zIndex: 1001,
          position: 'relative'
        }}>
          <div style={{
            width: '30px',
            height: '3px',
            backgroundColor: mobileMenuOpen ? 'transparent' : 'white',
            margin: '6px 0',
            transition: 'all 0.3s ease',
            position: 'relative',
            transform: mobileMenuOpen ? 'rotate(45deg)' : 'none'
          }}></div>
          <div style={{
            width: '30px',
            height: '3px',
            backgroundColor: 'white',
            margin: '6px 0',
            transition: 'all 0.3s ease',
            opacity: mobileMenuOpen ? 0 : 1
          }}></div>
          <div style={{
            width: '30px',
            height: '3px',
            backgroundColor: 'white',
            margin: '6px 0',
            transition: 'all 0.3s ease',
            position: 'relative',
            transform: mobileMenuOpen ? 'rotate(-45deg) translate(7px, -7px)' : 'none'
          }}></div>
        </div>
        
        <nav style={{
          transition: 'all 0.3s ease',
          '@media (max-width: 480px)': {
            position: 'fixed',
            top: 0,
            right: mobileMenuOpen ? 0 : '-100%',
            width: '70%',
            height: '100vh',
            backgroundColor: '#121212',
            boxShadow: '-5px 0 15px rgba(0,0,0,0.3)',
            padding: '5rem 2rem 2rem',
            zIndex: 1000
          }
        }}>
          <ul style={{ 
            display: 'flex', 
            listStyle: 'none', 
            margin: 0, 
            gap: '2rem',
            '@media (max-width: 480px)': {
              flexDirection: 'column',
              alignItems: 'flex-start'
            }
          }}>
            <li><a href="#features" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Features</a></li>
            <li><a href="#demo" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Demo</a></li>
            <li><a href="#testimonials" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Testimonials</a></li>
            <li><a href="#pricing" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Pricing</a></li>
            <li><a href="#contact" style={{ color: 'white', textDecoration: 'none', fontWeight: 500 }}>Contact</a></li>
            <li><a href="#download" style={{ color: 'white', textDecoration: 'none', background: '#00bcd4', padding: '0.5rem 1rem', borderRadius: '4px' }}>Download</a></li>
          </ul>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999
        }}></div>
      )}

      {/* Hero Section */}
      <section style={{ 
        backgroundColor: '#121212', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'white',
        padding: '120px 20px 80px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(108, 99, 255, 0.1), transparent 50%), radial-gradient(circle at 70% 30%, rgba(78, 205, 196, 0.1), transparent 50%)',
          zIndex: 1
        }}></div>

        {/* Animated circles */}
        <div className="floating" style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(108, 99, 255, 0.05), transparent 70%)',
          top: '20%',
          left: '10%',
          animationDelay: '0s',
          animationDuration: '7s',
          zIndex: 0
        }}></div>
        
        <div className="floating" style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at center, rgba(0, 188, 212, 0.05), transparent 70%)',
          bottom: '15%',
          right: '10%',
          animationDelay: '0.5s',
          animationDuration: '5s',
          zIndex: 0
        }}></div>

        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '3rem',
          alignItems: 'center',
          zIndex: 2
        }}>
          <div style={{
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}>
            <h1 style={{ 
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              marginBottom: '20px',
              backgroundImage: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2
            }}>
              Advanced Music Theory & Composition Tool
            </h1>
            <p style={{ 
              fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
              marginBottom: '40px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              Cymasphere transforms how musicians compose by generating sophisticated chord voicings with proper voice leading. Our intelligent algorithms analyze chord progressions to create smooth, professional-sounding harmonies while handling complex music theory—so you can focus on creativity.
            </p>
            <div style={{ marginBottom: '30px' }}>
              <ul style={{ 
                listStyle: 'none', 
                margin: '0 0 20px 0', 
                padding: 0,
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: 'clamp(0.9rem, 1.2vw, 1.1rem)'
              }}>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#4ECDC4', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                  Multiple voice leading modes: Similar, Oblique, and Best Choice
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#4ECDC4', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                  Access 200+ scales including modes of major, harmonic minor, melodic minor
                </li>
                <li style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ color: '#4ECDC4', marginRight: '10px', fontWeight: 'bold' }}>✓</span>
                  Seamless integration with all major DAWs via MIDI I/O
                </li>
              </ul>
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <button className="primary" style={{ 
                backgroundColor: '#6C63FF', 
                color: 'white', 
                border: 'none', 
                padding: '15px 30px', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                transition: 'transform 0.2s ease, background 0.2s ease'
              }}>
                Download Now
              </button>
              <button className="secondary" style={{ 
                backgroundColor: 'transparent', 
                color: 'white', 
                border: '2px solid #6C63FF', 
                padding: '15px 30px', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                transition: 'transform 0.2s ease, background 0.2s ease'
              }}>
                Watch Demo
              </button>
            </div>
            
            {/* Trust badges */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginTop: '3rem',
              gap: '2rem',
              flexWrap: 'wrap'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.9rem'
              }}>
                <span style={{ marginRight: '8px' }}>🔒</span>
                Trusted by 10,000+ musicians
              </div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '0.9rem'
              }}>
                <span style={{ marginRight: '8px' }}>🎹</span>
                Works with all major DAWs
              </div>
            </div>
          </div>
          
          <div style={{ position: 'relative' }}>
            {/* App Interface Mockup */}
            <div style={{ 
              background: '#1A1A1A',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              position: 'relative',
              zIndex: 2
            }}>
              {/* App Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)', 
                paddingBottom: '15px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  backgroundImage: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 'bold',
                  fontSize: '1.2rem'
                }}>Cymasphere</div>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FF6B6B' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#FFC107' }}></div>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#4CAF50' }}></div>
                </div>
              </div>
              
              {/* App Content */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {/* Chord Section */}
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: '8px', 
                  padding: '15px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ marginBottom: '10px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>Chord Progression</div>
                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {['Cmaj7', 'Am7', 'Fmaj7', 'G7'].map((chord, i) => (
                      <div key={i} style={{ 
                        padding: '10px 15px', 
                        background: i === 1 ? 'rgba(108, 99, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '4px',
                        border: i === 1 ? '1px solid rgba(108, 99, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                        minWidth: '60px',
                        textAlign: 'center'
                      }}>
                        {chord}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Piano Roll Section */}
                <div style={{ 
                  background: 'rgba(0, 0, 0, 0.2)', 
                  borderRadius: '8px', 
                  padding: '15px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  height: '120px'
                }}>
                  <div style={{ marginBottom: '10px', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>Voice Leading</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', height: '80px' }}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <div key={i} style={{ 
                        height: '12px', 
                        background: 'rgba(20, 20, 20, 0.8)',
                        borderRadius: '2px',
                        position: 'relative'
                      }}>
                        {/* Notes */}
                        <div style={{ 
                          position: 'absolute', 
                          height: '10px', 
                          width: '20px', 
                          background: `rgba(${i % 2 === 0 ? '108, 99, 255' : '78, 205, 196'}, 0.7)`,
                          borderRadius: '2px',
                          top: '1px',
                          left: `${30 + i * 10}px`
                        }}></div>
                        <div style={{ 
                          position: 'absolute', 
                          height: '10px', 
                          width: '20px', 
                          background: `rgba(${i % 2 === 0 ? '108, 99, 255' : '78, 205, 196'}, 0.7)`,
                          borderRadius: '2px',
                          top: '1px',
                          left: `${100 + i * 15}px`
                        }}></div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Controls Section */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>▶</div>
                    <div style={{ 
                      width: '30px', 
                      height: '30px', 
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>■</div>
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>Voice Leading: Optimal</div>
                </div>
              </div>
            </div>
            
            {/* Floating musical notes */}
            <div className="floating-note" style={{
              position: 'absolute',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              top: '10%',
              left: '-5%',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
              zIndex: 3,
              animationDuration: '3s',
              animationDelay: '0s'
            }}>♪</div>
            
            <div className="floating-note" style={{
              position: 'absolute',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4ECDC4, #6C63FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              top: '20%',
              right: '-5%',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
              zIndex: 3,
              animationDuration: '4s',
              animationDelay: '0.5s'
            }}>♫</div>
            
            <div className="floating-note" style={{
              position: 'absolute',
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6B6B, #6C63FF)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              bottom: '5%',
              left: '10%',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
              zIndex: 3,
              animationDuration: '3.5s',
              animationDelay: '1s'
            }}>♩</div>
          </div>
        </div>
      </section>

      {/* Try Me Section */}
      <section style={{
        padding: '100px 20px',
        backgroundColor: '#1E1E1E',
        color: 'white',
        background: 'radial-gradient(circle at 30% 50%, rgba(108, 99, 255, 0.1), transparent 50%), radial-gradient(circle at 70% 30%, rgba(78, 205, 196, 0.1), transparent 50%)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <h2 style={{
            marginBottom: '40px',
            fontSize: '2.5rem'
          }}>Try Me</h2>
          
          <div style={{
            marginBottom: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            {/* Sound Source Selector */}
            <div style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              width: '100%',
              maxWidth: '600px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => handleSynthChange({ target: { value: 'internal' } })}
                style={{
                  padding: '15px',
                  borderRadius: '10px',
                  backgroundColor: selectedSynth === 'internal' ? '#6C63FF' : 'rgba(30, 30, 30, 0.5)',
                  border: '1px solid ' + (selectedSynth === 'internal' ? '#6C63FF' : 'rgba(255, 255, 255, 0.1)'),
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  minWidth: '80px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '24px' }}>🎹</span>
                <span style={{ fontSize: '0.8rem' }}>MIDI</span>
              </button>
              <button
                onClick={() => handleSynthChange({ target: { value: 'polysynth' } })}
                style={{
                  padding: '15px',
                  borderRadius: '10px',
                  backgroundColor: selectedSynth === 'polysynth' ? '#6C63FF' : 'rgba(30, 30, 30, 0.5)',
                  border: '1px solid ' + (selectedSynth === 'polysynth' ? '#6C63FF' : 'rgba(255, 255, 255, 0.1)'),
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  minWidth: '80px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '24px' }}>🎵</span>
                <span style={{ fontSize: '0.8rem' }}>Poly</span>
              </button>
              <button
                onClick={() => handleSynthChange({ target: { value: 'fmsynth' } })}
                style={{
                  padding: '15px',
                  borderRadius: '10px',
                  backgroundColor: selectedSynth === 'fmsynth' ? '#6C63FF' : 'rgba(30, 30, 30, 0.5)',
                  border: '1px solid ' + (selectedSynth === 'fmsynth' ? '#6C63FF' : 'rgba(255, 255, 255, 0.1)'),
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  minWidth: '80px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '24px' }}>🎛️</span>
                <span style={{ fontSize: '0.8rem' }}>FM</span>
              </button>
              <button
                onClick={() => handleSynthChange({ target: { value: 'padsynth' } })}
                style={{
                  padding: '15px',
                  borderRadius: '10px',
                  backgroundColor: selectedSynth === 'padsynth' ? '#6C63FF' : 'rgba(30, 30, 30, 0.5)',
                  border: '1px solid ' + (selectedSynth === 'padsynth' ? '#6C63FF' : 'rgba(255, 255, 255, 0.1)'),
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '5px',
                  minWidth: '80px',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ fontSize: '24px' }}>🎼</span>
                <span style={{ fontSize: '0.8rem' }}>Pad</span>
              </button>
            </div>

            {/* Show MIDI Device selector only when internal MIDI is selected */}
            {selectedSynth === 'internal' && (
              <select
                value={selectedPort || ''}
                onChange={handleMidiDeviceChange}
                style={{
                  padding: '10px',
                  borderRadius: '5px',
                  backgroundColor: '#2A2A2A',
                  color: 'white',
                  border: '1px solid #444',
                  marginBottom: '20px',
                  width: '300px'
                }}
              >
                <option value="">Select MIDI Output</option>
                {midiOutputs.map(device => (
                  <option key={device.id} value={device.name}>
                    {device.name}
                  </option>
                ))}
              </select>
            )}

            {/* Chord Buttons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 100px)',
              gap: '10px',
              maxWidth: '1440px',
              margin: '0 auto',
              padding: '40px',
              overflowX: 'auto',
              justifyContent: 'center',
              backgroundColor: 'rgba(30, 30, 30, 0.3)', // Subtle background instead of image
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              marginBottom: '20px'
            }}>
              {[
                { note: 'C', name: 'Cmaj7', color: '#8A2BE2', hue: '271deg' },
                { note: 'D', name: 'Dmin7', color: '#7B42E5', hue: '260deg' },
                { note: 'E', name: 'Emin7', color: '#6C5AE8', hue: '249deg' },
                { note: 'F', name: 'Fmaj7', color: '#4B7BE8', hue: '225deg' },
                { note: 'G', name: 'G7sus4', color: '#20A4E8', hue: '200deg' },
                { note: 'A', name: 'Amin7', color: '#20C5D5', hue: '187deg' },
                { note: 'B', name: 'Bm7b5', color: '#20D5CB', hue: '175deg' }
              ].map((mode, index) => (
                <div key={mode.note} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  minWidth: '100px'
                }}>
                  <div style={{
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '8px'
                  }}>
                    {chordInfo[mode.note].numeral}
                  </div>
                  <div 
                    data-note={mode.note}
                    onClick={() => playSound(mode)}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '8px',
                      backgroundColor: mode.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: 'white',
                      transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                      userSelect: 'none'
                    }}
                    onMouseDown={(e) => {
                      e.currentTarget.style.transform = 'scale(0.95)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.2)';
                    }}
                  >
                    {mode.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Stop Button */}
            <button
              onClick={stopAllNotes}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                backgroundColor: '#FF3366',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                width: '300px',
                fontWeight: 'bold',
                transition: 'all 0.3s ease'
              }}
            >
              Stop All Notes
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '100px 20px',
        backgroundColor: '#1E1E1E',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 30%, rgba(108, 99, 255, 0.05), transparent 40%)',
          zIndex: 0
        }}></div>
        
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <h2 style={{ 
            marginBottom: '20px',
            position: 'relative',
            display: 'inline-block',
            fontSize: 'clamp(2rem, 3vw, 2.5rem)'
          }}>
            Powerful Features
            <span style={{
              position: 'absolute',
              bottom: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '3px',
              background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)'
            }}></span>
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 'clamp(1rem, 1.2vw, 1.2rem)',
            maxWidth: '700px',
            margin: '0 auto 60px'
          }}>
            Cymasphere combines advanced music theory with intuitive controls to help you create beautiful chord progressions with perfect voice leading.
          </p>

          <div className="feature-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            marginTop: '40px'
          }}>
            {/* Feature Cards */}
            {[
              { 
                icon: '🎵', 
                title: 'Advanced Voice Leading', 
                desc: 'Generate musically correct chord voicings with smooth voice leading between chord changes. Choose from multiple voice leading modes including Similar, Oblique, and Best Choice for different musical contexts.'
              },
              { 
                icon: '🎹', 
                title: 'Comprehensive Scale Library', 
                desc: 'Access a vast library of over 200 scales including modes of major, harmonic minor, melodic minor, harmonic major, and symmetrical scales to explore rich harmonic possibilities and exotic tonalities.'
              },
              { 
                icon: '🎼', 
                title: 'Intelligent Chord Voicing', 
                desc: 'Create sophisticated chord voicings with proper spacing, voice distribution, and musical context awareness. Control inversions, bass notes, and voice count for complete customization.'
              },
              { 
                icon: '🎚️', 
                title: 'Expressive Performance Controls', 
                desc: 'Fine-tune your musical expression with dynamic controls, strum simulation, sustain management, and velocity parameters for realistic performances that breathe life into your compositions.'
              },
              { 
                icon: '🎛️', 
                title: 'MIDI Integration', 
                desc: 'Seamlessly integrate with your DAW through comprehensive MIDI input/output capabilities. Control external instruments or use as a virtual instrument with complete synchronization.'
              },
              { 
                icon: '⏱️', 
                title: 'Metronome & Timing', 
                desc: 'Stay in perfect time with the built-in metronome featuring count-off functionality and synchronization with your DAW\'s transport controls for precise rhythmic performance.'
              }
            ].map((feature, index) => (
              <div key={index} className="feature-card" style={{
                backgroundColor: 'rgba(30, 30, 30, 0.5)',
                borderRadius: '10px',
                padding: '30px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                textAlign: 'left',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  fontSize: '2rem',
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ 
                  marginBottom: '15px',
                  fontSize: 'clamp(1.2rem, 1.5vw, 1.5rem)'
                }}>{feature.title}</h3>
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: 'clamp(0.9rem, 1vw, 1rem)',
                  lineHeight: '1.6',
                  flex: '1'
                }}>{feature.desc}</p>
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '60px',
            background: 'rgba(0, 0, 0, 0.2)',
            padding: '30px',
            borderRadius: '10px',
            border: '1px solid rgba(108, 99, 255, 0.1)'
          }}>
            <h3 style={{ marginBottom: '20px', color: 'rgba(255, 255, 255, 0.9)' }}>Compatible with All Major DAWs</h3>
            <div style={{ 
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '30px'
            }}>
              {['Logic Pro', 'Ableton Live', 'FL Studio', 'Pro Tools', 'Cubase', 'Studio One'].map((daw, index) => (
                <div key={index} style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '30px',
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  {daw}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" style={{
        padding: '100px 20px',
        backgroundColor: '#121212',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          position: 'relative',
          zIndex: 2
        }}>
          <div className="demo-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '50px',
            alignItems: 'center'
          }}>
            <div>
              <h2 style={{ 
                marginBottom: '20px',
                position: 'relative',
                fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                textAlign: 'left'
              }}>
                See Cymasphere in Action
                <span style={{
                  position: 'absolute',
                  bottom: '-15px',
                  left: '0',
                  width: '80px',
                  height: '3px',
                  background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)'
                }}></span>
              </h2>
              
              <p style={{
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: 'clamp(1rem, 1.2vw, 1.2rem)',
                marginBottom: '30px',
                lineHeight: '1.6'
              }}>
                Watch how Cymasphere transforms simple chord progressions into rich, professional voicings with perfect voice leading. Our intelligent algorithms handle the music theory so you can focus on creativity.
              </p>
              
              <ul style={{
                listStyle: 'none',
                padding: '0',
                margin: '0 0 30px 0'
              }}>
                {[
                  'Save hours of composition time with instant, musically correct voicings',
                  'Eliminate theory guesswork with intelligent chord suggestions',
                  'Create professional-sounding progressions even with limited music theory knowledge',
                  'Experiment with different voicing styles to find the perfect sound',
                  'Seamlessly integrate with your existing workflow and DAW'
                ].map((item, index) => (
                  <li key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: '15px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: 'clamp(0.9rem, 1vw, 1rem)'
                  }}>
                    <div style={{
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '15px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>✓</div>
                    {item}
                  </li>
                ))}
              </ul>
              
              <button className="primary" style={{ 
                backgroundColor: '#6C63FF', 
                color: 'white', 
                border: 'none', 
                padding: '15px 30px', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'transform 0.2s ease, background 0.2s ease'
              }}>
                <span style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem'
                }}>▶</span>
                Watch Full Tutorial
              </button>
            </div>
            
            <div>
              <div style={{
                position: 'relative',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                aspectRatio: '16/9'
              }}>
                <div style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div className="play-button" style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </div>
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: '10px 15px',
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.9)'
                  }}>
                    Cymasphere Tutorial - Voice Leading Fundamentals (4:32)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 70% 30%, rgba(108, 99, 255, 0.05), transparent 50%), radial-gradient(circle at 30% 70%, rgba(78, 205, 196, 0.05), transparent 50%)',
          zIndex: 1
        }}></div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" style={{
        padding: '100px 20px',
        backgroundColor: '#1E1E1E',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 70%, rgba(108, 99, 255, 0.05), transparent 50%), radial-gradient(circle at 80% 30%, rgba(78, 205, 196, 0.05), transparent 50%)',
          zIndex: 0
        }}></div>
        
        {/* Decorative notes */}
        <div className="floating-note" style={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          color: 'rgba(108, 99, 255, 0.1)',
          fontSize: '5rem',
          zIndex: 1,
          animationDuration: '7s'
        }}>♪</div>
        
        <div className="floating-note" style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          color: 'rgba(78, 205, 196, 0.1)',
          fontSize: '4rem',
          zIndex: 1,
          animationDuration: '5s',
          animationDelay: '1s'
        }}>♫</div>
        
        <div className="floating-note" style={{
          position: 'absolute',
          top: '60%',
          right: '20%',
          color: 'rgba(108, 99, 255, 0.1)',
          fontSize: '3.5rem',
          zIndex: 1,
          animationDuration: '6s',
          animationDelay: '0.5s'
        }}>♩</div>
        
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
          textAlign: 'center'
        }}>
          <h2 style={{ 
            marginBottom: '20px',
            position: 'relative',
            display: 'inline-block',
            fontSize: 'clamp(2rem, 3vw, 2.5rem)'
          }}>
            What Our Users Say
            <span style={{
              position: 'absolute',
              bottom: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '3px',
              background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)'
            }}></span>
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 'clamp(1rem, 1.2vw, 1.2rem)',
            maxWidth: '700px',
            margin: '0 auto 60px'
          }}>
            Hear from composers and musicians who have transformed their workflow with Cymasphere's intelligent voice leading technology.
          </p>
          
          <div className="testimonial-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '30px',
            marginBottom: '40px'
          }}>
            {[
              {
                avatar: '👨‍🎨',
                name: 'Michael Rodriguez',
                title: 'Film Composer',
                rating: 5,
                comment: "Cymasphere has completely transformed my composition workflow. The voice leading algorithms are incredibly intelligent, and I can generate complex chord voicings in seconds that would have taken me hours to write out manually."
              },
              {
                avatar: '👩‍🎤',
                name: 'Sarah Johnson',
                title: 'Music Producer',
                rating: 5,
                comment: "As someone who didn't formally study music theory, Cymasphere has been a game-changer. The voice leading algorithms are intuitive and the interface is easy to navigate. Now I can create sophisticated chord progressions without getting stuck on the theory."
              },
              {
                avatar: '👨‍🏫',
                name: 'David Chen',
                title: 'Music Educator',
                rating: 4,
                comment: "I use Cymasphere in my advanced composition classes to help students understand complex chord relationships. It's an invaluable teaching tool that visualizes voice leading principles in a way that's immediately understandable."
              }
            ].map((testimonial, index) => (
              <div key={index} className="testimonial-card" style={{
                backgroundColor: 'rgba(30, 30, 30, 0.5)',
                borderRadius: '10px',
                padding: '30px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                textAlign: 'left',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                position: 'relative',
                zIndex: 1
              }}>
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  fontSize: '3rem',
                  color: 'rgba(108, 99, 255, 0.1)',
                  fontFamily: 'serif',
                  lineHeight: 1
                }}>❝</div>
                
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    marginRight: '15px'
                  }}>
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h3 style={{ 
                      marginBottom: '5px',
                      fontSize: 'clamp(1.1rem, 1.2vw, 1.3rem)'
                    }}>{testimonial.name}</h3>
                    <p style={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.9rem',
                      margin: 0
                    }}>{testimonial.title}</p>
                  </div>
                </div>
                
                <p style={{ 
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: 'clamp(0.9rem, 1vw, 1rem)',
                  lineHeight: '1.6',
                  marginBottom: '20px',
                  minHeight: '120px'
                }}>{testimonial.comment}</p>
                
                <div style={{ display: 'flex' }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} style={{ 
                      color: i < testimonial.rating ? '#FFC107' : 'rgba(255, 255, 255, 0.2)',
                      marginRight: '5px',
                      fontSize: '1.2rem'
                    }}>★</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button className="secondary" style={{ 
            backgroundColor: 'transparent', 
            color: 'white', 
            border: '2px solid #6C63FF', 
            padding: '15px 30px', 
            borderRadius: '5px', 
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 'bold',
            transition: 'transform 0.2s ease, background 0.2s ease'
          }}>
            View More Testimonials
          </button>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{
        padding: '100px 20px',
        backgroundColor: '#121212',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 70% 20%, rgba(108, 99, 255, 0.05), transparent 50%), radial-gradient(circle at 30% 80%, rgba(78, 205, 196, 0.05), transparent 50%)',
          zIndex: 0
        }}></div>
        
        <div style={{ 
          maxWidth: '1000px', 
          margin: '0 auto', 
          textAlign: 'center',
          position: 'relative',
          zIndex: 2
        }}>
          <h2 style={{ 
            marginBottom: '20px',
            position: 'relative',
            display: 'inline-block'
          }}>
            Frequently Asked Questions
            <span style={{
              position: 'absolute',
              bottom: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '3px',
              background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)'
            }}></span>
          </h2>
          
          <p style={{ 
            maxWidth: '700px', 
            margin: '0 auto', 
            marginBottom: '60px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Find answers to commonly asked questions about Cymasphere and its capabilities.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {[
              { 
                question: "What is voice leading and how does Cymasphere implement it?", 
                answer: "Voice leading is the way individual voices or notes move from chord to chord. Cymasphere uses advanced algorithms to ensure smooth voice leading by minimizing the distance each note moves between chords, avoiding parallel fifths/octaves, and resolving tendency tones correctly. You can choose from multiple voice leading modes including Similar, Oblique, and Best Choice." 
              },
              { 
                question: "Do I need extensive music theory knowledge to use Cymasphere?", 
                answer: "No, Cymasphere is designed to be accessible for users at all levels. The app handles the complex music theory for you, allowing you to create sophisticated chord progressions even with limited theoretical knowledge. For advanced users, there are additional controls to fine-tune the voice leading process." 
              },
              { 
                question: "Which DAWs is Cymasphere compatible with?", 
                answer: "Cymasphere works with all major DAWs including Logic Pro, Ableton Live, FL Studio, Pro Tools, Cubase, Studio One, and more. It supports both VST and AU plugin formats, as well as standalone operation." 
              },
              { 
                question: "What are the system requirements for running Cymasphere?", 
                answer: "Cymasphere runs on Windows 10/11 (64-bit) and macOS 10.13 or higher. Minimum requirements include a dual-core processor, 4GB RAM, and 500MB of free disk space. For optimal performance, we recommend a quad-core processor and 8GB RAM." 
              },
              { 
                question: "Can I export MIDI files from Cymasphere to my DAW?", 
                answer: "Yes, Cymasphere allows you to export your chord progressions and voicings as MIDI files that can be imported into any DAW. You can also use Cymasphere as a plugin directly within your DAW for seamless integration with your workflow." 
              },
              { 
                question: "What's the difference between Basic, Professional, and Studio versions?", 
                answer: "The Basic version includes standard voice leading features and 30+ scales. The Professional version adds advanced voice leading algorithms, extended chord library, and 100+ scales. The Studio version includes all features plus 200+ scales and lifetime updates." 
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                style={{
                  backgroundColor: 'rgba(30, 30, 30, 0.5)',
                  borderRadius: '10px',
                  padding: '20px',
                  boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}
                onClick={() => toggleFaq(index)}
                className="faq-item"
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center'
                }}>
                  <h3 style={{ margin: 0, textAlign: 'left' }}>{faq.question}</h3>
                  <span style={{ 
                    fontSize: '1.5rem', 
                    transition: 'transform 0.3s ease',
                    transform: expandedFaqs[index] ? 'rotate(45deg)' : 'rotate(0deg)'
                  }}>
                    {expandedFaqs[index] ? '×' : '+'}
                  </span>
                </div>
                
                <div style={{ 
                  maxHeight: expandedFaqs[index] ? '1000px' : '0', 
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  textAlign: 'left',
                  marginTop: expandedFaqs[index] ? '20px' : '0',
                  opacity: expandedFaqs[index] ? 1 : 0
                }}>
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 'clamp(1rem, 1.2vw, 1.2rem)',
              marginBottom: '30px'
            }}>
              Still have questions? We're here to help.
            </p>
            
            <a href="#contact" style={{ 
              backgroundColor: '#6C63FF', 
              color: 'white', 
              border: 'none', 
              padding: '15px 30px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'transform 0.2s ease, background 0.2s ease'
            }}>
              Contact Support
            </a>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{
        padding: '100px 20px',
        backgroundColor: '#121212',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 80% 30%, rgba(78, 205, 196, 0.05), transparent 40%), radial-gradient(circle at 20% 70%, rgba(108, 99, 255, 0.05), transparent 40%)',
          zIndex: 0
        }}></div>
        
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <h2 style={{ 
            marginBottom: '20px',
            position: 'relative',
            display: 'inline-block',
            fontSize: 'clamp(2rem, 3vw, 2.5rem)'
          }}>
            Simple, Transparent Pricing
            <span style={{
              position: 'absolute',
              bottom: '-15px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80px',
              height: '3px',
              background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)'
            }}></span>
          </h2>
          
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 'clamp(1rem, 1.2vw, 1.2rem)',
            maxWidth: '700px',
            margin: '0 auto 60px'
          }}>
            Choose the plan that fits your needs. All plans include our core chord voicing technology.
          </p>

          {/* Pricing comparison table */}
          <div className="pricing-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '25px',
            margin: '0 auto'
          }}>
            {/* Basic Plan */}
            <div className="pricing-card" style={{
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              borderRadius: '12px',
              padding: '40px 30px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF, #4ECDC4, #6C63FF)',
                backgroundSize: '200% 200%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '2rem',
                color: 'white',
                opacity: '0.9',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
              }}>
                <span>B</span>
              </div>
              
              <h3 style={{ 
                marginBottom: '10px', 
                fontSize: 'clamp(1.5rem, 2vw, 1.8rem)',
                color: 'white'
              }}>Basic</h3>
              
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                marginBottom: '25px'
              }}>
                Perfect for hobbyists and beginners
              </p>
              
              <div style={{ marginBottom: '30px' }}>
                <span style={{ 
                  fontSize: 'clamp(2.5rem, 3vw, 3rem)',
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>$49</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}> one-time</span>
              </div>
              
              <ul style={{ 
                listStyle: 'none',
                padding: '0',
                margin: '0 0 30px 0',
                textAlign: 'left',
                flex: '1'
              }}>
                {[
                  'Standard chord voicing generation',
                  'Basic voice leading modes',
                  '30+ scales and modes',
                  'MIDI output',
                  'DAW integration',
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)', textDecoration: 'line-through' }}>Advanced voice leading algorithms</span>,
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)', textDecoration: 'line-through' }}>Extended chord library</span>,
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)', textDecoration: 'line-through' }}>Free updates for life</span>
                ].map((feature, index) => (
                  <li key={index} style={{
                    margin: '15px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: typeof feature === 'string' ? 'rgba(255, 255, 255, 0.8)' : undefined
                  }}>
                    <span style={{
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: typeof feature === 'string' ? 'linear-gradient(135deg, #6C63FF, #4ECDC4)' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '15px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>
                      {typeof feature === 'string' ? '✓' : '×'}
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button style={{ 
                backgroundColor: 'transparent', 
                color: 'white', 
                border: '2px solid #6C63FF', 
                padding: '15px 30px', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'transform 0.2s ease, background 0.2s ease',
                width: '100%'
              }}>
                Get Started
              </button>
            </div>
            
            {/* Professional Plan */}
            <div className="pricing-card" style={{
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              borderRadius: '12px',
              padding: '40px 30px',
              border: '2px solid #6C63FF',
              boxShadow: '0 15px 35px rgba(108, 99, 255, 0.15)',
              textAlign: 'center',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transform: 'scale(1.05)',
              zIndex: '2',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '-35px',
                transform: 'rotate(45deg)',
                background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                color: 'white',
                padding: '5px 40px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
              }}>
                MOST POPULAR
              </div>
            
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF, #4ECDC4, #6C63FF)',
                backgroundSize: '200% 200%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '2rem',
                color: 'white',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
              }}>
                <span>P</span>
              </div>
              
              <h3 style={{ 
                marginBottom: '10px', 
                fontSize: 'clamp(1.5rem, 2vw, 1.8rem)',
                color: 'white'
              }}>Professional</h3>
              
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                marginBottom: '25px'
              }}>
                For serious musicians and composers
              </p>
              
              <div style={{ marginBottom: '30px' }}>
                <span style={{ 
                  fontSize: 'clamp(2.5rem, 3vw, 3rem)',
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>$99</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}> one-time</span>
              </div>
              
              <ul style={{ 
                listStyle: 'none',
                padding: '0',
                margin: '0 0 30px 0',
                textAlign: 'left',
                flex: '1'
              }}>
                {[
                  'Advanced chord voicing generation',
                  'All voice leading modes',
                  '100+ scales and modes',
                  'MIDI input/output',
                  'DAW integration',
                  'Advanced voice leading algorithms',
                  'Extended chord library',
                  <span style={{ color: 'rgba(255, 255, 255, 0.3)', textDecoration: 'line-through' }}>Free updates for life</span>
                ].map((feature, index) => (
                  <li key={index} style={{
                    margin: '15px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: typeof feature === 'string' ? 'rgba(255, 255, 255, 0.8)' : undefined
                  }}>
                    <span style={{
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: typeof feature === 'string' ? 'linear-gradient(135deg, #6C63FF, #4ECDC4)' : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '15px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>
                      {typeof feature === 'string' ? '✓' : '×'}
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button className="primary" style={{ 
                background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                color: 'white', 
                border: 'none', 
                padding: '15px 30px', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                width: '100%'
              }}>
                Get Started
              </button>
            </div>
            
            {/* Studio Plan */}
            <div className="pricing-card" style={{
              backgroundColor: 'rgba(30, 30, 30, 0.6)',
              borderRadius: '12px',
              padding: '40px 30px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              height: '100%',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6C63FF, #4ECDC4, #6C63FF)',
                backgroundSize: '200% 200%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                fontSize: '2rem',
                color: 'white',
                opacity: '0.9',
                boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)'
              }}>
                <span>S</span>
              </div>
              
              <h3 style={{ 
                marginBottom: '10px', 
                fontSize: 'clamp(1.5rem, 2vw, 1.8rem)',
                color: 'white'
              }}>Studio</h3>
              
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '0.9rem',
                marginBottom: '25px'
              }}>
                Complete solution for studios and professionals
              </p>
              
              <div style={{ marginBottom: '30px' }}>
                <span style={{ 
                  fontSize: 'clamp(2.5rem, 3vw, 3rem)',
                  fontWeight: 'bold',
                  background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}>$149</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}> one-time</span>
              </div>
              
              <ul style={{ 
                listStyle: 'none',
                padding: '0',
                margin: '0 0 30px 0',
                textAlign: 'left',
                flex: '1'
              }}>
                {[
                  'Advanced chord voicing generation',
                  'All voice leading modes',
                  '200+ scales and modes',
                  'MIDI input/output',
                  'DAW integration',
                  'Advanced voice leading algorithms',
                  'Extended chord library',
                  'Free updates for life'
                ].map((feature, index) => (
                  <li key={index} style={{
                    margin: '15px 0',
                    display: 'flex',
                    alignItems: 'center',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    <span style={{
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '15px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button style={{ 
                backgroundColor: 'transparent', 
                color: 'white', 
                border: '2px solid #6C63FF', 
                padding: '15px 30px', 
                borderRadius: '5px', 
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 'bold',
                transition: 'transform 0.2s ease, background 0.2s ease',
                width: '100%'
              }}>
                Get Started
              </button>
            </div>
          </div>
          
          <div style={{
            marginTop: '50px',
            padding: '25px',
            borderRadius: '8px',
            backgroundColor: 'rgba(108, 99, 255, 0.1)',
            border: '1px solid rgba(108, 99, 255, 0.2)',
            maxWidth: '700px',
            margin: '50px auto 0'
          }}>
            <h3 style={{ 
              fontSize: '1.2rem', 
              color: 'white',
              marginBottom: '10px' 
            }}>Need a custom solution?</h3>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '1rem',
              marginBottom: '15px'
            }}>
              For educational institutions or enterprise users, we offer custom pricing with additional support options.
            </p>
            <a href="#contact" style={{ 
              display: 'inline-block',
              padding: '10px 25px', 
              borderRadius: '5px', 
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              background: 'transparent',
              border: '1px solid rgba(108, 99, 255, 0.5)',
              color: 'rgba(255, 255, 255, 0.9)',
              textDecoration: 'none',
              transition: 'all 0.2s ease'
            }}>
              Contact us for custom pricing
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" style={{
        padding: '6rem 2rem',
        backgroundColor: '#121212',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 70% 30%, rgba(0, 188, 212, 0.05), transparent 50%)',
          zIndex: 0
        }}></div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ 
            textAlign: 'center', 
            color: 'white', 
            fontSize: '2.5rem', 
            marginBottom: '1rem',
            fontWeight: 700
          }}>Contact Us</h2>
          
          <p style={{ 
            textAlign: 'center',
            color: '#b0b0b0',
            maxWidth: '700px',
            margin: '0 auto 4rem',
            fontSize: '1.1rem'
          }}>
            We'd love to hear from you! Fill out the form below or contact us directly.
          </p>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '4rem',
            alignItems: 'start'
          }}>
            {/* Contact Form */}
            <div style={{
              background: '#242424',
              borderRadius: '8px',
              padding: '2rem',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <h3 style={{ 
                color: 'white', 
                marginBottom: '1.5rem', 
                fontSize: '1.5rem' 
              }}>
                Send Us a Message
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                setIsSubmitting(true);
                
                // Simulate API call with timeout
                setTimeout(() => {
                  setIsSubmitting(false);
                  alert('Thank you for your message! We will get back to you soon.');
                  e.target.reset();
                }, 1500);
              }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label 
                    htmlFor="name" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#b0b0b0' 
                    }}
                  >
                    Your Name
                  </label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6C63FF';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <label 
                    htmlFor="email" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#b0b0b0' 
                    }}
                  >
                    Your Email
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6C63FF';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1.25rem' }}>
                  <label 
                    htmlFor="subject" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#b0b0b0' 
                    }}
                  >
                    Subject
                  </label>
                  <input 
                    type="text" 
                    id="subject" 
                    name="subject" 
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6C63FF';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label 
                    htmlFor="message" 
                    style={{ 
                      display: 'block', 
                      marginBottom: '0.5rem', 
                      color: '#b0b0b0' 
                    }}
                  >
                    Your Message
                  </label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows="5" 
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '1rem',
                      resize: 'vertical',
                      minHeight: '150px',
                      outline: 'none',
                      transition: 'border-color 0.3s ease'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6C63FF';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '4px',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    width: '100%',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    opacity: isSubmitting ? 0.8 : 1
                  }}
                  onMouseOver={(e) => {
                    if (!isSubmitting) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 5px 15px rgba(108, 99, 255, 0.3)';
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
            
            {/* Contact Information */}
            <div>
              <h3 style={{ 
                color: 'white', 
                marginBottom: '1.5rem', 
                fontSize: '1.5rem' 
              }}>
                Get in Touch
              </h3>
              <p style={{ 
                color: '#b0b0b0', 
                marginBottom: '2rem',
                lineHeight: '1.6' 
              }}>
                Have questions about Cymasphere? Want to request a demo or custom features? 
                Our team is ready to help you get the most out of our voice leading technology.
              </p>
              
              <div style={{ marginBottom: '2.5rem' }}>
                {/* Email Contact */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '1.5rem' 
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    color: 'white',
                    fontSize: '1.2rem'
                  }}>
                    ✉️
                  </div>
                  <div>
                    <p style={{ 
                      color: '#b0b0b0', 
                      fontSize: '0.9rem', 
                      marginBottom: '0.25rem' 
                    }}>
                      Email Us
                    </p>
                    <p style={{ 
                      color: 'white', 
                      fontSize: '1.1rem' 
                    }}>
                      support@cymasphere.com
                    </p>
                  </div>
                </div>
                
                {/* Location */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '1rem',
                    color: 'white',
                    fontSize: '1.2rem'
                  }}>
                    📍
                  </div>
                  <div>
                    <p style={{ 
                      color: '#b0b0b0', 
                      fontSize: '0.9rem', 
                      marginBottom: '0.25rem' 
                    }}>
                      Our Location
                    </p>
                    <p style={{ 
                      color: 'white', 
                      fontSize: '1.1rem' 
                    }}>
                      Reno, NV
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Social Links */}
              <div>
                <p style={{ 
                  color: '#b0b0b0', 
                  marginBottom: '1rem' 
                }}>
                  Connect With Us
                </p>
                <div style={{ 
                  display: 'flex', 
                  gap: '1rem' 
                }}>
                  {['Twitter', 'Facebook', 'Instagram', 'YouTube'].map((platform, index) => (
                    <a 
                      key={index}
                      href={`#${platform.toLowerCase()}`}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#b0b0b0',
                        fontSize: '1.1rem',
                        transition: 'all 0.3s ease',
                        textDecoration: 'none'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = '#6C63FF';
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                        e.currentTarget.style.color = '#b0b0b0';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {platform.charAt(0)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#121212',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <p style={{ color: '#666' }}>
          &copy; {new Date().getFullYear()} Cymasphere. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a
            href="#privacy-policy"
            style={{ 
              color: '#666', 
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'color 0.2s ease'
            }}
            className="footer-link"
          >
            Privacy Policy
          </a>
          <a
            href="#terms-of-service"
            style={{ 
              color: '#666', 
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'color 0.2s ease'
            }}
            className="footer-link"
          >
            Terms of Service
          </a>
          <a
            href="#cookies"
            style={{ 
              color: '#666', 
              textDecoration: 'none',
              fontSize: '0.9rem',
              transition: 'color 0.2s ease'
            }}
            className="footer-link"
          >
            Cookies
          </a>
        </div>
      </footer>
      {debugInfo}
      
      <ParticleSystem
        active={particleProps.active}
        position={particleProps.position}
        color={particleProps.color}
      />
    </div>
  );
}

export default App;
