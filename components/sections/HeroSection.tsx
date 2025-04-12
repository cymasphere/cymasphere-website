"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import * as Tone from "tone";
import { getPresetById } from "@/utils/presets";
import { createSynth, disposeSynth, DisposableSynth } from "@/utils/synthUtils";
import useEffectsChain from "@/hooks/useEffectsChain";
import dynamic from "next/dynamic";

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
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 30% 50%,
        rgba(108, 99, 255, 0.1),
        transparent 50%
      ),
      radial-gradient(
        circle at 70% 30%,
        rgba(78, 205, 196, 0.1),
        transparent 50%
      );
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

const NoteShadow = styled(motion.div)`
  position: absolute;
  width: 60px;
  height: 8px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.2);
  filter: blur(4px);
  z-index: 1;
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
  pointer-events: none;
  filter: blur(4px) drop-shadow(0 0 1px rgba(0, 0, 0, 0.1)); /* Force GPU rendering */
`;

// Color mapping for all 12 chromatic pitches
const pitchColors: Record<string, string> = {
  C: "#F44336", // Red
  "C#": "#E91E63", // Pink
  Db: "#E91E63", // Pink (enharmonic with C#)
  D: "#9C27B0", // Purple
  "D#": "#673AB7", // Deep Purple
  Eb: "#673AB7", // Deep Purple (enharmonic with D#)
  E: "#3F51B5", // Indigo
  F: "#2196F3", // Blue
  "F#": "#03A9F4", // Light Blue
  Gb: "#03A9F4", // Light Blue (enharmonic with F#)
  G: "#009688", // Teal
  "G#": "#4CAF50", // Green
  Ab: "#4CAF50", // Green (enharmonic with G#)
  A: "#8BC34A", // Light Green
  "A#": "#CDDC39", // Lime
  Bb: "#CDDC39", // Lime (enharmonic with A#)
  B: "#FFEB3B", // Yellow
};

// Add a custom hook for window size
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

// Client-only component to ensure proper measurement
const ClientOnlyHeroTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return a simple placeholder during SSR
    return <div style={{ minHeight: "260px" }}></div>;
  }

  return <>{children}</>;
};

// Use dynamic import with ssr: false to completely prevent server-side rendering
const ClientOnly = dynamic(() => Promise.resolve(ClientOnlyHeroTitle), {
  ssr: false,
});

