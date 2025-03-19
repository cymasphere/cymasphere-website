import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tone from 'tone';
import SynthSelector from '../synth/SynthSelector';
import PresetSelector from '../synth/PresetSelector';
import Timeline from '../timeline/Timeline';
import ChordPad from '../chord/ChordPad';
import ChordBank from '../chord/ChordBank';
import DrumPattern from '../drum/DrumPattern';
import PianoRoll from '../piano/PianoRoll';
import ParticleSystem from '../visualizer/ParticleSystem';
import Wizard from '../wizard/Wizard';
import { determineKey } from '../../utils/music';
import './SynthesizerContainer.css';

// Add modal components
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: var(--text);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  
  &:hover {
    color: var(--text);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
  text-align: center;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: center;
`;

const Button = styled.button`
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
  }
`;

const SynthesizerWrapper = styled.div`
  background-color: var(--bg);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease;
  
  &.wizard-mode {
    background-color: var(--wizard-bg);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.7);
  }
`;

const SynthesizerContainer = ({ 
  isWizardMode = false,
  sectionTitle,
  sectionDescription,
  defaultSeries,
  defaultArrangement,
  onCloseCallback
}) => {
  // Translation hook
  const { t } = useTranslation();
  const { warning } = useToast();

  // State management
  const [previousNotes, setPreviousNotes] = useState(null);
  const [activeNotes, setActiveNotes] = useState([]);
  const [selectedSynth, setSelectedSynth] = useState('polysynth');
  const [selectedPreset, setSelectedPreset] = useState('default');
  const [synth, setSynth] = useState(null);
  const [audioContextStarted, setAudioContextStarted] = useState(false);
  const [audioContextInitialized, setAudioContextInitialized] = useState(false);
  const [timelineChords, setTimelineChords] = useState(Array(8).fill(null));
  const [isPlayingSequence, setIsPlayingSequence] = useState(false);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(-1);
  const [pianoRollNotes, setPianoRollNotes] = useState([]);
  const [wizardStep, setWizardStep] = useState(1);
  const [activeWizardStep, setActiveWizardStep] = useState(0);
  const [songName, setSongName] = useState('');
  const [trackName, setTrackName] = useState('');
  const sequenceRef = useRef(null);
  const [particleProps, setParticleProps] = useState({
    active: false, // Always set to false to disable particles
    position: { x: 0, y: 0 },
    color: '#6C63FF',
    mode: 'ambient'
  });
  const [leadSynth, setLeadSynth] = useState(null);
  const [isPianoRollPlaying, setIsPianoRollPlaying] = useState(false);
  const pianoRollPlaybackRef = useRef(null);
  const [isSequencePlaying, setIsSequencePlaying] = useState(false);
  const [midiOutputName, setMidiOutputName] = useState('WebMidi');
  const [chordMIDIVelocity, setChordMIDIVelocity] = useState(64); // Default MIDI velocity
  const [melodyMIDIVelocity, setMelodyMIDIVelocity] = useState(100); // Default melody velocity
  const [outputPort, setOutputPort] = useState(null);
  const [synthType, setSynthType] = useState('PolySynth'); // Default synth type instead of defaultSynth
  const [instrumentType, setInstrumentType] = useState('SynthesizerA'); // Default instrument instead of defaultInstrument
  const [isChordPlaying, setIsChordPlaying] = useState(false);
  const [pianoRollPlayPosition, setPianoRollPlayPosition] = useState(0);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [chordBankData, setChordBankData] = useState([]);
  const [chordType, setChordType] = useState('7ths'); // Add state for chord type
  const [isDrumPatternActive, setIsDrumPatternActive] = useState(true); // Set to true by default
  const [isLoopModeActive, setIsLoopModeActive] = useState(false); // Loop mode state

  // Custom hooks
  const effectsChain = useEffectsChain();
  const { 
    midiOutput, 
    midiOutputs, 
    selectedPort: midiSelectedPort, 
    handleMidiDeviceChange 
  } = useMIDISetup();

  // Reference to effects chain for use in callbacks
  const effectsChainRef = useRef(null);
  const synthRef = useRef(null);

  // Update refs when dependencies change
  useEffect(() => {
    effectsChainRef.current = effectsChain;
  }, [effectsChain]);

  useEffect(() => {
    synthRef.current = synth;
  }, [synth]);

  // Define initializeAudioContext outside of any useEffect
  const initializeAudioContext = async () => {
    try {
      // Check if we already tried to initialize
      if (audioContextInitialized) return;
      
      // Initialize Tone.js context safely
      if (Tone.context.state !== "running") {
        console.log("Initializing Tone.js audio context");
        await Tone.start();
        setAudioContextStarted(true);
      } else {
        setAudioContextStarted(true);
      }
      setAudioContextInitialized(true);
    } catch (error) {
      console.error("Error initializing audio context:", error);
    }
  };

  // Initialize audio context properly
  useEffect(() => {
    // Add event listeners to initialize context on user interaction
    const handleUserInteraction = () => {
      if (!audioContextInitialized) {
        initializeAudioContext();
      }
    };

    window.addEventListener('click', handleUserInteraction);
    window.addEventListener('keydown', handleUserInteraction);
    window.addEventListener('touchstart', handleUserInteraction);

    return () => {
      // Clean up event listeners
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioContextInitialized, initializeAudioContext]);

  // Initialize component when ready
  useEffect(() => {
    // Only initialize if audio context is ready
    if (audioContextInitialized) {
      initializeComponent();
    }
  }, [audioContextInitialized]);
  
  // Initialize song and track names
  useEffect(() => {
    if (!songName) {
      setSongName(generateRandomSongName());
    }
    if (!trackName) {
      setTrackName(generateRandomTrackName());
    }
  }, []); // Empty dependency array to run only once

  // Initialize chord bank when component mounts if it's empty
  useEffect(() => {
    if (chordBankData.length === 0) {
      const initialChords = generateChordBank(chordType);
      setChordBankData(initialChords);
    }
  }, []);

  // Handle changes to the chord type dropdown
  const handleChordTypeChange = (event) => {
    const newChordType = event.target.value;
    setChordType(newChordType);
    
    // Regenerate chord bank with the new chord type
    const updatedChordBank = generateChordBank(newChordType);
    setChordBankData(updatedChordBank);
  };
  
  // Generate chord bank based on chord type
  const generateChordBank = (type = '7ths') => {
    const scaleNotes = getScaleNotes('C', 'ionian');
    const chords = [];
    
    // Define chord suffixes based on type
    let suffixes;
    if (type === 'triads') {
      suffixes = ['', 'm', 'm', '', '', 'm', 'dim']; // C, Dm, Em, F, G, Am, Bdim
    } else if (type === '7ths') {
      suffixes = ['maj7', 'min7', 'min7', 'maj7', '7', 'min7', 'm7b5']; // Cmaj7, Dmin7, Emin7, Fmaj7, G7, Amin7, Bm7b5
    } else if (type === '9ths') {
      // For 9ths, keep III chord (Em) and VII chord (B) as 7th chords to avoid too much tension
      suffixes = ['maj9', 'm9', 'min7', 'maj9', '9', 'm9', 'm7b5']; // Cmaj9, Dm9, Emin7, Fmaj9, G9, Am9, Bm7b5
    }
    
    // Generate chord bank
    for (let i = 0; i < scaleNotes.length; i++) {
      const rootNote = scaleNotes[i];
      const chordSuffix = suffixes[i];
      const chordName = rootNote + chordSuffix;
      
      chords.push({
        id: `chord-${i}`,
        name: chordName,
        note: rootNote + '4', // Add octave for actual note
        mode: determineChordMode(chordName)
      });
    }
    
    return chords;
  };

  // Toggle drum pattern
  const toggleDrumPattern = () => {
    // Get the new state by inverting current state
    const newDrumState = !isDrumPatternActive;
    console.log("Toggling drum pattern from", isDrumPatternActive, "to", newDrumState);
    
    // Update state
    setIsDrumPatternActive(newDrumState);
    
    // If sequence is currently playing, update drum pattern immediately
    if (isPlayingSequence) {
      if (newDrumState) {
        console.log("Starting drum pattern (sequence playing)");
        playDrumPattern(120);
              } else {
        console.log("Stopping drum pattern");
        stopDrumPattern();
      }
    } else {
      // Even if no sequence is playing, we should still apply audio changes
      // so they're ready when playback starts
      if (newDrumState) {
        console.log("Drums enabled, will play when sequence starts");
      } else {
        console.log("Drums disabled, won't play when sequence starts");
        // Make sure any currently playing drums are stopped
        stopDrumPattern();
      }
    }
  };

  // Initialize component when it first loads
  const initializeComponent = async () => {
    try {
      // Try to initialize the audio context
      await initializeAudioContext();
      
      // Initialize audio for the chord pads and drums
      const { initAudio } = await import('../../utils/audioUtils');
      await initAudio();
      console.log("Audio initialized for chord pads and drums");
      
      // Initialize synth with current settings
      const newSynth = createSynth(selectedSynth, selectedPreset);
      
      // Initialize effects chain 
      await initializeEffectsChain(effectsChain, newSynth);
      
      // Set synth to state
      setSynth(newSynth);
      
      // Generate chord bank based on current chord type
      const initialChordBank = generateChordBank(chordType);
      setChordBankData(initialChordBank);
      
      // Set refs for use in callbacks
      effectsChainRef.current = effectsChain;
      synthRef.current = newSynth;
      
      // Generate instrument sounds
      setAudioContextStarted(true);
      
      // Set active step in wizard mode
      if (isWizardMode) {
        // If song name is set and not empty, go to step 1
        if (songName && songName.trim()) {
          setActiveWizardStep(1);
                      } else {
          setActiveWizardStep(0);
        }
      }
      
      // Log successful initialization
      console.log('Component initialized successfully');
        } catch (error) {
      console.error('Error initializing component:', error);
    }
  };

  // Initialize synthesizer when selected synth changes
  useEffect(() => {
    if (effectsChain) {
      try {
        handleSynthChange({ target: { value: selectedSynth } });
      } catch (error) {
        console.error("Error initializing synth:", error);
      }
    }
  }, [effectsChain, selectedSynth]);

  // Clean up synth on unmount
  useEffect(() => {
    return () => {
      try {
        // Dispose main synth
        if (synth) {
          disposeSynth(synth);
        }
        
        // Dispose lead synth
        if (leadSynth) {
          disposeSynth(leadSynth);
        }
        
        // Clear any active sequences
        if (sequenceRef.current) {
          clearInterval(sequenceRef.current);
        }
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };
  }, [effectsChain]);

  // Handle synth type change
  const handleSynthChange = (event) => {
    try {
      const type = event.target.value;
      console.log("Changing synthesizer to:", type);
      setSelectedSynth(type);
      
      if (!type) {
        console.warn("No synth type provided");
        return;
      }

      // Dispose of previous synth if it exists
      if (synth) {
        console.log("Disposing previous synth:", selectedSynth);
        try {
          disposeSynth(synth);
        } catch (error) {
          console.error("Error disposing previous synth:", error);
        }
      }
      
      // Make sure effects chain is initialized
      if (!effectsChainRef.current) {
        console.warn("Effects chain not initialized");
        return;
      }
      
      let newSynth;
      
      // Create new synth using our utility function
      if (type === 'polysynth') {
        console.log("Creating new polysynth");
        try {
          newSynth = createSynth(type, effectsChainRef.current);
          
          // Automatically show synth controls for polysynth
          // setShowSynthControls(true);
          
          // Apply preset parameters based on selected preset
          if (newSynth) {
            console.log("Applying preset parameters from:", selectedPreset);
            setTimeout(() => {
              try {
                // Apply preset using the handlePresetChange function
                const presetEvent = { target: { value: selectedPreset } };
                handlePresetChange(presetEvent);
              } catch (error) {
                console.error("Error applying preset parameters:", error);
              }
            }, 100); // Small delay to ensure synth is fully created
          }
        } catch (error) {
          console.error("Error creating synth:", error);
          newSynth = null;
        }
      } else {
        console.log("Setting up MIDI mode");
        newSynth = null;
        // Hide synth controls for MIDI
        // setShowSynthControls(false);
      }

      setSynth(newSynth);
      console.log("Synth updated to:", type);
    } catch (error) {
      console.error("Error in handleSynthChange:", error);
    }
  };
  
  // Handle preset changes
  const handlePresetChange = (event) => {
    const presetId = event.target.value;
    setSelectedPreset(presetId);
    
    // If we have an active synth, apply the preset parameters and effects
    if (synth && !synth._disposed && presetId) {
      try {
        const preset = getPresetById(presetId);
        console.log(`Applying preset: ${preset.name}`);
        
        // Apply synth parameters
        if (preset.synthParams) {
          Object.entries(preset.synthParams).forEach(([paramKey, paramValue]) => {
            if (typeof paramValue === 'object') {
              // Handle nested objects like oscillator.type
              Object.entries(paramValue).forEach(([nestedKey, nestedValue]) => {
                try {
                  synth.set({ [paramKey]: { [nestedKey]: nestedValue } });
                } catch (paramError) {
                  console.warn(`Error setting nested param ${paramKey}.${nestedKey}:`, paramError);
                }
              });
            } else {
              // Handle direct parameters
              try {
                synth.set({ [paramKey]: paramValue });
              } catch (paramError) {
                console.warn(`Error setting param ${paramKey}:`, paramError);
              }
            }
          });
        }
        
        // Apply effects
        if (preset.effects && effectsChainRef.current) {
          Object.entries(preset.effects).forEach(([effectType, effectParams]) => {
            const effect = effectsChainRef.current.getEffect(effectType);
            if (effect) {
              Object.entries(effectParams).forEach(([paramKey, paramValue]) => {
                try {
                  effect.set({ [paramKey]: paramValue });
                } catch (effectError) {
                  console.warn(`Error setting effect param ${effectType}.${paramKey}:`, effectError);
                }
              });
            }
          });
        }
        
        console.log('Preset applied successfully');
      } catch (error) {
        console.error('Error applying preset:', error);
      }
    }
  };

  // Define chord voicings for each mode with bass notes
  const chordVoicings = {
    'C': [48, 60, 64, 67, 71],  // Cmaj7 (I) - C bass
    'D': [50, 62, 65, 69, 72],  // Dmin7 (ii) - D bass
    'E': [52, 64, 67, 71, 74],  // Emin7 (iii) - E bass
    'F': [53, 65, 69, 72, 76],  // Fmaj7 (IV) - F bass
    'G': [55, 67, 71, 74, 77],  // G7 (V) - G bass
    'A': [57, 69, 72, 76, 79],  // Amin7 (vi) - A bass
    'B': [59, 71, 74, 77, 80]   // Bm7b5 (viiø) - B bass
  };

  // Define Roman numerals and chord names
  const chordInfo = {
    'C': { numeral: 'I', name: 'Cmaj7' },
    'D': { numeral: 'ii', name: 'Dmin7' },
    'E': { numeral: 'iii', name: 'Emin7' },
    'F': { numeral: 'IV', name: 'Fmaj7' },
    'G': { numeral: 'V', name: 'G7' },
    'A': { numeral: 'vi', name: 'Amin7' },
    'B': { numeral: 'viiø', name: 'Bm7b5' }
  };

  // Get chord color based on chord name
  const getChordColor = (chordName) => {
    const colors = {
      'C': '#8A2BE2',  // Purple
      'D': '#7B42E5',  // Purple-blue
      'E': '#6C5AE8',  // Blue-purple
      'F': '#4B7BE8',  // Blue
      'G': '#20A4E8',  // Light blue
      'A': '#20C5D5',  // Teal
      'B': '#20D5CB'   // Turquoise
    };
    return colors[chordName] || '#6C63FF';
  };

  // Play a chord
  const playSound = async (chordName, event) => {
    try {
      // Use the warm pad sound from audioUtils
      playChordPad(chordName);
      
      // Ensure audio context is started
      if (Tone.context.state !== 'running') {
        try {
          await Tone.start();
        } catch (error) {
          console.error('Error starting audio context:', error);
              }
            }
          } catch (error) {
      console.error('Error playing sound:', error);
    }
  };
  
  // Helper function for triggering pad synth voices individually
  const triggerPadSynthVoicesIndividually = (freqNotes) => {
    if (!synth || !synth.voices) return;
    
    try {
      // Basic validation - only filter out undefined/null values
      const validFreqNotes = Array.isArray(freqNotes) 
        ? freqNotes.filter(freq => freq !== undefined && freq !== null)
        : [];
        
      if (validFreqNotes.length === 0) {
        console.warn('No valid frequency notes to play');
        return;
      }
        
      // Only use a subset of notes for each voice to avoid overloading
      const voice1Notes = validFreqNotes.slice(0, Math.min(4, validFreqNotes.length));
      
      // Set time and duration
      const now = Tone.now();
      const duration = "2n"; // Half note duration
      
      Object.entries(synth.voices).forEach(([voiceName, voice], index) => {
        // Check if the voice exists and has the necessary methods
        if (!voice) {
          console.warn(`Voice ${voiceName} not available`);
          return;
        }
        
        // Use whichever method is available on the voice
        const triggerMethod = voice.triggerAttackRelease || voice.triggerAttack;
        
        if (!triggerMethod) {
          console.warn(`Voice ${voiceName} has no trigger method`);
          return;
        }
        
        try {
          if (index === 0 && voice1Notes.length > 0) {
            // First voice gets main notes
            if (voice.triggerAttackRelease) {
              voice.triggerAttackRelease(voice1Notes, duration, now, 0.8);
            } else {
              voice.triggerAttack(voice1Notes, now, 0.8);
            }
            console.log(`Triggered ${voiceName} with ${voice1Notes.length} notes`);
          } else if (index === 1 && validFreqNotes.length > 0) {
            // Second voice gets high notes (doubled octave)
            const highNotes = validFreqNotes.map(f => f * 2);
            
            if (highNotes.length > 0) {
              if (voice.triggerAttackRelease) {
                voice.triggerAttackRelease(highNotes, duration, now, 0.6);
              } else {
                voice.triggerAttack(highNotes, now, 0.6);
              }
              console.log(`Triggered ${voiceName} with high notes`);
            }
          } else if (index === 2 && validFreqNotes.length > 0) {
            // Third voice gets the root note (bass)
            const bassNote = validFreqNotes[0] / 2;
            
            if (voice.triggerAttackRelease) {
              voice.triggerAttackRelease(bassNote, duration, now, 0.7);
            } else {
              voice.triggerAttack(bassNote, now, 0.7);
            }
            console.log(`Triggered ${voiceName} with bass note`);
          } else if (validFreqNotes.length > 0) {
            // Other voices share the notes
            if (voice.triggerAttackRelease) {
              voice.triggerAttackRelease(validFreqNotes, duration, now, 0.5);
            } else {
              voice.triggerAttack(validFreqNotes, now, 0.5);
            }
            console.log(`Triggered ${voiceName} with all notes`);
          }
        } catch (voiceError) {
          console.warn(`Error triggering voice ${voiceName}:`, voiceError);
        }
      });
    } catch (error) {
      console.error('Error in triggerPadSynthVoicesIndividually:', error);
    }
  };

  // Stop all notes
  const stopAllNotes = async (event) => {
    try {
      // Ensure audio context is started
      if (Tone.context.state !== 'running') {
        try {
          await Tone.start();
          console.log('Audio context started before stopping sound');
          setAudioContextStarted(true);
        } catch (error) {
          console.error('Error starting audio context:', error);
          return; // Exit if we can't start audio context
        }
      }
      
      console.log('Stopping all notes for synth type:', selectedSynth);
      
      // Release all notes for internal synths
      if (synth && selectedSynth !== 'internal') {
        try {
          // Check if the synth is disposed before attempting to release notes
          if (!synth || synth._disposed) {
            console.warn('Cannot release notes on disposed or null synth');
          } else {
            // Special handling for pad synth
            if (selectedSynth === 'padsynth' && synth.voices) {
              try {
                // First try the main releaseAll method
                if (typeof synth.releaseAll === 'function') {
                  synth.releaseAll();
                  console.log('Released all pad synth notes using releaseAll');
                } else {
                  // Try to release each voice individually
                  stopPadSynthVoicesIndividually();
                }
              } catch (releaseError) {
                console.warn('Error using main releaseAll method:', releaseError);
                // Try individual voices as a backup
                stopPadSynthVoicesIndividually();
              }
            } else if (typeof synth.releaseAll === 'function') {
              // Regular synth with releaseAll method
              synth.releaseAll();
              console.log('Released all synth notes');
            } else if (synth.triggerRelease && Array.isArray(activeNotes) && activeNotes.length > 0) {
              // If releaseAll is not available but we have activeNotes, release them specifically
              const validActiveNotes = activeNotes.filter(note => 
                typeof note === 'number' && 
                Number.isFinite(note) && 
                !isNaN(note) && 
                note >= 0 && 
                note <= 127
              );
              
              if (validActiveNotes.length > 0) {
                const freqNotes = validActiveNotes
                  .map(note => midiToFreq(note))
                  .filter(freq => typeof freq === 'number' && Number.isFinite(freq) && !isNaN(freq));
                  
                if (freqNotes.length > 0) {
                  synth.triggerRelease(freqNotes);
                  console.log(`Released ${freqNotes.length} specific synth notes`);
                } else {
                  console.warn('No valid frequency notes to release');
                }
              } else {
                console.warn('No valid active notes to release');
              }
            } else {
              console.warn('Could not find a way to release synth notes');
            }
          }
        } catch (error) {
          console.error('Error releasing synth notes:', error);
        }
      }
      
      // Also release notes from the lead synth (for melody)
      if (leadSynth) {
        try {
          console.log('Releasing all notes from lead synth');
          if (typeof leadSynth.releaseAll === 'function') {
            leadSynth.releaseAll();
          } else if (typeof leadSynth.triggerRelease === 'function') {
            leadSynth.triggerRelease();
          }
        } catch (error) {
          console.error('Error releasing lead synth notes:', error);
        }
      }
      
      // Stop MIDI notes for external devices
      if (midiOutput && selectedSynth === 'internal') {
        try {
          allNotesOff(midiOutput);
          console.log('Sent MIDI all notes off message');
        } catch (error) {
          console.error('Error sending MIDI all notes off:', error);
        }
      }
      
      // Clear active notes for UI feedback
      setActiveNotes([]);
      setPreviousNotes(null); // Reset previous notes for voice leading
      console.log('All notes stopped');
      
      // Update particle effect to stop particles with a fade-out
      setParticleProps(prev => ({ 
        ...prev, 
        active: false,
        // Retain the last color and position for a smooth fade-out
        color: prev.color,
        position: prev.position
      }));
    } catch (error) {
      console.error('Unexpected error in stopAllNotes:', error);
    }
  };

  // Helper function to stop pad synth voices individually
  const stopPadSynthVoicesIndividually = () => {
    if (!synth || !synth.voices) return;
    
    console.log('Releasing individual pad synth voices');
    Object.entries(synth.voices).forEach(([voiceName, voice]) => {
      try {
        if (!voice) {
          console.warn(`Voice ${voiceName} is null or undefined`);
          return;
        }
        
        if (typeof voice.releaseAll === 'function') {
          voice.releaseAll();
          console.log(`Released ${voiceName} notes using releaseAll`);
        } else if (typeof voice.triggerRelease === 'function' && Array.isArray(activeNotes)) {
          // Try to release specific notes if we have them
          const validActiveNotes = activeNotes.filter(note => 
            typeof note === 'number' && 
            Number.isFinite(note) && 
            !isNaN(note) && 
            note >= 0 && 
            note <= 127
          );
          
          if (validActiveNotes.length > 0) {
            const freqNotes = validActiveNotes
              .map(note => midiToFreq(note))
              .filter(freq => typeof freq === 'number' && Number.isFinite(freq) && !isNaN(freq));
              
            if (freqNotes.length > 0) {
              try {
                voice.triggerRelease(freqNotes);
                console.log(`Released ${voiceName} specific notes`);
              } catch (releaseError) {
                // Last resort: try to release without specific notes
                console.warn(`Error releasing specific notes for ${voiceName}:`, releaseError);
                if (typeof voice.triggerRelease === 'function') {
                  try {
                    voice.triggerRelease();
                    console.log(`Released ${voiceName} using parameterless triggerRelease`);
                  } catch (fallbackError) {
                    console.error(`Failed all release attempts for ${voiceName}:`, fallbackError);
                  }
                }
              }
            } else {
              console.warn(`No valid frequency notes to release for ${voiceName}`);
              // Try parameterless release as fallback
              if (typeof voice.triggerRelease === 'function') {
                try {
                  voice.triggerRelease();
                  console.log(`Released ${voiceName} using parameterless triggerRelease`);
                } catch (releaseError) {
                  console.warn(`Error with parameterless release for ${voiceName}:`, releaseError);
                }
              }
            }
          } else {
            console.warn(`No valid active notes to release for ${voiceName}`);
            // Try parameterless release as fallback
            if (typeof voice.triggerRelease === 'function') {
              try {
                voice.triggerRelease();
                console.log(`Released ${voiceName} using parameterless triggerRelease`);
              } catch (releaseError) {
                console.warn(`Error with parameterless release for ${voiceName}:`, releaseError);
              }
            }
          }
        } else {
          console.warn(`No way to release notes for ${voiceName}`);
        }
      } catch (voiceError) {
        console.warn(`Error releasing ${voiceName}:`, voiceError.message);
      }
    });
  };

  // Unified stop function - combines stopping sequence and all notes
  const stopAll = async () => {
    console.log("STOP ALL called - stopping everything immediately");
    
    // Cancel all pending timeouts
    // This is a more aggressive approach to ensure immediate stop
      const highestId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestId; i++) {
      clearTimeout(i);
    }
    
    // Clear all intervals and timers first
    if (sequenceRef.current) {
      clearInterval(sequenceRef.current);
      sequenceRef.current = null;
    }
    
    if (pianoRollPlaybackRef.current) {
      clearInterval(pianoRollPlaybackRef.current);
      pianoRollPlaybackRef.current = null;
    }
    
    // Stop drum pattern
    stopDrumPattern();
    
    // Reset all playback state flags immediately
    setIsPlayingSequence(false);
    setIsPianoRollPlaying(false);
    setCurrentSequenceIndex(-1);
    setPianoRollPlayPosition(0);
    
    // Stop all audio immediately by releasing all notes
    await stopAllNotes();
    
    // Dispose and clear the lead synth to ensure a fresh synth on next play
    if (leadSynth) {
      try {
        // First release all notes
        if (typeof leadSynth.releaseAll === 'function') {
          leadSynth.releaseAll();
        }
        
        // Then dispose it properly
        if (typeof leadSynth.dispose === 'function') {
          leadSynth.dispose();
        }
        
        // Set to null so a new one will be created next time
        setLeadSynth(null);
        console.log('Lead synth disposed and cleared for next playthrough');
      } catch (error) {
        console.error('Error disposing lead synth:', error);
      }
    }
    
    // Force immediate UI updates without using timeout (which could be cancelled)
      setCurrentSequenceIndex(-1);
    setPianoRollPlayPosition(0);
  };

  // Keep this for backward compatibility, but have it call the unified function
  const stopChordSequence = () => {
    if (sequenceRef.current) {
      try {
      clearInterval(sequenceRef.current);
      } catch (e) {
        console.warn("Error clearing chord sequence interval:", e);
      }
      sequenceRef.current = null;
    }
    
    // Stop the drum pattern
    if (isDrumPatternActive) {
      stopDrumPattern();
    }
    
    setIsPlayingSequence(false);
    setCurrentSequenceIndex(-1);
    
    // Stop any active notes
    try {
    stopAllNotes();
    } catch (e) {
      console.warn("Error stopping notes:", e);
    }
    
    // Force UI update for chord indicators
    setTimeout(() => {
      setCurrentSequenceIndex(-1);
    }, 50);
  };

  // Handle timeline update
  const handleTimelineUpdate = (updatedSlots) => {
    setTimelineChords(updatedSlots);
  };

  // Play the chord sequence from the timeline
  const playChordSequence = async () => {
    if (isPlayingSequence) {
      // Stop the sequence if already playing
      stopChordSequence();
      return;
    }
    
    // Stop piano roll playback if it's active
    if (isPianoRollPlaying) {
      stopPianoRollMelody();
    }

    // Check if there are any chords in the timeline
    const validChords = timelineChords.filter(chord => chord !== null);
    if (validChords.length === 0) return;

    setIsPlayingSequence(true);
    setCurrentSequenceIndex(0);

    // Start drum pattern if enabled - SIMPLIFIED CODE
    if (isDrumPatternActive) {
      console.log("Starting drum pattern immediately for chord sequence");
      playDrumPattern(120); // 120 BPM
    }

    // Create a sequencer to play through the chords
    const interval = 2000; // 2 seconds per chord
    
    // Play the first chord immediately
    if (timelineChords[0]) {
      // Pass the full chord name to playSound, not just the root note
      console.log("Playing chord:", timelineChords[0].name);
      playSound(timelineChords[0].name);
    }

    // Set up sequencer to play the rest of the chords
    let currentIndex = 1;
    
    sequenceRef.current = setInterval(() => {
      // Stop all previous notes before playing the next one
      stopAllNotes();

      // Play the current chord if it exists
      if (currentIndex < timelineChords.length && timelineChords[currentIndex]) {
        // Pass the full chord name to playSound, not just the root note
        console.log("Playing chord:", timelineChords[currentIndex].name);
        playSound(timelineChords[currentIndex].name);
        setCurrentSequenceIndex(currentIndex);
      }

      currentIndex++;

      // If we've reached the end of the sequence
      if (currentIndex >= timelineChords.length) {
        if (isLoopModeActive) {
          // If loop mode is active, go back to the first chord
          console.log("Loop mode active - resetting to first chord");
          
          // Stop all previous notes completely before looping
          stopAllNotes();
          
          // Reset index
          currentIndex = 0;
          
          // Play the first chord immediately to avoid a gap
          if (timelineChords[0]) {
            console.log("Playing first chord in loop:", timelineChords[0].name);
            playSound(timelineChords[0].name);
            setCurrentSequenceIndex(0);
          }
        } else {
          // If loop mode is not active, stop the sequence
        setTimeout(() => {
          stopChordSequence();
          setCurrentSequenceIndex(-1); // Reset the current index
        }, interval - 100);
        }
      }
    }, interval);
  };


  // Handle piano roll notes change
  const handlePianoRollNotesChange = (updatedNotes) => {
    setPianoRollNotes(updatedNotes);
  };

  // Function to play a specific note
  const playNote = (noteName) => {
    console.log("Playing note:", noteName);
    
    // Use lead synth for piano roll notes if available, otherwise fall back to main synth
    const synthToUse = leadSynth || synth;
    
    if (!synthToUse || !noteName) {
      console.log("No synth available or invalid note name");
      return;
    }
    
    try {
      // Extract pitch class and octave (e.g., "C4" -> "C" and 4)
      const pitchClass = noteName.substring(0, noteName.length - 1);
      const octave = parseInt(noteName.substring(noteName.length - 1));
      
      // Convert to frequency
      const frequency = Tone.Frequency(`${pitchClass}${octave}`).toFrequency();
      console.log("Playing frequency:", frequency);
      
      // Play the note using the appropriate synth
      // For piano roll melody, use a shorter note, good attack, and higher volume
      const duration = "8n";
      const velocity = 1.0; // Full velocity for clear melody playback
      
      synthToUse.triggerAttackRelease(frequency, duration, Tone.now(), velocity);
      
      // Also send to MIDI output if available
      if (midiSelectedPort && outputPort) {
        // MIDI note number is needed for MIDI output
        const midiNote = Tone.Frequency(noteName).toMidi();
        outputPort.playNote(midiNote, 1, { duration: 200, velocity: melodyMIDIVelocity / 127 });
      }
      
      // Set particle effect
      setParticleProps({
        active: false, // Disable particles
        position: { x: Math.random() * 500, y: Math.random() * 300 },
        color: getChordColor(pitchClass),
        mode: 'note'
      });
      
      // Reset particle effect after a delay
      setTimeout(() => {
        setParticleProps({
          active: false,
          position: { x: 0, y: 0 },
          color: '#6C63FF',
          mode: 'ambient'
        });
      }, 500);
    } catch (error) {
      console.error("Error playing note:", error);
    }
  };

  // Jump to a specific wizard step
  const goToStep = (stepNumber) => {
    // Don't allow jumping to steps that aren't ready
    // Users can only go to completed steps or the next available step
    if (stepNumber <= Math.min(wizardStep + 1, 3) && stepNumber >= 1) {
      setWizardStep(stepNumber);
    }
  };

  // Advance to next wizard step
  const nextWizardStep = () => {
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
    }
  };

  // Go back to previous wizard step
  const prevWizardStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  // Check if we can navigate to a specific step
  const canNavigateToStep = (stepNumber) => {
    // Can always navigate to current or previous steps
    // Can only navigate to next step if current step is ready
    if (stepNumber < wizardStep) return true;
    if (stepNumber === wizardStep) return true;
    if (stepNumber === wizardStep + 1) return isStepReady();
    return false;
  };

  // Check if current step is ready to proceed
  const isStepReady = () => {
    switch (wizardStep) {
      case 1: // Progression (now first step)
        return timelineChords.some(chord => chord !== null);
      case 2: // Pattern (now second step)
        return true; // Always allow proceeding from pattern to export
      case 3: // Export (now third step)
        return true; // Always complete the final step
      default:
        return false;
    }
  };

  // Generate a random chord progression
  const generateRandomProgression = () => {
    // List of common chord names from the chord bank
    // Updated to use single letters that match our chordVoicings object
    const commonChords = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    
    // Common chord progressions patterns (indices into the commonChords array)
    const progressionPatterns = [
      [0, 5, 3, 4], // I-vi-IV-V (C-A-F-G)
      [0, 3, 4, 0], // I-IV-V-I (C-F-G-C)
      [0, 3, 5, 4], // I-IV-vi-V (C-F-A-G)
      [5, 3, 4, 0], // vi-IV-V-I (A-F-G-C)
      [0, 4, 5, 3], // I-V-vi-IV (C-G-A-F)
      [0, 5, 1, 4]  // I-vi-ii-V (C-A-D-G)
    ];
    
    // Choose a random progression pattern
    const pattern = progressionPatterns[Math.floor(Math.random() * progressionPatterns.length)];
    
    console.log("Selected progression pattern:", pattern);
    
    // Create new slots with the generated progression
    const newSlots = pattern.map((chordIndex, slotIndex) => {
      const chordName = commonChords[chordIndex];
      const rootNote = chordName.charAt(0); // Extract root note
      
      console.log(`Slot ${slotIndex+1}: Creating chord with root ${rootNote}, name ${chordInfo[chordName].name}`);
      
      // Create chord object in the same format as the drag and drop operation
      return {
        note: rootNote, // Extract the root note for color lookup
        name: chordInfo[chordName].name, // Use the full chord name from chordInfo
        color: getChordColor(rootNote)
      };
    });
    
    console.log("Generated chord progression objects:", newSlots);
    
    // Update the timeline with the new progression
    setTimelineChords(newSlots);
    console.log("Updated timelineChords state:", newSlots);
    
    // Create a brief particle effect to indicate the generation
    setParticleProps({
      active: false, // Disable particles
      position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
      color: '#FF8E53',
      mode: 'burst'
    });
    
    // Turn off particles after a short delay
    setTimeout(() => {
      setParticleProps({
        active: false,
        position: { x: 0, y: 0 },
        color: '#6C63FF',
        mode: 'ambient'
      });
    }, 800);
  };

  // Generate a random song name
  const generateRandomSongName = () => {
    // Arrays of words to create song names
    const adjectives = [
      'Ethereal', 'Midnight', 'Crystal', 'Electric', 'Velvet', 'Lunar', 'Neon', 
      'Silver', 'Golden', 'Cosmic', 'Digital', 'Dreamy', 'Mystic', 'Distant',
      'Ambient', 'Resonant', 'Silent', 'Whispered', 'Chromatic', 'Harmonic'
    ];
    
    const nouns = [
      'Wave', 'Dream', 'Echo', 'Journey', 'Horizon', 'Symphony', 'Memory',
      'Pulse', 'Cascade', 'Voyage', 'Shadow', 'Rhythm', 'Harmony', 'Melody',
      'Vision', 'Oasis', 'Mirage', 'Reverie', 'Sanctuary', 'Atmosphere'
    ];
    
    // Pick random words
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    
    // Create song name with format "Adjective Noun"
    const songName = `${adjective} ${noun}`;
    
    // Update the state
    setSongName(songName);
  };

  // Handle song name input change
  const handleSongNameChange = (event) => {
    setSongName(event.target.value);
  };

  // Handle track name input change
  const handleTrackNameChange = (event) => {
    setTrackName(event.target.value);
  };

  // Generate a random track name
  const generateRandomTrackName = () => {
    // Arrays of words to create track names
    const instruments = [
      'Piano', 'Synth', 'Strings', 'Bass', 'Guitar', 'Drums', 'Pad', 
      'Lead', 'Keys', 'Bells', 'Arpeggio', 'Vocal', 'Brass', 'Flute',
      'Chords', 'Melody', 'Beat', 'FX', 'Texture', 'Ambience'
    ];
    
    const descriptors = [
      'Main', 'Ambient', 'Pulsing', 'Deep', 'Dreamy', 'Smooth', 'Dark',
      'Bright', 'Ethereal', 'Floating', 'Driving', 'Lush', 'Sparse', 'Rich',
      'Glitchy', 'Warm', 'Cool', 'Soft', 'Punchy', 'Atmospheric'
    ];
    
    // Pick random words - sometimes use just the instrument, sometimes with descriptor
    const useDescriptor = Math.random() > 0.3; // 70% chance to use descriptor
    const instrument = instruments[Math.floor(Math.random() * instruments.length)];
    
    let trackName;
    
    if (useDescriptor) {
      const descriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
      trackName = `${descriptor} ${instrument}`;
    } else {
      trackName = instrument;
    }
    
    // Update the state
    setTrackName(trackName);
  };

  // Generate melody based on chord progression
  const generateMelody = () => {
    // If no chord progression, do nothing
    if (!timelineChords.some(chord => chord !== null)) {
      warning("Please create a chord progression first!");
      return;
    }
    
    // Determine mode based on the chord progression
    const mode = determineMode(timelineChords);
    
    // Determine root note (tonic) based on first chord or most common root
    const validChords = timelineChords.filter(chord => chord !== null);
    const firstChord = validChords[0];
    const tonic = firstChord.note.replace(/[0-9]/g, ''); // Remove octave number
    
    console.log(`Detected mode: ${mode} with tonic: ${tonic}`);
    
    // Get scale notes for the overall mode using our more reliable function
    const scaleNotes = getScaleNotesForMelody(tonic, mode);
    console.log("Overall scale notes:", scaleNotes);
    
    // Generate a melody with patterns
    const generatedNotes = [];
    let noteId = 1;
    
    // Define visible range bounds for the piano roll (from C3 to C5)
    const MIN_OCTAVE = 3;
    const MAX_OCTAVE = 4;
    
    // Define melodic patterns - strictly diatonic
    const patternTypes = [
      'ascending',      // Ascending scale
      'descending',     // Descending scale
      'arpeggio_up',    // Arpeggio upward
      'arpeggio_down',  // Arpeggio downward
      'zigzag',         // Alternating up and down
      'repeat'          // Repeat the same note
    ];
    
    // Choose a rhythm pattern for bars 1-2 that will be reused in bars 3-4
    const bar1Duration = Math.random() < 0.5 ? 
      [2, 1, 1, 2, 2] :     // Pattern A
      [1, 1, 2, 2, 2];      // Pattern B
      
    const bar1StartPos = Math.random() < 0.5 ?
      [0, 2, 3, 4, 6] :     // Position pattern A
      [0, 1, 2, 4, 6];      // Position pattern B
    
    // Generate a pattern sequence for the 4 bars
    // Use the same rhythm for the first 2 bars as the last 2 bars
    const rhythmPattern = [
      { durations: bar1Duration, positions: bar1StartPos },
      { durations: bar1Duration, positions: bar1StartPos.map(p => p + 8) },
      { durations: bar1Duration, positions: bar1StartPos.map(p => p + 16) },
      { durations: bar1Duration, positions: bar1StartPos.map(p => p + 24) }
    ];
    
    // For each bar (chord slot)
    for (let barIndex = 0; barIndex < Math.min(4, validChords.length); barIndex++) {
      const chord = validChords[barIndex % validChords.length]; // Loop through valid chords
      if (!chord) continue;
      
      // Determine the specific mode for this chord
      const chordMode = determineChordMode(chord.name);
      const chordRoot = chord.note.replace(/[0-9]/g, '');
      
      // Get the scale notes for this specific chord's mode
      const chordScaleNotes = getScaleNotesForMelody(chordRoot, chordMode);
      console.log(`Chord ${chord.name} uses ${chordMode} mode with notes:`, chordScaleNotes);
      
      // Filter chord notes to ensure they're from the scale
      const chordNotesNoOctave = getChordNotes(chord.name);
      
      // Filter chord notes to only include ones that are in the scale
      // This is crucial for keeping strictly diatonic
      const filteredChordNotes = chordNotesNoOctave.filter(note => chordScaleNotes.includes(note));
      const finalChordNotes = filteredChordNotes.length > 0 ? filteredChordNotes : chordScaleNotes;
      
      // Choose a pattern for this bar
      const patternType = patternTypes[Math.floor(Math.random() * patternTypes.length)];
      
      // Choose an octave - stay within visible range
      // Use octave 3 for all bars to ensure notes stay visible
      const baseOctave = MIN_OCTAVE;
      
      // Get rhythm info for this bar
      const { durations, positions } = rhythmPattern[barIndex];
      
      // Use the chord's scale notes to generate a pattern
      // Always start with a chord tone for strong melodic foundation
      const startingNoteIndex = Math.floor(Math.random() * finalChordNotes.length);
      const startingNote = finalChordNotes[startingNoteIndex];
      
      // Find the index of the starting note in the scale
      const startNoteScaleIndex = chordScaleNotes.indexOf(startingNote);
      
      // Generate notes for this pattern and bar
      for (let noteIndex = 0; noteIndex < durations.length; noteIndex++) {
        // Select a note based on the pattern
        let noteBase;
        let noteOctave = baseOctave;
        
        const patternPosition = noteIndex / (durations.length - 1); // 0 to 1 position in pattern
        
        // Different note selection strategies based on pattern type
        switch (patternType) {
          case 'ascending':
            // Ascending scale pattern
            noteBase = chordScaleNotes[(startNoteScaleIndex + noteIndex) % chordScaleNotes.length];
            // Handle octave changes for ascending patterns
            if ((startNoteScaleIndex + noteIndex) >= chordScaleNotes.length) {
              // Add octave only if it stays within visible range
              if (noteOctave < MAX_OCTAVE) {
                noteOctave += 1;
              }
            }
            break;
            
          case 'descending':
            // Descending scale pattern
            noteBase = chordScaleNotes[(startNoteScaleIndex - noteIndex + chordScaleNotes.length) % chordScaleNotes.length];
            // Manage octave for descending patterns - stay within visible range
            // Don't go below MIN_OCTAVE
            break;
            
          case 'arpeggio_up':
            // Arpeggio upward - use only chord tones
            noteBase = finalChordNotes[noteIndex % finalChordNotes.length];
            // For upward arpeggios, handle octave
            if (noteIndex >= finalChordNotes.length) {
              // Only increase octave if it stays within visible range
              if (noteOctave < MAX_OCTAVE) {
                noteOctave += 1;
              }
            }
            break;
            
          case 'arpeggio_down':
            // Arpeggio downward - use only chord tones
            noteBase = finalChordNotes[(finalChordNotes.length - 1 - noteIndex) % finalChordNotes.length];
            // For downward arpeggios, don't go below the MIN_OCTAVE
            break;
            
          case 'zigzag':
            // Alternating up and down
            if (noteIndex % 2 === 0) {
              // Up
              noteBase = chordScaleNotes[(startNoteScaleIndex + Math.floor(noteIndex/2)) % chordScaleNotes.length];
        } else {
              // Down
              noteBase = chordScaleNotes[(startNoteScaleIndex - Math.floor(noteIndex/2) + chordScaleNotes.length) % chordScaleNotes.length];
            }
            break;
            
          case 'repeat':
            // Same note with small variations
            if (noteIndex === 0 || Math.random() < 0.3) {
              // Start with chord tone, occasionally change to adjacent scale note
              noteBase = finalChordNotes[startingNoteIndex];
            } else {
              // Use adjacent scale tones for variety
              const variation = Math.random() < 0.5 ? 1 : -1;
              const variationIndex = (startNoteScaleIndex + variation + chordScaleNotes.length) % chordScaleNotes.length;
              noteBase = chordScaleNotes[variationIndex];
            }
            break;
            
          default:
            // Fallback - use chord tone
            noteBase = finalChordNotes[noteIndex % finalChordNotes.length];
        }
        
        // Safety check - ensure the note is strictly from the scale
        if (!chordScaleNotes.includes(noteBase)) {
          console.warn(`Note ${noteBase} is not in ${chordMode} scale for ${chord.name}, using scale note instead`);
          noteBase = chordScaleNotes[0]; // Use the root of the scale as a fallback
        }
        
        // Final check to ensure note is within visible range
        // Clamp the octave to the visible range
        noteOctave = Math.max(MIN_OCTAVE, Math.min(MAX_OCTAVE, noteOctave));
        
        // Calculate the actual beat position
        const startBeat = barIndex * 16 + positions[noteIndex];
        
        // Create the note
        generatedNotes.push({
          id: noteId++,
          noteName: `${noteBase}${noteOctave}`,
          startBeat: startBeat,
          duration: durations[noteIndex]
      });
      }
    }
    
    // Update piano roll with generated notes
    setPianoRollNotes(generatedNotes);
    if (handlePianoRollNotesChange) {
      handlePianoRollNotesChange(generatedNotes);
    }
    
    console.log("Generated melody notes with patterns:", generatedNotes);
  };
  
  // Helper function to determine the appropriate mode for a given chord
  const determineChordMode = (chordName) => {
    // Normalize chord name variants (min7 -> m7, etc.)
    let normalizedName = chordName;
    if (chordName.includes('min7')) normalizedName = chordName.replace('min7', 'm7');
    if (chordName === 'Dm7') normalizedName = 'Dmin7';
    if (chordName === 'Am7') normalizedName = 'Amin7';
    
    console.log(`Normalized chord name: ${chordName} -> ${normalizedName}`);
    
    // Map specific chords to their modes
    const chordModeMap = {
      'Cmaj7': 'ionian',
      'Dmin7': 'dorian',
      'Dm7': 'dorian',    
      'Emin7': 'phrygian',
      'Em7': 'phrygian',  
      'Fmaj7': 'lydian',
      'G7': 'mixolydian',
      'G7sus4': 'mixolydian',
      'Amin7': 'aeolian',
      'Am7': 'aeolian',   
      'Bm7b5': 'locrian'
    };
    
    // If the exact chord is in our map, return its mode
    if (chordModeMap[normalizedName]) {
      console.log(`Found direct mode mapping for ${normalizedName}: ${chordModeMap[normalizedName]}`);
      return chordModeMap[normalizedName];
    }
    
    // Special handling for specific chord types and roots
    const rootMatch = normalizedName.match(/^([A-G][#b]?)/);
    if (rootMatch) {
      const root = rootMatch[0];
      
      // Special handling for D minor and A minor
      if (root === 'D' && (normalizedName.includes('m7') || normalizedName.includes('min7'))) {
        console.log(`Special handling for D minor chord: ${normalizedName} - using dorian mode`);
        return 'dorian';
      }
      
      if (root === 'A' && (normalizedName.includes('m7') || normalizedName.includes('min7'))) {
        console.log(`Special handling for A minor chord: ${normalizedName} - using aeolian mode`);
        return 'aeolian';
      }
      
      // Log the chord root we extracted
      console.log(`Extracted root note: ${root} from chord: ${normalizedName}`);
    }
    
    // For other chords, determine mode by chord quality
    if (chordName.includes('maj7')) {
      console.log(`Major 7 chord detected: ${chordName} - using ionian mode`);
      return 'ionian';
    }
    
    if (chordName.includes('m7b5')) {
      console.log(`Half-diminished chord detected: ${chordName} - using locrian mode`);
      return 'locrian';
    }
    
    if (chordName.includes('7') && !chordName.includes('maj7')) {
      console.log(`Dominant 7 chord detected: ${chordName} - using mixolydian mode`);
      return 'mixolydian';
    }
    
    // Changed default for minor 7 chords to aeolian (natural minor) instead of dorian
    if (chordName.includes('m7') || chordName.includes('min7')) {
      console.log(`Minor 7 chord detected: ${chordName} - using aeolian mode`);
      return 'aeolian';
    }
    
    // Fallback
    console.log(`No specific mode found for chord: ${chordName} - defaulting to ionian mode`);
    return 'ionian';
  };
  
  // Helper function to add phrase coherence to the melody
  const addPhraseCoherence = (notes) => {
    if (notes.length < 8) return; // Need enough notes to create patterns
    
    // Find a short pattern from the first quarter of the melody to repeat
    const patternStartIndex = Math.floor(Math.random() * (notes.length / 4));
    const patternLength = 2 + Math.floor(Math.random() * 3); // 2-4 notes
    
    // Only proceed if we have enough notes for a pattern
    if (patternStartIndex + patternLength >= notes.length / 2) return;
    
    // Get the pattern
    const pattern = notes.slice(patternStartIndex, patternStartIndex + patternLength);
    
    // Determine where to repeat the pattern
    const repeatStartIndex = Math.floor(notes.length / 2) + 
                             Math.floor(Math.random() * (notes.length / 4));
    
    // Only proceed if there's enough space
    if (repeatStartIndex + patternLength >= notes.length) return;
    
    // Repeat the pattern with slight variations
    for (let i = 0; i < patternLength && (repeatStartIndex + i) < notes.length; i++) {
      // Copy pattern note but keep original ID
      const originalNote = pattern[i];
      const targetNote = notes[repeatStartIndex + i];
      
      // 80% chance to use the pattern note, 20% to keep target note (variation)
      if (Math.random() < 0.8) {
        // Copy note but preserve ID and adjust startBeat
        targetNote.noteName = originalNote.noteName;
        targetNote.duration = originalNote.duration;
      }
    }
  };
  
  // Helper function to apply mode-specific emphasis to notes
  const applyModeEmphasis = (noteBase, mode, chordRoot, startPos) => {
    // Process the mode-specific characteristic notes
    // Each mode has certain characteristic tones that define its sound
    
    // Define the characteristic notes for each mode
    const modeCharacteristics = {
      'ionian': ['4', '7'],      // Major scale: 4th and 7th are characteristic
      'dorian': ['6', 'b7'],     // Dorian: natural 6th and flat 7th
      'phrygian': ['b2', 'b3'],  // Phrygian: flat 2nd and flat 3rd
      'lydian': ['#4', '7'],     // Lydian: sharp 4th and major 7th
      'mixolydian': ['4', 'b7'], // Mixolydian: perfect 4th and flat 7th
      'aeolian': ['b3', 'b6'],   // Aeolian: flat 3rd and flat 6th
      'locrian': ['b2', 'b5']    // Locrian: flat 2nd and flat 5th
    };
    
    // Just return the note for now - we'll implement a more sophisticated 
    // approach in the future to emphasize characteristic mode tones
    return noteBase;
  };

  // Update getScaleNotes to be more reliable for all scales
  const getScaleNotesForMelody = (root, mode) => {
    console.log(`Getting scale notes for melody with root=${root}, mode=${mode}`);
    let intervals = [];
    
    // Define intervals for each mode (semitones from root)
    switch(mode.toLowerCase()) {
      case 'ionian':
      case 'major':
        // W W H W W W H
        intervals = [0, 2, 4, 5, 7, 9, 11];
        break;
      case 'dorian':
        // W H W W W H W
        intervals = [0, 2, 3, 5, 7, 9, 10];
        break;
      case 'phrygian':
        // H W W W H W W
        intervals = [0, 1, 3, 5, 7, 8, 10];
        break;
      case 'lydian':
        // W W W H W W H
        intervals = [0, 2, 4, 6, 7, 9, 11];
        break;
      case 'mixolydian':
        // W W H W W H W
        intervals = [0, 2, 4, 5, 7, 9, 10];
        break;
      case 'aeolian':
      case 'minor':
        // W H W W H W W
        intervals = [0, 2, 3, 5, 7, 8, 10];
        break;
      case 'locrian':
        // H W W H W W W
        intervals = [0, 1, 3, 5, 6, 8, 10];
        break;
      default:
        // Default to major scale if mode not recognized
        intervals = [0, 2, 4, 5, 7, 9, 11];
        console.warn(`Mode ${mode} not recognized, defaulting to major scale`);
    }
    
    // Convert root note to midi number
    const rootNote = root.replace(/[0-9]/g, '');
    const rootOctave = parseInt(root.match(/[0-9]/)?.[0] || '4');
    
    const rootMidi = {
      'C': 60, 'C#': 61, 'Db': 61, 'D': 62, 'D#': 63, 'Eb': 63,
      'E': 64, 'F': 65, 'F#': 66, 'Gb': 66, 'G': 67, 'G#': 68, 
      'Ab': 68, 'A': 69, 'A#': 70, 'Bb': 70, 'B': 71
    }[rootNote] + (rootOctave - 4) * 12;
    
    if (rootMidi === undefined) {
      console.error(`Invalid root note: ${rootNote}`);
      return [];
    }
    
    // Generate the notes based on intervals
    const midiNotes = intervals.map(interval => rootMidi + interval);
    
    // Convert midi notes to note names
    const noteNames = midiNotes.map(midi => {
      const noteName = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][midi % 12];
      const octave = Math.floor(midi / 12) - 1;
      return `${noteName}${octave}`;
    });
    
    // Filter out "avoid notes" based on mode and root
    let filteredNoteNames = [...noteNames];
    
    // Create a function to identify avoid notes based on the mode and root
    const shouldAvoidNote = (noteName, rootName, modeName) => {
      // Extract just the note without octave
      const note = noteName.replace(/[0-9]/g, '');
      const baseRoot = rootName.replace(/[0-9]/g, '');
      
      // Check for specific avoid notes based on mode and root
      if (modeName.toLowerCase() === 'ionian' && baseRoot === 'C' && note === 'F') {
        return true; // Avoid F in C Ionian
      }
      if (modeName.toLowerCase() === 'locrian' && baseRoot === 'B' && note === 'C') {
        return true; // Avoid C in B Locrian
      }
      if (modeName.toLowerCase() === 'phrygian' && baseRoot === 'E' && note === 'F') {
        return true; // Avoid F in E Phrygian
      }
      if (modeName.toLowerCase() === 'aeolian' && baseRoot === 'A' && note === 'F') {
        return true; // Avoid F in A Aeolian
      }
      if (modeName.toLowerCase() === 'dorian' && baseRoot === 'D' && note === 'B') {
        return true; // Avoid B in D Dorian
      }
      
      return false;
    };
    
    // Filter notes based on avoid notes logic
    filteredNoteNames = noteNames.filter(note => !shouldAvoidNote(note, rootNote, mode));
    
    // If filtering removed too many notes, fall back to original scale
    if (filteredNoteNames.length < 5) {
      console.warn(`Filtering removed too many notes for ${rootNote} ${mode}, using full scale`);
      filteredNoteNames = noteNames;
    }
    
    // Extract just the note names without octaves for the scale
    const scaleNotes = filteredNoteNames.map(note => note.replace(/[0-9]/g, ''));
    
    console.log(`Generated scale notes for ${rootNote} ${mode}:`, scaleNotes);
    return scaleNotes;
  };

  // Function to stop piano roll playback
  const stopPianoRollMelody = () => {
    console.log("Stopping piano roll melody immediately");
    
    // Immediately clear interval
    if (pianoRollPlaybackRef.current) {
      clearInterval(pianoRollPlaybackRef.current);
      pianoRollPlaybackRef.current = null;
    }
    
    // Reset state
    setIsPianoRollPlaying(false);
    setPianoRollPlayPosition(0);
    
    // Stop all active sounds immediately
    stopAllNotes();
    
    // Force immediate UI update to reset position
    setTimeout(() => {
      setPianoRollPlayPosition(0);
    }, 10);
  };

  // Combined function to play both chord progression and melody
  const playBoth = async () => {
    console.log("PlayBoth called");
    
    // Stop any current playback
    if (isPlayingSequence || isPianoRollPlaying) {
      stopAll();
      return;
    }

    // Check if we have chords and melody to play
    const validChords = timelineChords.filter(chord => chord !== null);
    const hasMelody = pianoRollNotes && pianoRollNotes.length > 0;
    
    console.log("Valid chords:", validChords);
    console.log("Has melody:", hasMelody, "Notes:", pianoRollNotes);
    
    if (validChords.length === 0 && !hasMelody) {
      showMessageModal('Add chords or melody first!', 'Missing Content');
      return;
    }
    
    // Always initialize the audio context first
    if (!audioContextStarted) {
      try {
        await Tone.start();
        setAudioContextStarted(true);
        console.log("Audio context started");
      } catch (err) {
        console.error("Failed to start audio context:", err);
        return;
      }
    }
    
    // Start drum pattern if enabled
    if (isDrumPatternActive) {
      console.log("Starting drum pattern immediately");
      playDrumPattern(120); // Use 120 BPM
    } else {
      console.log("Drums disabled, not starting pattern");
    }
    
    // Initialize lead synth if not already done (for melody)
    if (!leadSynth) {
      console.log("Creating new lead synth");
      // Create a dedicated synth for melodies with more volume
      const melodySynth = new Tone.PolySynth(Tone.Synth, {
        volume: 6, // Higher volume than the chord synth
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.5,
          release: 0.4,
        }
      }).toDestination();
      
      setLeadSynth(melodySynth);
    } else {
      console.log("Using existing lead synth");
    }
    
    // Set the playback states
    setIsPlayingSequence(validChords.length > 0);
    setIsPianoRollPlaying(hasMelody);
    setPianoRollPlayPosition(0);
    
    // CHORD PROGRESSION PART
    if (validChords.length > 0) {
      console.log("Starting chord progression playback with", validChords.length, "chords");
      
      // We'll use chordIndex to track which chord we're playing
      let chordIndex = 0;
      
      // Function to play the current chord and set up the next one
      const playCurrentChord = () => {
        console.log("Playing chord index:", chordIndex);
        
        // Stop any previous notes
        stopAllNotes();
        
        // Play the current chord if valid
        if (chordIndex < timelineChords.length && timelineChords[chordIndex]) {
          console.log("Playing chord:", timelineChords[chordIndex].name);
          playSound(timelineChords[chordIndex].name);
          setCurrentSequenceIndex(chordIndex);
        }
        
        // Move to next chord for next time
        chordIndex++;
        
        // If we've played all chords
        if (chordIndex >= timelineChords.length) {
          console.log("Reached the end of chord progression");
          
          if (isLoopModeActive) {
            // If loop mode is active, start over from the beginning
            console.log("Loop mode active - resetting chord progression to beginning");
            
            // Make sure to release all notes before looping
            stopAllNotes();
            
            chordIndex = 0;
            return; // Continue playing with the next interval
          }
          
          // If not looping, schedule ending the chord progression
          setTimeout(() => {
            console.log("Ending chord progression");
            if (sequenceRef.current) {
              clearInterval(sequenceRef.current);
              sequenceRef.current = null;
            }
            setIsPlayingSequence(false);
            setCurrentSequenceIndex(-1);
            
            // If we're not playing melody, stop completely
            if (!hasMelody || !isPianoRollPlaying) {
              stopAll();
            }
          }, 2000); // Let the last chord play for its full duration
        }
      };
      
      // Play the first chord immediately
      playCurrentChord();
      
      // Set up interval to play remaining chords
      if (timelineChords.length > 1) {
        sequenceRef.current = setInterval(playCurrentChord, 2000); // 2 seconds per chord
      }
    }
    
    // MELODY PART
    if (hasMelody) {
      console.log("Starting melody playback");
      
      // Sort notes by starting time
      const sortedNotes = [...pianoRollNotes].sort((a, b) => a.startBeat - b.startBeat);
      console.log("Sorted notes:", sortedNotes);
      
      // Group notes by starting time
      const notesByPosition = {};
      sortedNotes.forEach(note => {
        if (!notesByPosition[note.startBeat]) {
          notesByPosition[note.startBeat] = [];
        }
        notesByPosition[note.startBeat].push(note);
      });
      
      console.log("Notes by position:", notesByPosition);
      
      // Find the maximum time position (end of the last note)
      const maxPosition = Math.max(
        ...sortedNotes.map(n => n.startBeat + n.duration),
        64 - 1 // Default to 64 sixteenth notes (4 bars)
      );
      
      console.log("Max position:", maxPosition);
      
      // For smoother playhead movement, use a faster visual update rate
      let currentPosition = 0;
      let lastNotePosition = -1;
      const playInterval = 125; // 16th notes at 120 BPM = 125ms between notes
      const visualInterval = 40; // Update visuals more frequently (25fps)
      
      // Test play a single note to verify synth is working
      if (sortedNotes.length > 0) {
        console.log("Playing test note:", sortedNotes[0].noteName);
        playNote(sortedNotes[0].noteName);
      }
      
      // Use setInterval for visual updates
      pianoRollPlaybackRef.current = setInterval(() => {
        // Calculate the current musical position
        const elapsed = (currentPosition * visualInterval);
        const musicalPosition = Math.floor(elapsed / playInterval);
        
        // Calculate a smoother visual position with decimal values
        const smoothPosition = elapsed / playInterval;
        
        // Update the visual playhead
        setPianoRollPlayPosition(smoothPosition);
        
        // Play notes only when we reach a new musical position
        if (musicalPosition > lastNotePosition) {
          lastNotePosition = musicalPosition;
          
          // Play notes that start at this position
          if (notesByPosition[musicalPosition]) {
            console.log("Playing notes at position", musicalPosition, ":", notesByPosition[musicalPosition]);
            notesByPosition[musicalPosition].forEach(note => {
              playNote(note.noteName);
            });
          }
        }
        
        currentPosition++;
        
        // Stop melody when reaching the end
        if (musicalPosition > maxPosition) {
          if (pianoRollPlaybackRef.current) {
            clearInterval(pianoRollPlaybackRef.current);
            pianoRollPlaybackRef.current = null;
          }
          setIsPianoRollPlaying(false);
          setPianoRollPlayPosition(0);
          
          // If chord sequence is not playing, stop completely
          if (!isPlayingSequence) {
            stopAll();
          }
        }
      }, visualInterval);
    }
  };

  // Custom component to ensure progression and piano roll alignment
  const AlignedProgressionAndPianoRoll = () => {
    // Define a variable for the piano roll config for reference
    const pianoRollConfig = {
      keyWidth: 60,
      barCount: 4
    };
    
    // Calculate exact position to align with piano roll
    const contentWidth = `calc(100% - ${pianoRollConfig.keyWidth}px)`;
    
    return (
      <div style={{ 
        width: '100%', 
        maxWidth: '768px', 
        margin: '0 auto',
        position: 'relative' 
      }}>
        {/* Combined controls for both progression and piano roll */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '12px',
          padding: '0 5px'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={generateMelody}
              style={{
                padding: '6px 14px',
                background: 'linear-gradient(90deg, #FF6B6B, #FFD166)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: 'pointer',
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
              }}
            >
              <span style={{ fontSize: '0.8rem' }}>✨</span> {t('synth.generateMelody', 'Generate Melody')}
            </button>
            
            <button
              onClick={playBoth}
              disabled={isPlayingSequence || isPianoRollPlaying || !timelineChords.some(chord => chord !== null)}
              style={{
                padding: '6px 14px',
                background: (isPlayingSequence || isPianoRollPlaying) ? 'rgba(108, 99, 255, 0.3)' : 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold',
                cursor: (isPlayingSequence || isPianoRollPlaying || !timelineChords.some(chord => chord !== null)) ? 'not-allowed' : 'pointer',
                opacity: (isPlayingSequence || isPianoRollPlaying || !timelineChords.some(chord => chord !== null)) ? 0.7 : 1,
                userSelect: 'none',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span style={{ fontSize: '0.8rem' }}>▶</span> {t('common.play', 'Play')}
            </button>
            
            <button
              onClick={stopAll}
              style={{
                padding: '8px 16px',
                background: (isPlayingSequence || isPianoRollPlaying || activeNotes.length > 0) ? '#FF2244' : 'rgba(255, 34, 68, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                opacity: (isPlayingSequence || isPianoRollPlaying || activeNotes.length > 0) ? 1 : 0.9,
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
                position: 'relative',
                zIndex: 10,
                minWidth: '100px'
              }}
              title="Immediately stop all playback and reset"
            >
              <span style={{ fontSize: '1.1rem' }}>■</span> {t('synth.stopAll', 'Stop')}
            </button>
            <button
              onClick={toggleDrumPattern}
              style={{
                padding: '10px 18px',  // Larger padding
                background: isPlayingSequence || isDrumPatternActive ? 'linear-gradient(90deg, #FF8E53, #FE6B8B)' : 'rgba(255, 142, 83, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',  // Slightly rounded corners
                fontWeight: 'bold',
                fontSize: '1rem',     // Larger font
                cursor: 'pointer',
                opacity: isPlayingSequence || isDrumPatternActive ? 1 : 0.8,
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',  // More prominent shadow
                marginLeft: '10px',
                position: 'relative'  // For tooltip positioning
              }}
              title="Click to toggle drum pattern on/off"  // Tooltip on hover
            >
              <span style={{ fontSize: '1.2rem' }}>🥁</span> {isPlayingSequence ? 'Drums Playing' : (isDrumPatternActive ? 'Drums On' : 'Drums Off')}
            </button>
            
            {/* Loop Button */}
            <button
              onClick={toggleLoopMode}
              style={{
                padding: '10px 18px',
                background: isLoopModeActive ? 'linear-gradient(90deg, #4CAF50, #2E7D32)' : 'rgba(76, 175, 80, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: '1rem',
                cursor: 'pointer',
                opacity: isLoopModeActive ? 1 : 0.8,
                userSelect: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
                marginLeft: '10px',
                position: 'relative'
              }}
              title="Click to toggle loop mode on/off"
            >
              <span style={{ fontSize: '1.2rem' }}>🔄</span> {isLoopModeActive ? 'Loop On' : 'Loop Off'}
            </button>
          </div>
        </div>
        
        {/* Container for integrated progression and piano roll */}
        <div style={{ position: 'relative' }}>
          {/* Progression timeline directly above piano roll */}
          <div style={{ position: 'relative', display: 'flex' }}>
            {/* Blank space matching piano key width */}
            <div style={{ 
              width: `${pianoRollConfig.keyWidth}px`,
              height: '25px',
              backgroundColor: '#1f1f2f',
              borderRight: '1px solid rgba(255, 255, 255, 0.2)'
            }}></div>
            
            {/* Progression slots */}
            <div style={{ 
              display: 'flex',
              width: contentWidth,
              height: '25px'
            }}>
              {timelineChords.map((chord, index) => (
                <div 
                  key={index} 
                  style={{
                    width: '25%',
                    height: '100%',
                    backgroundColor: chord ? getChordColor(chord.note) : 'rgba(30, 30, 40, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    borderBottom: '1px solid rgba(50, 50, 60, 0.8)',
                    borderRight: index < 3 ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                    boxShadow: currentSequenceIndex === index 
                      ? '0 0 10px rgba(255, 255, 255, 0.3)' 
                      : 'none'
                  }}
                >
                  {chord ? chord.name : '-'}
                </div>
              ))}
            </div>
          </div>
          
          {/* Piano Roll right below the progression */}
          <PianoRoll
            onNotesChange={handlePianoRollNotesChange}
            onNotePlay={playNote}
            initialNotes={pianoRollNotes}
            externalPlaybackPosition={pianoRollPlayPosition}
          />
        </div>
      </div>
    );
  };

  // Wizard step content rendering
  const renderWizardStepContent = () => {
    switch (wizardStep) {
      case 1: // Chord Progression (now first)
        return (
          <div className="wizard-step">
            <div className="wizard-step-header">
              <h3>{t('synth.wizard.step1.title', 'Step 1: Chord Progressions')}</h3>
              <p>{t('synth.wizard.step1.description', 'Start with the harmonic backbone of your composition. When you first open Cymasphere, a song is already created and ready for your input.')}</p>
            </div>
            
            {/* Preview notice */}
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'rgba(255, 255, 255, 0.7)', 
              textAlign: 'center',
              marginBottom: '15px',
              padding: '8px',
              border: '1px dashed rgba(78, 205, 196, 0.4)',
              borderRadius: '6px',
              background: 'rgba(78, 205, 196, 0.1)'
            }}>
              This is just a preview. The full application offers a much richer set of chord voicings and harmonic options.
              </div>
              
            {/* Chord Type Selector */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: '15px',
              width: '100%',
              maxWidth: '750px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <label style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.95rem',
                  fontWeight: '500'
                }}>
                  Chord Type:
                </label>
                <select 
                  style={{
                    background: 'rgba(30, 30, 46, 0.8)',
                    border: '1px solid rgba(108, 99, 255, 0.4)',
                    borderRadius: '4px',
                    color: 'white',
                    padding: '6px 12px',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    minWidth: '120px'
                  }}
                  value={chordType}
                  onChange={handleChordTypeChange}
                >
                  <option value="triads">Triads</option>
                  <option value="7ths">7ths</option>
                  <option value="9ths">9ths</option>
                </select>
            </div>
          </div>
            
            {/* 7th chords subtext - moved right after chord bank */}
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'rgba(255, 255, 255, 0.7)', 
              marginTop: '-10px', 
              textAlign: 'center',
              marginBottom: '15px'
            }}>
              {chordType === 'triads' ? 'Triads' : chordType === '7ths' ? '7th chords' : '9th chords'} in the key of C
            </div>
            
            {/* Chord Bank */}
            <ChordBank 
              chordBank={chordBankData} 
              onChordClick={playSound} 
            />
            
            {/* Drag indicator between ChordBank and Timeline */}
            <DragIndicator />
            
            {/* Timeline Component with reduced margin */}
            <Timeline 
              onTimelineUpdate={handleTimelineUpdate} 
              isPlaying={isPlayingSequence}
              currentSlotIndex={currentSequenceIndex}
              initialSlots={timelineChords}
            />
            
            {/* Play/Stop and Generate Buttons moved BELOW timeline */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              width: '100%', 
              maxWidth: '750px',
              marginTop: '20px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={generateRandomProgression}
                  style={{
                    padding: '8px 15px',
                    background: 'linear-gradient(90deg, #FF8E53, #FE6B8B)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.8rem' }}>✨</span> {t('common.generate', 'Generate')}
                </button>
                <button
                  onClick={playBoth}
                  disabled={isPlayingSequence || !timelineChords.some(chord => chord !== null)}
                  style={{
                    padding: '8px 15px',
                    background: (isPlayingSequence || !timelineChords.some(chord => chord !== null)) ? 'rgba(108, 99, 255, 0.3)' : 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    cursor: (isPlayingSequence || !timelineChords.some(chord => chord !== null)) ? 'not-allowed' : 'pointer',
                    opacity: (isPlayingSequence || !timelineChords.some(chord => chord !== null)) ? 0.7 : 1,
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    minWidth: '100px',
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: '0.8rem' }}>▶</span> {t('common.play', 'Play')}
                </button>
                <button
                  onClick={stopAll}
                  style={{
                    padding: '8px 16px',
                    background: (isPlayingSequence || isPianoRollPlaying || activeNotes.length > 0) ? '#FF2244' : 'rgba(255, 34, 68, 0.8)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    opacity: (isPlayingSequence || isPianoRollPlaying || activeNotes.length > 0) ? 1 : 0.9,
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
                    position: 'relative',
                    zIndex: 10,
                    minWidth: '100px'
                  }}
                  title="Immediately stop all playback and reset"
                >
                  <span style={{ fontSize: '1.1rem' }}>■</span> {t('synth.stopAll', 'Stop')}
                </button>
                <button
                  onClick={toggleDrumPattern}
                  style={{
                    padding: '10px 18px',  // Larger padding
                    background: isPlayingSequence || isDrumPatternActive ? 'linear-gradient(90deg, #FF8E53, #FE6B8B)' : 'rgba(255, 142, 83, 0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',  // Slightly rounded corners
                    fontWeight: 'bold',
                    fontSize: '1rem',     // Larger font
                    cursor: 'pointer',
                    opacity: isPlayingSequence || isDrumPatternActive ? 1 : 0.8,
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',  // More prominent shadow
                    marginLeft: '10px',
                    position: 'relative'  // For tooltip positioning
                  }}
                  title="Click to toggle drum pattern on/off"  // Tooltip on hover
                >
                  <span style={{ fontSize: '1.2rem' }}>🥁</span> {isPlayingSequence ? 'Drums Playing' : (isDrumPatternActive ? 'Drums On' : 'Drums Off')}
                </button>
                
                {/* Loop Button */}
                <button
                  onClick={toggleLoopMode}
                  style={{
                    padding: '10px 18px',
                    background: isLoopModeActive ? 'linear-gradient(90deg, #4CAF50, #2E7D32)' : 'rgba(76, 175, 80, 0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    opacity: isLoopModeActive ? 1 : 0.8,
                    userSelect: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
                    marginLeft: '10px',
                    position: 'relative'
                  }}
                  title="Click to toggle loop mode on/off"
                >
                  <span style={{ fontSize: '1.2rem' }}>🔄</span> {isLoopModeActive ? 'Loop On' : 'Loop Off'}
                </button>
              </div>
            </div>
            
            <div className="wizard-navigation">
              <button 
                onClick={nextWizardStep}
                disabled={!isStepReady()}
                className={`wizard-next-button ${!isStepReady() ? 'disabled' : ''}`}
              >
                Continue to Pattern <span>→</span>
              </button>
            </div>
          </div>
        );
      
      case 2: // Pattern (now second step)
        return (
          <div className="wizard-step">
            <div className="wizard-step-header">
              <h3>{t('synth.wizard.step2.title', 'Step 2: Pattern Creation')}</h3>
              <p>{t('synth.wizard.step2.description', 'Create melodic patterns that work with your chord progression. Each pattern intelligently uses your progression and underlying scales to ensure perfect harmony.')}</p>
            </div>
            
            {/* Preview notice */}
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'rgba(255, 255, 255, 0.7)', 
              textAlign: 'center',
              marginBottom: '15px',
              padding: '8px',
              border: '1px dashed rgba(78, 205, 196, 0.4)',
              borderRadius: '6px',
              background: 'rgba(78, 205, 196, 0.1)'
            }}>
              In the full application, you can create more complex patterns with various rhythmic elements and textures.
            </div>
            
            {/* Custom component that ensures alignment */}
            <AlignedProgressionAndPianoRoll />
            
            <div className="wizard-navigation">
              <button onClick={prevWizardStep} className="wizard-prev-button">
                <span>←</span> Back to Pattern
              </button>
              <button 
                onClick={nextWizardStep}
                disabled={!isStepReady()}
                className={`wizard-next-button ${!isStepReady() ? 'disabled' : ''}`}
              >
                Continue to Export <span>→</span>
              </button>
            </div>
          </div>
        );
      
      case 3: // Export (now third step)
        return (
          <div className="wizard-step">
            <div className="wizard-step-header">
              <h3>{t('synth.wizard.step3.title', 'Step 3: Export Your Composition')}</h3>
              <p>{t('synth.wizard.step3.description', 'Export your composition as a MIDI file or share it with others.')}</p>
            </div>
            
            {/* Preview notice */}
            <div style={{ 
              fontSize: '0.9rem', 
              color: 'rgba(255, 255, 255, 0.7)', 
              textAlign: 'center',
              marginBottom: '15px',
              padding: '8px',
              border: '1px dashed rgba(78, 205, 196, 0.4)',
              borderRadius: '6px',
              background: 'rgba(78, 205, 196, 0.1)'
            }}>
              The full application allows you to export your composition as a MIDI file, which can be played on any MIDI-compatible device.
            </div>
            
            {/* Mockup of export options (simplified for demo) */}
            <div style={{ 
              background: 'rgba(30, 30, 46, 0.6)',
              border: '1px solid rgba(108, 99, 255, 0.2)',
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '20px',
              maxWidth: '700px',
              width: '100%'
            }}>
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--accent)' }}>Export Options</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>MIDI Format</span>
                  <div>
                    <button style={{
                      background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem',
                      opacity: 0.9
                    }}>Standard</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>MIDI-7</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>MIDI-21</button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>MIDI Channel</span>
                  <div>
                    <button style={{
                      background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem',
                      opacity: 0.9
                    }}>1</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>2</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>3</button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>MIDI Velocity</span>
                  <div>
                    <button style={{
                      background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem',
                      opacity: 0.9
                    }}>64</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>100</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>127</button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 style={{ fontSize: '1.1rem', marginBottom: '10px', color: 'var(--accent)' }}>Additional Settings</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Tempo</span>
                  <div>
                    <button style={{
                      background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem',
                      opacity: 0.9
                    }}>120 BPM</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>160 BPM</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>200 BPM</button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>Key Signature</span>
                  <div>
                    <button style={{
                      background: 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem',
                      opacity: 0.9
                    }}>C Major</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      marginRight: '5px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>G Major</button>
                    <button style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      padding: '3px 10px',
                      color: 'white',
                      fontSize: '0.8rem'
                    }}>D Major</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="wizard-navigation">
              <button onClick={prevWizardStep} className="wizard-prev-button">
                <span>←</span> Back to Pattern
              </button>
              <button 
                className="wizard-finish-button"
                onClick={() => setFinishModalOpen(true)}
              >
                Finish <span>✓</span>
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  // Toggle loop mode
  const toggleLoopMode = () => {
    // Toggle the loop mode state
    setIsLoopModeActive(!isLoopModeActive);
    console.log("Loop mode toggled to:", !isLoopModeActive);
  };

  // Add modal state
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  // Function to show modal instead of alert
  const showMessageModal = (message, title = 'Information') => {
    setModalTitle(title);
    setModalMessage(message);
    setShowModal(true);
  };
  
  // Function to close modal
  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <SynthesizerWrapper className={isWizardMode ? 'wizard-mode' : ''}>
        {!isWizardMode ? (
          // Original non-wizard layout
          <>
            <h2>{t('synth.title', 'Intelligent Chord Voicing Generator')}</h2>
            <p style={{ marginBottom: '10px' }}>
              {t('synth.description', 'Create lush, beautiful chords with the press of a button.')}
            </p>
            
            {/* Synth controls */}
            <div className="synth-controls">
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Chord Type Selector */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '15px',
                width: '100%',
                maxWidth: '750px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <label style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>
                    Chord Type:
                  </label>
                  <select 
                    style={{
                      background: 'rgba(30, 30, 46, 0.8)',
                      border: '1px solid rgba(108, 99, 255, 0.4)',
                      borderRadius: '4px',
                      color: 'white',
                      padding: '6px 12px',
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      minWidth: '120px'
                    }}
                    value={chordType}
                    onChange={handleChordTypeChange}
                  >
                    <option value="triads">Triads</option>
                    <option value="7ths">7ths</option>
                    <option value="9ths">9ths</option>
                  </select>
                </div>
              </div>
              
                {/* Chord Bank - Moved to top */}
                <ChordBank 
                  chordBank={chordBankData} 
                  onChordClick={playSound} 
                />
                
                {/* 7th chords subtext - moved right after chord bank */}
                <div style={{ 
                  fontSize: '0.9rem', 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  marginTop: '-10px', 
                  textAlign: 'center',
                  marginBottom: '15px'
                }}>
                {chordType === 'triads' ? 'Triads' : chordType === '7ths' ? '7th chords' : '9th chords'} in the key of C
                </div>
                
                {/* Drag indicator between ChordBank and Timeline */}
                <DragIndicator />
                
                {/* Timeline Component */}
                <Timeline 
                  onTimelineUpdate={handleTimelineUpdate} 
                  isPlaying={isPlayingSequence}
                  currentSlotIndex={currentSequenceIndex}
                  initialSlots={timelineChords}
                />
                
                {/* Play/Stop/Generate Buttons moved BELOW timeline */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  width: '100%', 
                  maxWidth: '750px',
                  marginTop: '20px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={generateRandomProgression}
                      style={{
                        padding: '8px 15px',
                        background: 'linear-gradient(90deg, #FF8E53, #FE6B8B)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        minWidth: '100px',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem' }}>✨</span> {t('common.generate', 'Generate')}
                    </button>
                    <button
                      onClick={playBoth}
                      disabled={isPlayingSequence || !timelineChords.some(chord => chord !== null)}
                      style={{
                        padding: '8px 15px',
                        background: (isPlayingSequence || !timelineChords.some(chord => chord !== null)) ? 'rgba(108, 99, 255, 0.3)' : 'linear-gradient(90deg, #6C63FF, #4ECDC4)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        cursor: (isPlayingSequence || !timelineChords.some(chord => chord !== null)) ? 'not-allowed' : 'pointer',
                        opacity: (isPlayingSequence || !timelineChords.some(chord => chord !== null)) ? 0.7 : 1,
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        minWidth: '100px',
                        justifyContent: 'center'
                      }}
                    >
                      <span style={{ fontSize: '0.8rem' }}>▶</span> {t('common.play', 'Play')}
                    </button>
                    <button
                      onClick={stopAll}
                      style={{
                      padding: '8px 16px',
                      background: (isPlayingSequence || isPianoRollPlaying || activeNotes.length > 0) ? '#FF2244' : 'rgba(255, 34, 68, 0.8)',
                        color: 'white',
                        border: 'none',
                      borderRadius: '6px',
                        fontWeight: 'bold',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      opacity: (isPlayingSequence || isPianoRollPlaying || activeNotes.length > 0) ? 1 : 0.9,
                        userSelect: 'none',
                        display: 'flex',
                        alignItems: 'center',
                      justifyContent: 'center',
                        gap: '5px',
                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
                      position: 'relative',
                      zIndex: 10,
                      minWidth: '100px'
                    }}
                    title="Immediately stop all playback and reset"
                  >
                    <span style={{ fontSize: '1.1rem' }}>■</span> {t('synth.stopAll', 'Stop')}
                  </button>
                  <button
                    onClick={toggleDrumPattern}
                    style={{
                      padding: '10px 18px',  // Larger padding
                      background: isPlayingSequence || isDrumPatternActive ? 'linear-gradient(90deg, #FF8E53, #FE6B8B)' : 'rgba(255, 142, 83, 0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',  // Slightly rounded corners
                      fontWeight: 'bold',
                      fontSize: '1rem',     // Larger font
                      cursor: 'pointer',
                      opacity: isPlayingSequence || isDrumPatternActive ? 1 : 0.8,
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',  // More prominent shadow
                      marginLeft: '10px',
                      position: 'relative'  // For tooltip positioning
                    }}
                    title="Click to toggle drum pattern on/off"  // Tooltip on hover
                  >
                    <span style={{ fontSize: '1.2rem' }}>🥁</span> {isPlayingSequence ? 'Drums Playing' : (isDrumPatternActive ? 'Drums On' : 'Drums Off')}
                  </button>
                  
                  {/* Loop Button */}
                  <button
                    onClick={toggleLoopMode}
                    style={{
                      padding: '10px 18px',
                      background: isLoopModeActive ? 'linear-gradient(90deg, #4CAF50, #2E7D32)' : 'rgba(76, 175, 80, 0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      opacity: isLoopModeActive ? 1 : 0.8,
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 3px 6px rgba(0, 0, 0, 0.3)',
                      marginLeft: '10px',
                      position: 'relative'
                    }}
                    title="Click to toggle loop mode on/off"
                  >
                    <span style={{ fontSize: '1.2rem' }}>🔄</span> {isLoopModeActive ? 'Loop On' : 'Loop Off'}
                    </button>
                  </div>
                </div>
                
                {/* Piano Roll */}
                <PianoRoll
                  onNotesChange={handlePianoRollNotesChange}
                  onNotePlay={playNote}
                />
              </div>
              
              {/* Synth selector */}
              <div className="selector-container" style={{ marginTop: '20px' }}>
                <SynthSelector 
                  selectedSynth={selectedSynth} 
                  onSynthChange={handleSynthChange}
                  midiOutputs={midiOutputs}
                selectedOutput={midiSelectedPort}
                  onOutputChange={handleMidiDeviceChange}
                  selectedPreset={selectedPreset}
                  onPresetChange={handlePresetChange}
                />
              </div>
              
              {/* Stop button moved to the bottom */}
              <div style={{ marginTop: '20px', marginBottom: '10px', display: 'flex', justifyContent: 'center' }}>
                <StopButton onStop={stopAll} />
              </div>
            </div>
          </>
        ) : (
          // Wizard mode layout
          <div className="wizard-container">
            {/* Section Title and Description */}
            {sectionTitle && (
              <div style={{ 
                textAlign: 'center', 
                marginBottom: '30px',
                position: 'relative',
                zIndex: 1
              }}>
                <h2 className="section-title">
                  {sectionTitle}
                </h2>
                {sectionDescription && <p>{sectionDescription}</p>}
              </div>
            )}
            
            {/* Wizard progress indicator */}
            <div className="wizard-progress">
              <div 
                className={`wizard-step-indicator ${wizardStep === 1 ? 'active' : wizardStep > 1 ? 'completed' : ''} ${canNavigateToStep(1) ? 'clickable' : ''}`}
                onClick={() => goToStep(1)}
              >
                <div className="step-number">1</div>
              <div className="step-label">Progression</div>
              </div>
              <div className="progress-line"></div>
              <div 
                className={`wizard-step-indicator ${wizardStep === 2 ? 'active' : wizardStep > 2 ? 'completed' : ''} ${canNavigateToStep(2) ? 'clickable' : ''}`}
                onClick={() => goToStep(2)}
              >
                <div className="step-number">2</div>
              <div className="step-label">Pattern</div>
              </div>
              <div className="progress-line"></div>
              <div 
                className={`wizard-step-indicator ${wizardStep === 3 ? 'active' : wizardStep > 3 ? 'completed' : ''} ${canNavigateToStep(3) ? 'clickable' : ''}`}
                onClick={() => goToStep(3)}
              >
                <div className="step-number">3</div>
              <div className="step-label">Export</div>
              </div>
            </div>
            
            {/* Wizard content area */}
            {renderWizardStepContent()}
            
            {/* Synth selector - hidden in wizard mode but still functional */}
            <div className="selector-container" style={{ marginTop: '20px', display: 'none' }}>
              <SynthSelector 
                selectedSynth={selectedSynth} 
                onSynthChange={handleSynthChange}
                midiOutputs={midiOutputs}
              selectedOutput={midiSelectedPort}
                onOutputChange={handleMidiDeviceChange}
                selectedPreset={selectedPreset}
                onPresetChange={handlePresetChange}
              />
            </div>
          </div>
        )}
      
      <ParticleSystem
        active={particleProps.active}
        position={particleProps.position}
        color={particleProps.color}
      />
      
      {/* Finish Modal */}
      <FinishModal 
        isOpen={finishModalOpen}
        onClose={() => setFinishModalOpen(false)}
        songName={songName}
        trackName={trackName}
        t={t}
      />
      
      {/* Add the Confirmation Modal */}
      <AnimatePresence>
        {showModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <ModalContent
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>{modalTitle}</ModalTitle>
                <CloseButton onClick={closeModal}>
                  <span>&times;</span>
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <p style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1.5rem' }}>
                  {modalMessage}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button onClick={closeModal}>
                  Got It
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </SynthesizerWrapper>
  );
};

export default SynthesizerContainer; 