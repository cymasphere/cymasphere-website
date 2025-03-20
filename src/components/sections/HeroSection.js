import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import * as Tone from 'tone';
import SYNTH_PRESETS, { getPresetById } from '../../utils/presets';
import { createSynth, disposeSynth } from '../../utils/synthUtils';
import useEffectsChain from '../../hooks/useEffectsChain';
import { Container, Button } from '../ui/CommonComponents';

const HeroContainer = styled.section`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 20px 80px;
  position: relative;
  overflow: hidden;
  background-color: var(--background);
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 50%, rgba(108, 99, 255, 0.1), transparent 50%),
                radial-gradient(circle at 70% 30%, rgba(78, 205, 196, 0.1), transparent 50%);
    z-index: 0;
  }
`;

const HeroContent = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HeroTitle = styled(motion.h1)`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  text-align: center;
  line-height: 1.1;
  
  @media (max-width: 768px) {
    font-size: 3rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.25rem;
  color: var(--text-secondary);
  margin-bottom: 3rem;
  max-width: 900px;
  text-align: center;
`;

const ButtonGroup = styled(motion.div)`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const PrimaryButton = styled(motion.a)`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  padding: 12px 32px;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(108, 99, 255, 0.4);
  }
`;

const SecondaryButton = styled(motion.a)`
  background: transparent;
  color: var(--text);
  padding: 12px 32px;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  border: 2px solid var(--primary);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(108, 99, 255, 0.1);
    border-color: var(--accent);
  }
`;

const FloatingNote = styled(motion.div)`
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.5rem;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2),
              inset 0 4px 10px rgba(255, 255, 255, 0.3),
              inset 0 -4px 10px rgba(0, 0, 0, 0.2);
  z-index: 2;
  
  &:after {
    content: '';
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), transparent 70%);
    opacity: 0.2;
    pointer-events: none;
  }
`;

const NoteShadow = styled(motion.div)`
  position: absolute;
  width: 60px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.2);
  filter: blur(4px);
  z-index: 1;
`;

const VoiceLeadingLine = styled(motion.div)`
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, 
    rgba(108, 99, 255, 0.5),
    rgba(78, 205, 196, 0.5)
  );
  border-radius: 4px;
  opacity: 0;
  z-index: 1;