const HeroSection = () => {
  const { t } = useTranslation();

  // Add a flag to track if user has interacted
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  // Add a mute flag to prevent any sound until user interaction
  const isMutedRef = useRef<boolean>(true);
  // Add flag to track if synth has been initialized
  const [synthInitialized, setSynthInitialized] = useState(false);

  // Diatonic chords in the key of C in descending 5ths
  const chordProgression = useMemo(
    () => [
      { name: t("hero.chords.cMajor", "C Major"), notes: ["C", "E", "G"] },
      { name: t("hero.chords.fMajor", "F Major"), notes: ["F", "A", "C"] },
      {
        name: t("hero.chords.bDiminished", "B Diminished"),
        notes: ["B", "D", "F"],
      },
      { name: t("hero.chords.eMinor", "E Minor"), notes: ["E", "G", "B"] },
      { name: t("hero.chords.aMinor", "A Minor"), notes: ["A", "C", "E"] },
      { name: t("hero.chords.dMinor", "D Minor"), notes: ["D", "F", "A"] },
      { name: t("hero.chords.gMajor", "G Major"), notes: ["G", "B", "D"] },
    ],
    [t]
  );

  // Words to cycle through in the hero title - WRAPPED IN USEMEMO TO PREVENT RECREATION
  // const titleWords = useMemo(
  //   () => [
  //     t("hero.titleWords.music", "Music"),
  //     t("hero.titleWords.song", "Song"),
  //     t("hero.titleWords.chord", "Chord"),
  //     t("hero.titleWords.pattern", "Pattern"),
  //     t("hero.titleWords.progression", "Progression"),
  //     t("hero.titleWords.voicing", "Voicing"),
  //     t("hero.titleWords.harmony", "Harmony"),
  //   ],
  //   [t]
  // ); // Only recreate when translation function or language changes
  const titleWords = useMemo(
    () => [
      "Music",
      "Song",
      "Chord",
      "Pattern",
      "Progression",
      "Voicing",
      "Harmony",
    ],
    []
  );
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [centerWordWidth, setCenterWordWidth] = useState(120); // Default width
  const centerWordRef = useRef<HTMLSpanElement>(null);

  // Pre-measure word widths to avoid mixing them up during transitions
  const [wordWidths, setWordWidths] = useState<Record<number, number>>({});
  const wordMeasureRef = useRef<HTMLDivElement>(null);

  // Basic state for the current chord
  const [currentChordIndex, setCurrentChordIndex] = useState(0);

  // Measure all word widths once on first render and when language changes
  useEffect(() => {
    // Skip SSR execution
    if (typeof window === "undefined") return;

    if (wordMeasureRef.current) {
      const widths: Record<number, number> = {};

      const tempDiv = wordMeasureRef.current;
      const baseStyle = {
        visibility: "hidden",
        position: "absolute",
        fontSize: "4rem",
        whiteSpace: "nowrap",
        padding: "0 10px",
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
      console.log("Measured widths:", widths);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // State for the positions of the notes
  // We'll use fixed positions to avoid any jumpiness
  const initialPositions = useMemo(
    () => [
      { top: "15%", left: "10%" },
      { top: "25%", right: "12%" },
      { bottom: "15%", left: "15%" },
    ],
    []
  );

  // Define the chord type for better type safety
  interface ChordType {
    notes: string[];
    positions: {
      top?: string;
      left?: string;
      bottom?: string;
      right?: string;
    }[];
    index: number;
  }

  // Voice leading state
  const [displayedChord, setDisplayedChord] = useState<ChordType>({
    notes: chordProgression[0].notes,
    positions: initialPositions,
    index: 0,
  });

  const [transitioning, setTransitioning] = useState(false);
  const [previousChord, setPreviousChord] = useState<ChordType | null>(null);

  // Define allowed effect types for the effectsChain.getEffect method
  type EffectType =
    | "delay"
    | "reverb"
    | "compressor"
    | "limiter"
    | "chorus"
    | "stereoWidener"
    | "softClipper"
    | "masterVolume";

  const [audioContextStarted, setAudioContextStarted] = useState(false);
  const effectsChain = useEffectsChain();
  const synthRef = useRef<DisposableSynth>(null);

  // Create fixed animation offsets for each position
  const positionAnimationOffsets = useRef([
    { x: 0, y: 0, delay: 0 }, // First position offset - start immediately
    { x: 0, y: 0, delay: 0.8 }, // Second position offset - delay by 0.8s
    { x: 0, y: 0, delay: 1.5 }, // Third position offset - delay by 1.5s
  ]);

  // Add a specific effect to force re-measurement after client-side mounting
  useEffect(() => {
    // This effect will run after the component has mounted on the client side
    if (typeof window !== "undefined" && wordMeasureRef.current) {
      // Force re-measurement by triggering a measurement cycle
      const widths: Record<number, number> = {};

      const tempDiv = wordMeasureRef.current;
      const baseStyle = {
        visibility: "hidden",
        position: "absolute",
        fontSize: "4rem",
        whiteSpace: "nowrap",
        padding: "0 10px",
      };

      Object.assign(tempDiv.style, baseStyle);
      document.body.appendChild(tempDiv);

      titleWords.forEach((word, index) => {
        tempDiv.textContent = word;
        widths[index] = tempDiv.offsetWidth;
      });

      document.body.removeChild(tempDiv);
      setWordWidths(widths);
      console.log("Client-side re-measurement complete:", widths);
    }
  }, [titleWords]);

  // Modify the audio initialization to be completely separate from any auto-play behavior
  const initializeSynthOnDemand = useCallback(async () => {
    if (synthInitialized || !effectsChain) return;
    
    console.log("Initializing synth on demand due to user interaction");
    
    try {
      // Make sure audio context is started - this requires user interaction first
      if (Tone.context.state !== "running") {
        await Tone.start();
        setAudioContextStarted(true);
      }
      
      // Explicitly disable auto-starting behavior in Tone.js
      Tone.Transport.stop();
      Tone.getDestination().volume.value = 0; // Normal volume since we're initializing on demand
      
      // Create a new synth
      const newSynth = createSynth("polysynth", effectsChain);

      // Store in ref
      synthRef.current = newSynth;
      
      // Apply the atmospheric preset
      if (newSynth) {
        try {
          const preset = getPresetById("atmospheric");
          console.log("Applying atmospheric preset to hero section floating notes");

          // Apply synth parameters 
          if (preset.synthParams) {
            Object.entries(preset.synthParams).forEach(
              ([paramKey, paramValue]) => {
                if (typeof paramValue === "object" && paramValue !== null) {
                  // Handle nested objects like oscillator.type
                  Object.entries(
                    paramValue as Record<string, unknown>
                  ).forEach(([nestedKey, nestedValue]) => {
                    try {
                      // Use type assertion
                      const typedSynth = newSynth as unknown as {
                        set: (params: Record<string, unknown>) => void;
                      };
                      typedSynth.set({
                        [paramKey]: { [nestedKey]: nestedValue },
                      });
                    } catch (paramError) {
                      console.warn(
                        `Error setting nested param ${paramKey}.${nestedKey}:`,
                        paramError
                      );
                    }
                  });
                } else {
                  // Handle direct parameters
                  try {
                    // Use type assertion
                    const typedSynth = newSynth as unknown as {
                      set: (params: Record<string, unknown>) => void;
                    };
                    typedSynth.set({ [paramKey]: paramValue });
                  } catch (paramError) {
                    console.warn(
                      `Error setting param ${paramKey}:`,
                      paramError
                    );
                  }
                }
              }
            );
          }

          // Apply effects
          if (preset.effects && effectsChain) {
            Object.entries(preset.effects).forEach(
              ([effectType, effectParams]) => {
                // Type assertion for effect type
                const effect = effectsChain.getEffect(
                  effectType as EffectType
                );
                if (effect) {
                  Object.entries(
                    effectParams as Record<string, unknown>
                  ).forEach(([paramKey, paramValue]) => {
                    try {
                      effect.set({ [paramKey]: paramValue });
                    } catch (effectError) {
                      console.warn(
                        `Error setting effect param ${effectType}.${paramKey}:`,
                        effectError
                      );
                    }
                  });
                }
              }
            );
          }
        } catch (error) {
          console.error("Error applying atmospheric preset:", error);
        }
      }
      
      // Mark synth as initialized
      setSynthInitialized(true);
      
    } catch (error) {
      console.error("Error initializing synth in HeroSection:", error);
    }
  }, [synthInitialized, effectsChain]);

  // Handle cleanup only
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        try {
          disposeSynth(synthRef.current);
        } catch (error) {
          console.error("Error disposing synth:", error);
        }
      }
    };
  }, []);

  // Function to play chord (only when user clicks)
  const playChord = useCallback(async () => {
    try {
      // Set the user interaction flag to true and unmute
      setUserHasInteracted(true);
      isMutedRef.current = false;
      
      // Initialize synth on demand if not already done
      if (!synthInitialized) {
        await initializeSynthOnDemand();
      }
      
      // Only continue if we're not muted
      if (isMutedRef.current) {
        return; // Exit if muted
      }

      // Get the current chord's notes
      const currentChord = chordProgression[currentChordIndex];
      console.log(`Playing chord ${currentChord.name}`);

      // Play each note in the chord with proper octave assignment
      if (synthRef.current) {
        // Check for _disposed property to avoid playing disposed synths
        const synth = synthRef.current as unknown as {
          _disposed?: boolean;
          triggerAttackRelease: (
            notes: string | string[],
            duration: string
          ) => void;
        };
        if (!synth._disposed) {
          const notesWithOctaves = currentChord.notes.map((note: string) => {
            // Add octave information to the note if it doesn't have one
            if (!note.match(/\d/)) {
              // Default octave is 4 for middle register
              // Adjust octave based on note position in the scale for better spread
              if (["A", "A#", "Bb", "B"].includes(note)) {
                return `${note}3`; // Lower octave for A, Bb, B
              } else if (["C", "C#", "Db", "D", "D#", "Eb"].includes(note)) {
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
            if (["A", "A#", "Bb", "B"].includes(rootNote)) {
              bassNote = `${rootNote}1`; // 2 octaves below A3, B3, etc.
            } else {
              bassNote = `${rootNote}2`; // 2 octaves below C4, D4, etc.
            }
          } else {
            // If the note already has an octave number, subtract 2
            const noteWithoutOctave = rootNote.replace(/\d/, "");
            const matchResult = rootNote.match(/\d/);
            if (matchResult) {
              const octave = parseInt(matchResult[0]);
              bassNote = `${noteWithoutOctave}${octave - 2}`;
            } else {
              bassNote = `${noteWithoutOctave}2`; // Fallback if no match
            }
          }

          // Add the bass note to the array of notes to play
          const allNotes = [...notesWithOctaves, bassNote];
          console.log(
            `Playing chord with notes: ${notesWithOctaves.join(
              ", "
            )} and bass note: ${bassNote}`
          );

          // Play all notes simultaneously
          synth.triggerAttackRelease(allNotes, "0.8s");
        }
      }
    } catch (error) {
      console.error("Error playing chord:", error);
    }
  }, [chordProgression, currentChordIndex, synthInitialized, initializeSynthOnDemand]);

  // Function to move to the next chord
  const moveToNextChord = useCallback(() => {
    // Don't change chord during transition
    if (transitioning) return;
    
    setTransitioning(true);
    setPreviousChord(displayedChord);
    
    // Get next chord
    const nextChordIndex = (currentChordIndex + 1) % chordProgression.length;
    const nextChord = {
      notes: chordProgression[nextChordIndex].notes,
      positions: displayedChord.positions,
      index: nextChordIndex,
      id: `chord-${nextChordIndex}-${Date.now()}`, // Add unique ID for animation
    };
    
    // Update displayed chord (triggers animation)
    setDisplayedChord(nextChord);
    
    // Set current chord index to next chord
    setCurrentChordIndex(nextChordIndex);
    
    // After animation completes, reset transition state
    setTimeout(() => {
      setTransitioning(false);
    }, 500); // Match this to your transition duration in CSS

    // IMPORTANT: We don't call playChord() here, so the chord change is visual only
  }, [transitioning, displayedChord, currentChordIndex, chordProgression]);
  
  // Set up a useEffect to change words every 4 seconds
  useEffect(() => {
    const wordInterval = setInterval(() => {
      setCurrentWordIndex((prevIndex) => (prevIndex + 1) % titleWords.length);
      // Update centerWordWidth based on the next word
      if (centerWordRef.current) {
        const nextWordIndex = (currentWordIndex + 1) % titleWords.length;
        setCenterWordWidth(centerWordRef.current.offsetWidth);
      }
      // Change chord when word changes
      moveToNextChord();
    }, 4000);
  
    return () => clearInterval(wordInterval);
  }, [currentWordIndex, titleWords, moveToNextChord, centerWordRef]);

  // Update center word width when it changes
  useEffect(() => {
    if (centerWordRef.current) {
      setCenterWordWidth(centerWordRef.current.offsetWidth);
    }
  }, [currentWordIndex, centerWordRef]);

  // Get a color for each word
  const getWordColor = useCallback(
    (index: number) => {
      const colorMap: Record<number, string> = {
        0: "#FF7A5C", // Coral for Music
        1: "#FFD166", // Yellow for Song
        2: "#06D6A0", // Green for Chord
        3: "#118AB2", // Blue for Pattern
        4: "#073B4C", // Dark Blue for Progression
        5: "#7209B7", // Purple for Voicing
        6: "#F72585", // Pink for Harmony
      };

      // Return the color for the index, or a default color if not found
      return colorMap[index % titleWords.length] || "#06D6A0";
    },
    [titleWords.length]
  );

  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth <= 768;

  // Create renderContent function
  const renderContent = useCallback((): React.ReactNode => {
    // Get the current word from titleWords array
    const currentWord = titleWords[currentWordIndex];

    return (
      <HeroContent>
        {/* Hidden div for measuring text widths */}
        <div
          ref={wordMeasureRef}
          style={{
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
          }}
        />

        <ClientOnly>
          <HeroTitle
            style={{
              position: "relative",
              minHeight: isMobile ? "260px" : "100px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Title container */}
            <div
              style={{
                position: "relative",
                display: "inline-block",
                textAlign: "center",
                width: "100%",
              }}
              className="title-container"
            >
              {/* Left word - Intelligent */}
              <motion.span
                animate={{
                  x: !isMobile ? -(centerWordWidth / 2) - 24 : 0,
                  opacity: 1,
                }}
                transition={{
                  type: "tween",
                  ease: "easeInOut",
                  duration: 0.5,
                }}
                style={{
                  position: !isMobile ? "absolute" : "relative",
                  right: !isMobile ? "50%" : "auto",
                  color: "white",
                  whiteSpace: "nowrap",
                  fontSize: !isMobile ? "4rem" : "3rem",
                  display: !isMobile ? "inline-block" : "block",
                  textAlign: !isMobile ? "right" : "center",
                  marginBottom: !isMobile ? "0" : "1.5rem",
                  lineHeight: isMobile ? "1.2" : "inherit",
                  fontWeight: "bold",
                }}
              >
                {t("hero.titlePartA", "Intelligent")}
              </motion.span>

              {/* Center changing word - using a simpler approach */}
              <div
                style={{
                  display: "inline-block",
                  position: !isMobile ? "relative" : "static",
                  minWidth: "120px",
                  padding: "0 10px",
                  textAlign: "center",
                  marginBottom: !isMobile ? "0" : "1.5rem",
                  width: !isMobile ? "auto" : "100%",
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
                      ease: "easeInOut",
                    }}
                    style={{
                      display: "inline-block",
                      color: getWordColor(currentWordIndex),
                      fontSize: !isMobile ? "4rem" : "3rem",
                      lineHeight: isMobile ? "1.2" : "inherit",
                      fontWeight: "bold",
                    }}
                    ref={centerWordRef}
                  >
                    {currentWord}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Right word - Creation */}
              <motion.span
                animate={{
                  x: !isMobile ? centerWordWidth / 2 + 24 : 0,
                  opacity: 1,
                }}
                transition={{
                  type: "tween",
                  ease: "easeInOut",
                  duration: 0.5,
                }}
                style={{
                  position: !isMobile ? "absolute" : "relative",
                  left: !isMobile ? "50%" : "auto",
                  color: "white",
                  whiteSpace: "nowrap",
                  fontSize: !isMobile ? "4rem" : "3rem",
                  display: !isMobile ? "inline-block" : "block",
                  textAlign: !isMobile ? "left" : "center",
                  lineHeight: isMobile ? "1.2" : "inherit",
                  fontWeight: "bold",
                }}
              >
                {t("hero.titlePartB", "Creation")}
              </motion.span>
            </div>
          </HeroTitle>
        </ClientOnly>

        <HeroSubtitle
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          Enter the next evolution of music creation, where theoretical
          foundations invisibly guide your workflow. Chords and melodies connect
          with purpose, empowering your unique musical vision.
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
            {t("hero.cta", "Try It Now")}
          </PrimaryButton>
          <SecondaryButton
            href="#features"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t("common.learnMore", "Learn More")}
          </SecondaryButton>
        </ButtonGroup>
      </HeroContent>
    );
  }, [
    centerWordRef,
    centerWordWidth,
    titleWords,
    currentWordIndex,
    getWordColor,
    displayedChord,
    previousChord,
    transitioning,
    moveToNextChord
  ]);

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
        ? (parseInt(prevPos.left.replace("%", "")) * windowWidth) / 100 + 30
        : windowWidth -
          (parseInt((prevPos.right || "0").replace("%", "")) * windowWidth) /
            100 -
          30;

      const startY = prevPos.top
        ? (parseInt(prevPos.top.replace("%", "")) * windowHeight) / 100 + 30
        : windowHeight -
          (parseInt((prevPos.bottom || "0").replace("%", "")) * windowHeight) /
            100 -
          30;

      const endX = currPos.left
        ? (parseInt(currPos.left.replace("%", "")) * windowWidth) / 100 + 30
        : windowWidth -
          (parseInt((currPos.right || "0").replace("%", "")) * windowWidth) /
            100 -
          30;

      const endY = currPos.top
        ? (parseInt(currPos.top.replace("%", "")) * windowHeight) / 100 + 30
        : windowHeight -
          (parseInt((currPos.bottom || "0").replace("%", "")) * windowHeight) /
            100 -
          30;

      // Calculate line length and angle
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;

      // Get the source and target colors
      const sourceColor = pitchColors[prevNote] || "#6C63FF";
      const targetColor = pitchColors[displayedChord.notes[index]] || "#6C63FF";

      return (
        <motion.div
          key={`line-${index}-${displayedChord.index}`}
          style={{
            position: "absolute",
            height: 2,
            top: startY,
            left: startX,
            width: length,
            zIndex: 1,
            transform: `rotate(${angle}deg)`,
            transformOrigin: "0 0",
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
      let position = { ...displayedChord.positions[index] };

      // Adjust position for mobile - move the right ball (index 1) lower on mobile
      if (isMobile && index === 1) {
        position = {
          top: "40%", // Split the difference between 35% and 45%
          right: "10%", // Position it more to the right edge
        };

        // If we're transitioning to mobile from desktop, don't use previous position for voice leading
        if (transitioning && previousChord) {
          // Make sure we don't have weird voice leading lines by adjusting the previous position
          previousChord.positions[index] = { ...position };
        }
      }

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
      const noteColor = pitchColors[note] || "#6C63FF";

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
          <NoteShadow
            key={`shadow-${positionKey}`}
            style={{
              position: "absolute",
              width: "60px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              filter: "blur(4px)",
              zIndex: 1,
              top: shadowTop,
              bottom: shadowBottom,
              left: shadowLeft,
              right: shadowRight,
            }}
            animate={{
              scale: [0.9, 1, 0.9],
              opacity: [0.3, 0.4, 0.3],
            }}
            transition={{
              scale: {
                repeatType: "mirror",
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset.delay, // Re-add the position-specific offset
              },
              opacity: {
                repeatType: "mirror",
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset.delay, // Re-add the position-specific offset
              },
            }}
          />

          {/* Note circle */}
          <motion.div
            key={`note-${positionKey}`}
            style={{
              position: "absolute",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              backgroundColor: noteColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: "1.5rem",
              textShadow:
                "0px 2px 3px rgba(0,0,0,0.5), 0px 1px 5px rgba(0,0,0,0.5)",
              zIndex: 2,
              cursor: "pointer",
              boxShadow:
                "0 10px 20px rgba(0, 0, 0, 0.2), inset 0 4px 10px rgba(255, 255, 255, 0.3), inset 0 -4px 10px rgba(0, 0, 0, 0.2)",
              ...position,
            }}
            title={t("hero.tooltips.playNote", "Click to play this note")}
            // Keep backgroundColor as an animated property during transitions
            animate={{
              backgroundColor: noteColor,
              y: [0, -15, 0],
              scale: [1, 1.05, 1],
            }}
            transition={{
              backgroundColor: {
                duration: 1.5,
                ease: "easeInOut",
              },
              y: {
                repeatType: "mirror",
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset.delay,
              },
              scale: {
                repeatType: "mirror",
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset.delay,
              },
            }}
            onClick={() => playNote(note)}
            whileHover={{
              scale: 1.1,
              transition: { duration: 0.2 },
            }}
            whileTap={{
              scale: 0.95,
              boxShadow:
                "0 5px 10px rgba(0, 0, 0, 0.2), inset 0 4px 10px rgba(255, 255, 255, 0.3), inset 0 -4px 10px rgba(0, 0, 0, 0.2)",
              transition: { duration: 0.1 },
            }}
          >
            {/* Transition between note names */}
            {transitioning && prevNote !== note ? (
              <>
                <motion.span
                  style={{
                    position: "absolute",
                    textShadow:
                      "0px 2px 3px rgba(0,0,0,0.5), 0px 1px 5px rgba(0,0,0,0.5)",
                  }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                >
                  {prevNote}
                </motion.span>
                <motion.span
                  style={{
                    textShadow:
                      "0px 2px 3px rgba(0,0,0,0.5), 0px 1px 5px rgba(0,0,0,0.5)",
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
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), transparent 70%)",
                opacity: 0.2,
                pointerEvents: "none",
              }}
            />
          </motion.div>
        </React.Fragment>
      );
    });
  };

  // Render the chord name display - update to just call playChord directly when clicked
  const renderChordName = () => (
    <AnimatePresence mode="sync">
      <motion.div
        key={`chord-name-${currentChordIndex}`}
        style={{
          position: "absolute",
          bottom: "5%",
          left: "0",
          right: "0",
          textAlign: "center",
          color: "var(--text-secondary)",
          fontSize: "1.2rem",
          background: "rgba(15, 14, 23, 0.7)",
          padding: "10px",
          borderRadius: "8px",
          maxWidth: "200px",
          margin: "0 auto",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
          cursor: "pointer",
        }}
        title={t("hero.tooltips.playChord", "Click to play the chord")}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{
          opacity: { duration: 0.7 },
        }}
        onClick={playChord}
        whileHover={{
          scale: 1.05,
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
        }}
        whileTap={{ scale: 0.98 }}
      >
        {chordProgression[currentChordIndex].name}
      </motion.div>
    </AnimatePresence>
  );

  // Effect for transitioning between chords
  useEffect(() => {
    if (!previousChord || !displayedChord) return;

    // Reduce the transition animation strength to make it less jumpy
    if (transitioning) {
      setTransitioning(true);

      // Use a smoother transition with a gentler curve
      const transitionTimer = setTimeout(() => {
        setTransitioning(false);
      }, 1200); // Slightly longer transition time

      return () => {
        clearTimeout(transitionTimer);
      };
    }
  }, [displayedChord, previousChord, transitioning]);

  // Generate predictable position offsets for animations, but make them smaller
  useEffect(() => {
    if (!positionAnimationOffsets.current.length) {
      // Generate very subtle offsets based on position index
      positionAnimationOffsets.current = [
        { x: 0, y: 0, delay: 0 }, // First note - starts immediately
        { x: 0, y: 0, delay: 0.9 }, // Second note - offset by 0.9s
        { x: 0, y: 0, delay: 1.7 }, // Third note - offset by 1.7s
      ];
    }
  }, []);

  // Modify the playNote function to play sound only when clicked
  const playNote = useCallback(async (noteName: string): Promise<void> => {
    try {
      // Set the user interaction flag to true and unmute
      setUserHasInteracted(true);
      isMutedRef.current = false;
      
      // Initialize synth on demand if not already done
      if (!synthInitialized) {
        await initializeSynthOnDemand();
      }
      
      // Only continue if we're not muted
      if (isMutedRef.current) {
        return; // Exit if muted
      }

      // Add octave information to the note if it doesn't have one
      let noteWithOctave = noteName;
      if (!noteName.match(/\d/)) {
        // Default octave is 4 for middle register
        // Adjust octave based on note position in the scale for better spread
        if (["A", "A#", "Bb", "B"].includes(noteName)) {
          noteWithOctave = `${noteName}3`; // Lower octave for A, Bb, B
        } else if (["C", "C#", "Db", "D", "D#", "Eb"].includes(noteName)) {
          noteWithOctave = `${noteName}4`; // Middle octave for C through E
        } else {
          noteWithOctave = `${noteName}4`; // Middle octave for F through G#
        }
      }

      console.log(`Playing note ${noteWithOctave} with atmospheric preset`);

      // Play note only if synth is ready and not disposed
      if (synthRef.current) {
        // Check for _disposed property to avoid playing disposed synths
        const synth = synthRef.current as unknown as {
          _disposed?: boolean;
          triggerAttackRelease: (
            notes: string | string[],
            duration: string
          ) => void;
        };
        if (!synth._disposed) {
          // Use the proper note with octave for correct pitch
          synth.triggerAttackRelease(noteWithOctave, "0.5s");
        }
      }
    } catch (error) {
      console.error("Error playing note:", error, noteName);
    }
  }, [synthInitialized, initializeSynthOnDemand]);

  return (
    <HeroContainer id="home">
      {/* Remove the mute/unmute toggle button */}
      
      {renderContent()}
      {renderNotes()}
      {renderVoiceLeadingLines()}
      {renderChordName()}
    </HeroContainer>
  );
};

export default HeroSection;