`;

// Color mapping for all 12 chromatic pitches
const pitchColors = {
  'C': '#F44336',   // Red
  'C#': '#E91E63', // Pink
  'Db': '#E91E63', // Pink (enharmonic with C#)
  'D': '#9C27B0',  // Purple
  'D#': '#673AB7', // Deep Purple
  'Eb': '#673AB7', // Deep Purple (enharmonic with D#)
  'E': '#3F51B5',  // Indigo
  'F': '#2196F3',  // Blue
  'F#': '#03A9F4', // Light Blue
  'Gb': '#03A9F4', // Light Blue (enharmonic with F#)
  'G': '#009688',  // Teal
  'G#': '#4CAF50', // Green
  'Ab': '#4CAF50', // Green (enharmonic with G#)
  'A': '#8BC34A',  // Light Green
  'A#': '#CDDC39', // Lime
  'Bb': '#CDDC39', // Lime (enharmonic with A#)
  'B': '#FFEB3B',  // Yellow
};

// Function to calculate semitone distance between two notes
const getSemitoneDistance = (note1, note2) => {
  const noteValues = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  
  const value1 = noteValues[note1];
  const value2 = noteValues[note2];
  
  // Calculate distance - smaller value is better for voice leading
  let distance = Math.abs(value1 - value2);
  if (distance > 6) {
    distance = 12 - distance; // Take the shorter route around the octave
  }
  
  return distance;
};

// Convert note name to frequency
const noteToFreq = (noteName) => {
  const noteValues = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5, 
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  
  // Middle C (C4) is MIDI note 60
  const value = noteValues[noteName];
  if (value === undefined) return null;
  
  // Calculate MIDI note number (C4 = 60)
  const midiNote = 60 + value;
  
  // Convert MIDI note to frequency (A4 = 69 = 440Hz)
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

// Color interpolation utility function
const interpolateColor = (startColor, endColor, progress) => {
  // Add safety checks for undefined or invalid colors
  if (!startColor || !endColor) {
    // Default to a purple color if either color is missing
    return '#6C63FF';
  }

  const hexToRgb = (hex) => {
    // Add safety check for undefined or invalid hex values
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
      // Return a default purple color
      return { r: 108, g: 99, b: 255 };
    }
    
    // Remove the # and handle different hex formats (3 or 6 digits)
    const sanitizedHex = hex.slice(1);
    let r, g, b;
    
    if (sanitizedHex.length === 3) {
      r = parseInt(sanitizedHex[0] + sanitizedHex[0], 16);
      g = parseInt(sanitizedHex[1] + sanitizedHex[1], 16);
      b = parseInt(sanitizedHex[2] + sanitizedHex[2], 16);
    } else if (sanitizedHex.length === 6) {
      r = parseInt(sanitizedHex.slice(0, 2), 16);
      g = parseInt(sanitizedHex.slice(2, 4), 16);
      b = parseInt(sanitizedHex.slice(4, 6), 16);
    } else {
      // Invalid hex format, return default
      return { r: 108, g: 99, b: 255 };
    }
    
    return { r, g, b };
  };

  const rgbToHex = (r, g, b) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  // Get RGB values
  const rgbStart = hexToRgb(startColor);
  const rgbEnd = hexToRgb(endColor);

  // Interpolate
  const r = Math.round(rgbStart.r + (rgbEnd.r - rgbStart.r) * progress);
  const g = Math.round(rgbStart.g + (rgbEnd.g - rgbStart.g) * progress);
  const b = Math.round(rgbStart.b + (rgbEnd.b - rgbStart.b) * progress);

  // Convert back to hex
  return rgbToHex(r, g, b);
};

const HeroSection = () => {
  const { t, i18n } = useTranslation();
  
  // Diatonic chords in the key of C in descending 5ths
  const chordProgression = [
    { name: t('hero.chords.cMajor', 'C Major'), notes: ['C', 'E', 'G'] },
    { name: t('hero.chords.fMajor', 'F Major'), notes: ['F', 'A', 'C'] },
    { name: t('hero.chords.bDiminished', 'B Diminished'), notes: ['B', 'D', 'F'] },
    { name: t('hero.chords.eMinor', 'E Minor'), notes: ['E', 'G', 'B'] },
    { name: t('hero.chords.aMinor', 'A Minor'), notes: ['A', 'C', 'E'] },
    { name: t('hero.chords.dMinor', 'D Minor'), notes: ['D', 'F', 'A'] },
    { name: t('hero.chords.gMajor', 'G Major'), notes: ['G', 'B', 'D'] },
  ];

  // Words to cycle through in the hero title - WRAPPED IN USEMEMO TO PREVENT RECREATION
  const titleWords = useMemo(() => [
    t('hero.titleWords.music', 'Music'), 
    t('hero.titleWords.song', 'Song'), 
    t('hero.titleWords.chord', 'Chord'), 
    t('hero.titleWords.pattern', 'Pattern'), 
    t('hero.titleWords.progression', 'Progression'), 
    t('hero.titleWords.voicing', 'Voicing'), 
    t('hero.titleWords.harmony', 'Harmony')
  ], [t, i18n.language]); // Only recreate when translation function or language changes
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isAnimatingWord, setIsAnimatingWord] = useState(false);
  const [centerWordWidth, setCenterWordWidth] = useState(120); // Default width
  const centerWordRef = useRef(null);
  
  // Pre-measure word widths to avoid mixing them up during transitions
  const [wordWidths, setWordWidths] = useState({});
  const [initialWidthsMeasured, setInitialWidthsMeasured] = useState(false);
  const wordMeasureRef = useRef(null);

  // ONLY SIMPLE OPTIMIZATION: For debugging purposes, to track if cycling is happening
  const cycleCountRef = useRef(0);
  
  // Measure all word widths once on first render and when language changes
  useEffect(() => {
    if (wordMeasureRef.current) {
      const widths = {};
      const tempDiv = wordMeasureRef.current;
      const baseStyle = {
        visibility: 'hidden',
        position: 'absolute',
        fontSize: '4rem',
        whiteSpace: 'nowrap',
        padding: '0 10px'
      };
      
      // Apply base style to the measurement div
      Object.assign(tempDiv.style, baseStyle);
      document.body.appendChild(tempDiv);
      
      // Measure each word
      titleWords.forEach((word, index) => {
        tempDiv.textContent = word;
        widths[index] = tempDiv.offsetWidth;
      });
      
      // Clean up
      document.body.removeChild(tempDiv);
      setWordWidths(widths);
      setInitialWidthsMeasured(true);
      
      // Set initial width for the current word
      setCenterWordWidth(widths[currentWordIndex] || 120);
    }
  }, [titleWords, currentWordIndex, i18n.language]);
  
  // Update center word width whenever the word changes
  useEffect(() => {
    if (currentWordIndex !== null && initialWidthsMeasured) {
      const newWidth = wordWidths[currentWordIndex] || 120;
      setCenterWordWidth(newWidth);
    }
  }, [currentWordIndex, initialWidthsMeasured, wordWidths]);

  // SUPER SIMPLE CYCLING FUNCTIONALITY
  useEffect(() => {
    // EXTREMELY SIMPLE WORD CYCLING - NO FANCY ANIMATION
    
    // Create an interval that cycles the words every 2 seconds
    const intervalId = setInterval(() => {
      setCurrentWordIndex(prev => {
        const nextIndex = (prev + 1) % titleWords.length;
        return nextIndex;
      });
    }, 2000);
    
    // Clean up the interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [titleWords]); // Only titleWords as dependency

  // Function to get color for each title word
  const getWordColor = useCallback((index) => {
    const colors = [
      '#E74C3C', // Red - Music
      '#FF5E5B', // Coral - Song
      '#FFD166', // Yellow - Chord
      '#06D6A0', // Green - Pattern
      '#118AB2', // Blue - Progression
      '#9370DB', // Purple - Voicing
      '#3F51B5'  // Indigo - Harmony
    ];
    return colors[index % colors.length];
  }, []);
  
  // Basic state for the current chord
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  
  // State for the positions of the notes
  // We'll use fixed positions to avoid any jumpiness
  const initialPositions = [
    { top: '15%', left: '10%' },
    { top: '25%', right: '12%' },
    { bottom: '15%', left: '15%' }
  ];
  
  // Voice leading state
  const [displayedChord, setDisplayedChord] = useState({
    notes: chordProgression[0].notes,
    positions: initialPositions,
    index: 0
  });
  
  const [previousChord, setPreviousChord] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  
  // Add these state variables for synth functionality
  const [synth, setSynth] = useState(null);
  const [audioContextStarted, setAudioContextStarted] = useState(false);
  const effectsChain = useEffectsChain();
  const synthRef = useRef(null);
  
  // Add animationProgress state variable
  const [animationProgress, setAnimationProgress] = useState(0);
  
  // Create fixed animation offsets for each position - these will persist across chord changes
  const positionAnimationOffsets = useRef([
    1.2, // First position offset
    0.5, // Second position offset 
    2.3  // Third position offset
  ]);
  
  // Add this state to track outer word positions 
  const [outerWordsOffsets, setOuterWordsOffsets] = useState({
    left: 0,
    right: 0
  });
  
  // Measure word widths and update offsets when words change
  useEffect(() => {
    // Get approximate width based on the length of the word
    const newWidth = (currentWord) => Math.max(100, currentWord.length * 22);
    const currentWordWidth = newWidth(titleWords[currentWordIndex]);
    
    // Calculate new offsets
    setOuterWordsOffsets({
      left: -(currentWordWidth/2) - 20, // Add some padding
      right: (currentWordWidth/2) + 20   // Add some padding
    });
    
  }, [currentWordIndex, titleWords]);
  
  // Use the synth in a way consistent with the Try Me section
  useEffect(() => {
    let localSynth = null;
    
    const initializeSynth = async () => {
      if (!effectsChain) return;
      
      try {
        // Initialize audio context if needed
        if (Tone.context.state !== "running") {
          await Tone.start();
          setAudioContextStarted(true);
        }
        
        // Create a new synth using the same approach as Try Me section
        const newSynth = createSynth('polysynth', effectsChain);
        
        // Store in state and ref
        setSynth(newSynth);
        synthRef.current = newSynth;
        localSynth = newSynth;
        
        // Apply the preset using the exact same method as in SynthesizerContainer
        if (newSynth) {
          try {
            const preset = getPresetById('atmospheric');
            console.log(`Applying atmospheric preset to hero section floating notes`);
            
            // Apply synth parameters exactly as in SynthesizerContainer.js
            if (preset.synthParams) {
              Object.entries(preset.synthParams).forEach(([paramKey, paramValue]) => {
                if (typeof paramValue === 'object') {
                  // Handle nested objects like oscillator.type
                  Object.entries(paramValue).forEach(([nestedKey, nestedValue]) => {
                    try {
                      newSynth.set({ [paramKey]: { [nestedKey]: nestedValue } });
                    } catch (paramError) {
                      console.warn(`Error setting nested param ${paramKey}.${nestedKey}:`, paramError);
                    }
                  });
                } else {
                  // Handle direct parameters
                  try {
                    newSynth.set({ [paramKey]: paramValue });
                  } catch (paramError) {
                    console.warn(`Error setting param ${paramKey}:`, paramError);
                  }
                }
              });
            }
            
            // Apply effects using the exact same approach
            if (preset.effects && effectsChain) {
              Object.entries(preset.effects).forEach(([effectType, effectParams]) => {
                const effect = effectsChain.getEffect(effectType);
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
          } catch (error) {
            console.error('Error applying atmospheric preset:', error);
          }
        }
      } catch (error) {
        console.error("Error initializing synth in HeroSection:", error);
      }
    };
    
    initializeSynth();
    
    // Clean up
    return () => {
      if (localSynth) {
        try {
          disposeSynth(localSynth);
        } catch (error) {
          console.error("Error disposing synth:", error);
        }
      }
    };
  }, [effectsChain]);
  
  // Update the playNote function to assign proper octaves
  const playNote = async (noteName) => {
    try {
      // Make sure audio context is started
      if (Tone.context.state !== "running") {
        await Tone.start();
        setAudioContextStarted(true);
      }
      
      // Add octave information to the note if it doesn't have one
      let noteWithOctave = noteName;
      if (!noteName.match(/\d/)) {
        // Default octave is 4 for middle register
        // Adjust octave based on note position in the scale for better spread
        if (['A', 'A#', 'Bb', 'B'].includes(noteName)) {
          noteWithOctave = `${noteName}3`; // Lower octave for A, Bb, B
        } else if (['C', 'C#', 'Db', 'D', 'D#', 'Eb'].includes(noteName)) {
          noteWithOctave = `${noteName}4`; // Middle octave for C through E
        } else {
          noteWithOctave = `${noteName}4`; // Middle octave for F through G#
        }
      }
      
      console.log(`Playing note ${noteWithOctave} with atmospheric preset`);
      
      // Exactly follow the pattern from SynthesizerContainer.js for playing notes
      if (synthRef.current && !synthRef.current._disposed) {
        // Use the proper note with octave for correct pitch
        synthRef.current.triggerAttackRelease(noteWithOctave, "0.5s");
      }
    } catch (error) {
      console.error("Error playing note:", error, noteName);
    }
  };

  // Add a function to play all notes in the current chord
  const playChord = async () => {
    try {
      // Make sure audio context is started
      if (Tone.context.state !== "running") {
        await Tone.start();
        setAudioContextStarted(true);
      }
      
      // Get the current chord's notes
      const currentChord = chordProgression[currentChordIndex];
      console.log(`Playing chord ${currentChord.name}`);
      
      // Play each note in the chord with proper octave assignment
      if (synthRef.current && !synthRef.current._disposed) {
        const notesWithOctaves = currentChord.notes.map(note => {
          // Add octave information to the note if it doesn't have one
          if (!note.match(/\d/)) {
            // Default octave is 4 for middle register
            // Adjust octave based on note position in the scale for better spread
            if (['A', 'A#', 'Bb', 'B'].includes(note)) {
              return `${note}3`; // Lower octave for A, Bb, B
            } else if (['C', 'C#', 'Db', 'D', 'D#', 'Eb'].includes(note)) {
              return `${note}4`; // Middle octave for C through E
            } else {
              return `${note}4`; // Middle octave for F through G#
            }
          }
          return note;
        });
        
        // Add a bass note (root of the chord) 2 octaves lower
        const rootNote = currentChord.notes[0]; // The first note is the root
        let bassNote;
        
        // Determine the correct octave for the bass note (2 octaves lower than normal)
        if (!rootNote.match(/\d/)) {
          if (['A', 'A#', 'Bb', 'B'].includes(rootNote)) {
            bassNote = `${rootNote}1`; // 2 octaves below A3, B3, etc.
          } else {
            bassNote = `${rootNote}2`; // 2 octaves below C4, D4, etc.
          }
        } else {
          // If the note already has an octave number, subtract 2
          const noteWithoutOctave = rootNote.replace(/\d/, '');
          const octave = parseInt(rootNote.match(/\d/)[0]);
          bassNote = `${noteWithoutOctave}${octave - 2}`;
        }
        
        // Add the bass note to the array of notes to play
        const allNotes = [...notesWithOctaves, bassNote];
        console.log(`Playing chord with notes: ${notesWithOctaves.join(', ')} and bass note: ${bassNote}`);
        
        // Play all notes simultaneously
        synthRef.current.triggerAttackRelease(allNotes, "0.8s");
      }
    } catch (error) {
      console.error("Error playing chord:", error);
    }
  };

  // Handle voice leading transitions between chords
  const moveToNextChord = () => {
    // Save the current chord as the previous chord for voice leading
    setPreviousChord({
      notes: [...displayedChord.notes],
      positions: [...displayedChord.positions],
      index: displayedChord.index
    });
    
    // Set transitioning state for animation effects
    setTransitioning(true);
    
    const nextIndex = (currentChordIndex + 1) % chordProgression.length;
    setCurrentChordIndex(nextIndex);
    
    const currentNotes = [...displayedChord.notes];
    const nextNotes = chordProgression[nextIndex].notes;
    
    // Voice leading assignment
    let assignedNextNotes = [...currentNotes];
    const assignedNextChordNotes = new Set();
    
    // First pass: Keep notes that are the same
    currentNotes.forEach((note, i) => {
      if (nextNotes.includes(note)) {
        assignedNextNotes[i] = note;
        assignedNextChordNotes.add(note);
      } else {
        assignedNextNotes[i] = null;
      }
    });
    
    // Second pass: Assign closest notes by semitone distance
    for (let i = 0; i < assignedNextNotes.length; i++) {
      if (assignedNextNotes[i] === null) {
        let bestNote = null;
        let minDistance = Infinity;
        
        for (const note of nextNotes) {
          if (!assignedNextChordNotes.has(note)) {
            const distance = getSemitoneDistance(currentNotes[i], note);
            if (distance < minDistance) {
              minDistance = distance;
              bestNote = note;
            }
          }
        }
        
        if (bestNote) {
          assignedNextNotes[i] = bestNote;
          assignedNextChordNotes.add(bestNote);
        }
      }
    }
    
    // Assign any remaining notes
    const remainingNotes = nextNotes.filter(note => !assignedNextChordNotes.has(note));
    for (let i = 0; i < assignedNextNotes.length; i++) {
      if (assignedNextNotes[i] === null && remainingNotes.length > 0) {
        assignedNextNotes[i] = remainingNotes.pop();
      }
    }
    
    // Update the displayed chord with the new notes but keep positions the same
    setDisplayedChord({
      notes: assignedNextNotes,
      positions: [...displayedChord.positions], // Use same positions to avoid jumping
      index: nextIndex
    });
    
    // Reset transitioning state after animation completes
    setTimeout(() => {
      setTransitioning(false);
    }, 1500); // Match animation duration
  };

  // Change chord every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      moveToNextChord();
    }, 4000);
    
    return () => clearInterval(interval);
  }, [currentChordIndex, displayedChord]);
  
  // Add animation progress tracker in useEffect - add this after the chord transition interval effect
  useEffect(() => {
    if (!transitioning) {
      setAnimationProgress(0);
      return;
    }
    
    let startTime = null;
    const duration = 1500; // 1.5 seconds for the transition
    
    // Animation frame to track progress
    const updateProgress = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress);
      
      if (progress < 1) {
        // Continue animation
        animationFrameId = requestAnimationFrame(updateProgress);
      } else {
        // Animation complete
        setTransitioning(false);
      }
    };
    
    // Start the animation
    let animationFrameId = requestAnimationFrame(updateProgress);
    
    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [transitioning]);
  
  // Add the getCurrentColors function to return the current color for each note
  const getCurrentColors = () => {
    const colors = {};
    
    // If we're transitioning between chords, interpolate colors
    if (transitioning && previousChord) {
      Object.entries(displayedChord.positions).forEach(([note, position]) => {
        // Make sure pitchColors has the note color, otherwise use a default
        if (!pitchColors[note]) {
          colors[note] = '#6C63FF'; // Default purple if note not found
          return;
        }
        
        const prevNote = Object.keys(previousChord.positions).find(
          (prevNote) => previousChord.positions[prevNote].id === position.id
        );
        
        if (prevNote && prevNote !== note && pitchColors[prevNote]) {
          // Interpolate color during transition only if both colors exist
          colors[note] = interpolateColor(
            pitchColors[prevNote],
            pitchColors[note],
            animationProgress
          );
        } else {
          // Use current color if no transition or same note
          colors[note] = pitchColors[note];
        }
      });
    } else {
      // Not transitioning, just use current colors
      Object.keys(displayedChord.positions).forEach(note => {
        colors[note] = pitchColors[note] || '#6C63FF'; // Default if not found
      });
    }
    
    return colors;
  };
  
  // Move handlePlay inside useCallback to fix dependency issue
  const renderContent = useCallback(() => {
    // Get the current word from titleWords array
    const currentWord = titleWords[currentWordIndex];
    
    // Local handlePlay function inside renderContent to avoid dependency issues
    const handlePlay = async () => {
      try {
        await Tone.start();
        setAudioContextStarted(true);
        console.log("Audio context started successfully");
        
        // Play a gentle intro chord to indicate audio is working
        if (synthRef.current) {
          playChord();
        }
      } catch (error) {
        console.error("Error starting audio context:", error);
      }
    };
    
    return (
      <HeroContent>
        {/* Hidden div for measuring text widths */}
        <div 
          ref={wordMeasureRef} 
          style={{ 
            position: 'absolute', 
            visibility: 'hidden', 
            pointerEvents: 'none'
          }}
        />
        
        <HeroTitle 
          style={{ 
            position: 'relative',
            minHeight: '100px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          {/* Title container */}
          <div style={{ position: 'relative', display: 'inline-block', textAlign: 'center' }}>
            {/* Left word - Intelligent */}
            <motion.span
              animate={{ 
                x: -(centerWordWidth/2) - 24,
                opacity: 1
              }}
              transition={{ 
                type: 'tween',
                ease: 'easeInOut',
                duration: 0.5
              }}
              style={{ 
                position: 'absolute',
                right: '50%',
                color: 'white',
                whiteSpace: 'nowrap',
                fontSize: '4rem'
              }}
            >
              {t('hero.titlePartA', 'Intelligent')}
            </motion.span>
            
            {/* Center changing word - using a simpler approach */}
            <div style={{ 
                display: 'inline-block',
                position: 'relative',
                minWidth: '120px',
                padding: '0 10px',
                textAlign: 'center'
              }}
            >
              <AnimatePresence mode="wait">
                <motion.span
                  key={currentWordIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.4,
                    ease: 'easeInOut'
                  }}
                  style={{ 
                    display: 'inline-block',
                    color: getWordColor(currentWordIndex),
                    fontSize: '4rem'
                  }}
                >
                  {currentWord}
                </motion.span>
              </AnimatePresence>
            </div>
            
            {/* Right word - Creation */}
            <motion.span
              animate={{ 
                x: (centerWordWidth/2) + 24,
                opacity: 1
              }}
              transition={{ 
                type: 'tween',
                ease: 'easeInOut',
                duration: 0.5
              }}
              style={{ 
                position: 'absolute',
                left: '50%',
                color: 'white',
                whiteSpace: 'nowrap',
                fontSize: '4rem'
              }}
            >
              {t('hero.titlePartB', 'Creation')}
            </motion.span>
          </div>
        </HeroTitle>
        
        <HeroSubtitle
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          {t('hero.subtitle', 'Welcome to a new era, where chords and melodies work together in synchronicity. With powerful music theory principles built into every feature, your creative vision becomes reality.')} 
        </HeroSubtitle>
        
        <ButtonGroup
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
        >
          <PrimaryButton 
            href="#how-it-works"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('hero.cta', 'Try It Now')}
          </PrimaryButton>
          <SecondaryButton 
            href="#features"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t('common.learnMore', 'Learn More')}
          </SecondaryButton>
        </ButtonGroup>
      </HeroContent>
    );
  }, [titleWords, currentWordIndex, t, audioContextStarted, playChord, synthRef, wordMeasureRef, centerWordWidth]);
  
  // Render the voice leading lines during transitions
  const renderVoiceLeadingLines = () => {
    if (!previousChord || !transitioning) return null;
    
    return previousChord.notes.map((prevNote, index) => {
      const prevPos = previousChord.positions[index];
      const currPos = displayedChord.positions[index];
      
      // Don't show lines if the note didn't change
      if (prevNote === displayedChord.notes[index]) return null;
      
      // Calculate line positions and angles
      // (Calculate positions based on viewport percentage)
      const startX = prevPos.left 
        ? parseInt(prevPos.left.replace('%', '')) * window.innerWidth / 100 + 30 
        : window.innerWidth - parseInt(prevPos.right.replace('%', '')) * window.innerWidth / 100 - 30;
      
      const startY = prevPos.top 
        ? parseInt(prevPos.top.replace('%', '')) * window.innerHeight / 100 + 30 
        : window.innerHeight - parseInt(prevPos.bottom.replace('%', '')) * window.innerHeight / 100 - 30;
      
      const endX = currPos.left 
        ? parseInt(currPos.left.replace('%', '')) * window.innerWidth / 100 + 30 
        : window.innerWidth - parseInt(currPos.right.replace('%', '')) * window.innerWidth / 100 - 30;
      
      const endY = currPos.top 
        ? parseInt(currPos.top.replace('%', '')) * window.innerHeight / 100 + 30 
        : window.innerHeight - parseInt(currPos.bottom.replace('%', '')) * window.innerHeight / 100 - 30;
      
      // Calculate line length and angle
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
      
      // Get the source and target colors
      const sourceColor = pitchColors[prevNote];
      const targetColor = pitchColors[displayedChord.notes[index]];
      
      return (
        <motion.div
          key={`line-${index}-${displayedChord.index}`}
          style={{
            position: 'absolute',
            height: 2,
            top: startY,
            left: startX,
            width: length,
            zIndex: 1,
            transform: `rotate(${angle}deg)`,
            transformOrigin: '0 0',
            background: `linear-gradient(90deg, ${sourceColor}88, ${targetColor}88)`,
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: [0, 0.7, 0], scaleX: [0, 1, 0] }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      );
    });
  };
  
  // Render the floating musical notes
  const renderNotes = () => {
    return displayedChord.notes.map((note, index) => {
      // Get note position from state
      const position = displayedChord.positions[index];
      
      // Calculate shadow position based on note position
      const shadowTop = position.top 
        ? `calc(${position.top} + 65px)` 
        : undefined;
      
      const shadowBottom = position.bottom 
        ? `calc(${position.bottom} - 15px)` 
        : undefined;
        
      const shadowLeft = position.left 
        ? `calc(${position.left} + 10px)` 
        : undefined;
        
      const shadowRight = position.right 
        ? `calc(${position.right} - 10px)` 
        : undefined;
      
      // Define note color based on the note name
      const noteColor = pitchColors[note] || '#6C63FF';
      
      // Define previous note for color transition (no longer needed, but keeping for clarity)
      const prevNote = previousChord ? previousChord.notes[index] : note;
      
      // Use animation offsets tied to position index - these are consistent
      // across chord changes for the same position
      const animationOffset = positionAnimationOffsets.current[index];
      
      // Key based on position index only, not chord index
      // This prevents the components from being unmounted during chord changes
      const positionKey = `position-${index}`;
      
      return (
        <React.Fragment key={positionKey}>
          {/* Note shadow */}
          <motion.div
            key={`shadow-${positionKey}`}
            style={{
              position: 'absolute',
              width: '60px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              filter: 'blur(4px)',
              zIndex: 1,
              top: shadowTop,
              bottom: shadowBottom,
              left: shadowLeft,
              right: shadowRight
            }}
            // Use static values instead of keyframes for smoother transitions
            animate={{
              scale: 1.1, 
              opacity: 0.18
            }}
            transition={{
              scale: { 
                repeatType: "mirror", 
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset // Re-add the position-specific offset
              },
              opacity: { 
                repeatType: "mirror", 
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset // Re-add the position-specific offset
              }
            }}
          />
          
          {/* Note circle */}
          <motion.div
            key={`note-${positionKey}`}
            style={{
              position: 'absolute',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              textShadow: '0px 2px 3px rgba(0,0,0,0.5), 0px 1px 5px rgba(0,0,0,0.5)',
              zIndex: 2,
              cursor: 'pointer',
              ...position
            }}
            title={t('hero.tooltips.playNote', 'Click to play this note')}
            // Keep backgroundColor as the only animated property during transitions
            animate={{ 
              backgroundColor: noteColor,
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2), inset 0 4px 10px rgba(255, 255, 255, 0.3), inset 0 -4px 10px rgba(0, 0, 0, 0.2)',
              y: [0, -15, 0]
            }}
            transition={{ 
              backgroundColor: { 
                duration: 1.5, 
                ease: "easeInOut"
              },
              y: {
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut",
                times: [0, 0.5, 1],
                repeatDelay: 0,
                delay: animationOffset // Re-add the position-specific offset
              }
            }}
            onClick={() => playNote(note)}
            whileHover={{ 
              scale: 1.1,
              transition: { duration: 0.2 }
            }}
            whileTap={{ 
              scale: 0.95,
              boxShadow: '0 5px 10px rgba(0, 0, 0, 0.2), inset 0 4px 10px rgba(255, 255, 255, 0.3), inset 0 -4px 10px rgba(0, 0, 0, 0.2)',
              transition: { duration: 0.1 }
            }}
          >
            {/* Transition between note names */}
            {transitioning && prevNote !== note ? (
              <>
                <motion.span
                  style={{ 
                    position: 'absolute',
                    textShadow: '0px 2px 3px rgba(0,0,0,0.5), 0px 1px 5px rgba(0,0,0,0.5)'
                  }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  {prevNote}
                </motion.span>
                <motion.span
                  style={{
                    textShadow: '0px 2px 3px rgba(0,0,0,0.5), 0px 1px 5px rgba(0,0,0,0.5)'
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  {note}
                </motion.span>
              </>
            ) : (
              note
            )}
            
            {/* Inner highlight effect */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), transparent 70%)',
              opacity: 0.2,
              pointerEvents: 'none'
            }} />
          </motion.div>
        </React.Fragment>
      );
    });
  };
  
  // Render the chord name display
  const renderChordName = () => (
    <AnimatePresence mode="sync">
      <motion.div
        key={`chord-name-${currentChordIndex}`}
        style={{
          position: 'absolute',
          bottom: '5%',
          left: '0',
          right: '0',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '1.2rem',
          background: 'rgba(15, 14, 23, 0.7)',
          padding: '10px',
          borderRadius: '8px',
          maxWidth: '200px',
          margin: '0 auto',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          cursor: 'pointer'
        }}
        title={t('hero.tooltips.playChord', 'Click to play the chord')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ 
          opacity: { duration: 0.7 } 
        }}
        onClick={playChord}
        whileHover={{ 
          scale: 1.05,
          boxShadow: '0 6px 16px rgba(0, 0, 0, 0.3)'
        }}
        whileTap={{ scale: 0.98 }}
      >
        {chordProgression[currentChordIndex].name}
      </motion.div>
    </AnimatePresence>
  );

  return (
    <HeroContainer id="home">
      {renderContent()}
      {renderVoiceLeadingLines()}
      {renderNotes()}
      {renderChordName()}
    </HeroContainer>
  );
};

export default HeroSection;