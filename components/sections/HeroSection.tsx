/**
 * @fileoverview HeroSection Component
 * @module components/sections/HeroSection
 * 
 * Main hero section component for the landing page. Features animated title with
 * cycling words, floating musical notes with voice-leading animations, chord
 * progression playback, and background video. Includes interactive elements for
 * playing notes and chords.
 * 
 * @example
 * // Basic usage
 * <HeroSection />
 */

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useTranslation } from "react-i18next";
import styled, { keyframes } from "styled-components";
import { FaApple, FaWindows, FaTabletAlt, FaPlug } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import * as Tone from "tone";
import { getPresetById } from "@/utils/presets";
import { createSynth, disposeSynth, DisposableSynth } from "@/utils/synthUtils";
import useEffectsChain from "@/hooks/useEffectsChain";
import dynamic from "next/dynamic";
import Image from "next/image";

/**
 * @brief CDN base for feature/product WebP assets (matches FeaturesSection).
 * @note Uses NEXT_PUBLIC_SUPABASE_URL when set so previews track the linked project.
 */
const HERO_PRODUCT_IMAGE_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://jibirpbauzqhdiwjlrmf.supabase.co"}/storage/v1/object/public/feature-images/optimized`;

/**
 * @brief Hero bundle: Cymasphere square (NNAudio catalog art, synced to this Supabase) + CymaSynth packshot.
 * @note Run `npm run sync:cymasynth-assets` to refresh `cymasphere-square` from NNAudio.
 */
const HERO_PRODUCT_IMAGES = {
  cymasphere: `${HERO_PRODUCT_IMAGE_BASE}/cymasphere-square.webp`,
  cymaSynth: `${HERO_PRODUCT_IMAGE_BASE}/cymasynth-product.webp`,
} as const;

/** @brief Slow drift + hue shift for iridescent hero overlay (oil-slick / prism feel). */
const heroIridescentDrift = keyframes`
  0% {
    background-position: 0% 45%, 50% 50%;
    filter: hue-rotate(-12deg) saturate(1.05);
  }
  50% {
    background-position: 100% 55%, 50% 50%;
    filter: hue-rotate(18deg) saturate(1.12);
  }
  100% {
    background-position: 0% 45%, 50% 50%;
    filter: hue-rotate(-12deg) saturate(1.05);
  }
`;

const HeroContainer = styled.section`
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 88px 20px 44px;
  position: relative;
  overflow: hidden;
  background-color: var(--background);
  isolation: isolate;

  /** Soft color wash: airy, not a heavy black scrim */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    background:
      radial-gradient(
        ellipse 85% 65% at 18% 25%,
        rgba(147, 197, 253, 0.45),
        transparent 58%
      ),
      radial-gradient(
        ellipse 75% 55% at 88% 18%,
        rgba(196, 181, 253, 0.4),
        transparent 55%
      ),
      radial-gradient(
        ellipse 70% 80% at 48% 95%,
        rgba(45, 212, 191, 0.28),
        transparent 60%
      ),
      radial-gradient(
        ellipse 55% 45% at 72% 48%,
        rgba(244, 114, 182, 0.22),
        transparent 50%
      ),
      linear-gradient(
        160deg,
        rgba(15, 23, 42, 0.12) 0%,
        rgba(30, 27, 60, 0.06) 42%,
        rgba(15, 23, 42, 0.1) 100%
      );
    mix-blend-mode: soft-light;
  }

  /** Animated iridescent sheen (large gradient moves; hue-rotate adds prism shift) */
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
    opacity: 0.82;
    background: linear-gradient(
        125deg,
        rgba(99, 102, 241, 0.22) 0%,
        rgba(34, 211, 238, 0.2) 22%,
        rgba(192, 132, 252, 0.26) 45%,
        rgba(52, 211, 153, 0.16) 68%,
        rgba(244, 114, 182, 0.2) 88%,
        rgba(129, 140, 248, 0.22) 100%
      ),
      radial-gradient(
        ellipse 90% 70% at 50% 50%,
        rgba(255, 255, 255, 0.08) 0%,
        transparent 55%
      );
    background-size: 260% 260%, 100% 100%;
    background-position: 0% 45%, 50% 50%;
    mix-blend-mode: overlay;
    animation: ${heroIridescentDrift} 24s ease-in-out infinite;
  }
`;

const BackgroundVideo = styled.video<{ $loaded?: boolean }>`
  position: absolute;
  top: 60px;
  left: 0;
  width: 100%;
  height: calc(100% - 60px);
  opacity: ${(props) => (props.$loaded ? 0.28 : 0)};
  z-index: 0;
  pointer-events: none;
  object-fit: contain;
  transition: opacity 1.5s ease-in-out;
  will-change: opacity;
  contain: layout style paint;
`;

const HeroContent = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HeroTitle = styled(motion.h1)`
  font-size: 3.5rem;
  margin-bottom: 0.85rem;
  text-align: center;
  line-height: 1.08;

  @media (max-width: 768px) {
    font-size: 2.65rem;
    margin-bottom: 0.65rem;
  }
`;

const HeroSubtitle = styled(motion.p)`
  font-size: 1.1rem;
  line-height: 1.45;
  color: var(--text-secondary);
  margin-bottom: 0.55rem;
  max-width: 900px;
  text-align: center;
`;

/**
 * @brief Wraps the two-product bundle lockup (Cymasphere + CymaSynth).
 */
const HeroBundleLockup = styled(motion.div)`
  width: 100%;
  max-width: 860px;
  margin: 0 auto 0.85rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const HeroBundleEyebrow = styled.span`
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-secondary);
  margin-bottom: 0.45rem;
  opacity: 0.95;
`;

const HeroProductPair = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: stretch;
  gap: 0.45rem 0.45rem;
  width: 100%;
  max-width: 620px;
  margin: 0 auto;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    justify-items: center;
    max-width: min(280px, 100%);
    gap: 0.55rem;
  }
`;

interface HeroProductChipProps {
  $variant: "cymasphere" | "cymaSynth";
}

const HeroProductChip = styled.div<HeroProductChipProps>`
  width: 100%;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  border-radius: 14px;
  text-align: left;
  border: 1px solid
    ${(p) =>
      p.$variant === "cymasphere"
        ? "rgba(108, 99, 255, 0.45)"
        : "rgba(78, 205, 196, 0.45)"};
  background: ${(p) =>
    p.$variant === "cymasphere"
      ? "linear-gradient(145deg, rgba(108, 99, 255, 0.14), rgba(108, 99, 255, 0.04))"
      : "linear-gradient(145deg, rgba(78, 205, 196, 0.12), rgba(78, 205, 196, 0.03))"};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  transition: transform 0.28s ease, box-shadow 0.28s ease,
    border-color 0.28s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 44px rgba(0, 0, 0, 0.28);
    border-color: ${(p) =>
      p.$variant === "cymasphere"
        ? "rgba(108, 99, 255, 0.65)"
        : "rgba(78, 205, 196, 0.6)"};
  }

  @media (max-width: 680px) {
    text-align: center;
  }
`;

/**
 * @brief Identical square media area for both products so cards share width, height, and baseline.
 */
const HeroProductImageFrame = styled.div`
  position: relative;
  box-sizing: border-box;
  flex: 0 0 auto;
  width: 100%;
  aspect-ratio: 1 / 1;
  margin: 0;
  background: linear-gradient(
    165deg,
    rgba(12, 11, 22, 0.98) 0%,
    rgba(22, 20, 38, 0.95) 45%,
    rgba(8, 8, 14, 1) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
`;

const HeroProductTextBlock = styled.div`
  flex: 0 0 auto;
  width: 100%;
  box-sizing: border-box;
  padding: 0.55rem 0.75rem 0.65rem;
  min-height: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;

  @media (max-width: 520px) {
    padding: 0.5rem 0.65rem 0.6rem;
    min-height: 3.85rem;
  }
`;

const HeroProductName = styled.span`
  display: block;
  font-size: 1.15rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
  line-height: 1.2;
  margin-bottom: 0.25rem;
`;

const HeroProductDesc = styled.span`
  display: block;
  font-size: 0.82rem;
  font-weight: 500;
  color: var(--text-secondary);
  line-height: 1.35;
`;

const HeroBundlePlus = styled.span`
  flex: 0 0 auto;
  align-self: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  box-shadow: 0 4px 16px rgba(108, 99, 255, 0.35);
  line-height: 1;
`;

const HeroBundleFootnote = styled.span`
  display: block;
  margin-top: 0.45rem;
  font-size: 0.76rem;
  font-weight: 500;
  color: var(--text-secondary);
  max-width: 520px;
  line-height: 1.4;
`;

const ButtonGroup = styled(motion.div)`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.45rem;
  margin-bottom: 0.65rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const PrimaryButton = styled(motion.a)`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  padding: 10px 28px;
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
  padding: 10px 28px;
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

const PlatformAvailability = styled(motion.div)`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: 1rem;
  padding: 0.35rem 0;

  @media (max-width: 768px) {
    gap: 0.55rem;
    margin-bottom: 0.85rem;
    padding: 0.25rem 0;
  }
`;

const PlatformBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(108, 99, 255, 0.1);
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;

  svg {
    color: var(--primary);
    font-size: 1.1rem;
  }

  &:hover {
    background: rgba(108, 99, 255, 0.15);
    border-color: rgba(108, 99, 255, 0.5);
    color: var(--text);
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.75rem;
    font-size: 0.85rem;

    svg {
      font-size: 1rem;
    }
  }
`;

const FormatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: rgba(78, 205, 196, 0.1);
  border: 1px solid rgba(78, 205, 196, 0.3);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.5px;

  svg {
    color: var(--accent);
    font-size: 1rem;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;

    svg {
      font-size: 0.9rem;
    }
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
    return <div style={{ minHeight: "200px" }}></div>;
  }

  return <>{children}</>;
};

// Use dynamic import with ssr: false to completely prevent server-side rendering
const ClientOnly = dynamic(() => Promise.resolve(ClientOnlyHeroTitle), {
  ssr: false,
});

/**
 * @brief HeroSection component
 * 
 * Main landing page hero section with:
 * - Animated title with cycling words (Music, Song, Chord, etc.)
 * - Floating musical notes that transition between chords using voice-leading
 * - Interactive note and chord playback
 * - Background video with fade-in effect
 * - Call-to-action buttons
 * 
 * @returns {JSX.Element} The rendered hero section component
 * 
 * @note Uses Tone.js for audio synthesis and playback
 * @note Applies "atmospheric" preset to synth for ambient sound
 * @note Chord progression cycles every 4 seconds
 * @note Title words cycle every 2 seconds
 * @note Notes use voice-leading principles for smooth transitions
 * @note Synth initialization is deferred to avoid blocking FCP
 * @note Video background fades in when loaded
 * @note Supports mobile-responsive layout
 */
const HeroSection = () => {
  const { t } = useTranslation();

  // Diatonic chords in the key of C in descending 5ths
  const chordProgression = useMemo(
    () => [
      { name: "C Major", notes: ["C", "E", "G"] },
      { name: "F Major", notes: ["F", "A", "C"] },
      { name: "B Diminished", notes: ["B", "D", "F"] },
      { name: "E Minor", notes: ["E", "G", "B"] },
      { name: "A Minor", notes: ["A", "C", "E"] },
      { name: "D Minor", notes: ["D", "F", "A"] },
      { name: "G Major", notes: ["G", "B", "D"] },
    ],
    []
  );

  // Words to cycle through in the hero title - WRAPPED IN USEMEMO TO PREVENT RECREATION
  const titleWords = useMemo(
    () => [
      t("hero.titleWords.music", "Music"),
      t("hero.titleWords.song", "Song"),
      t("hero.titleWords.chord", "Chord"),
      t("hero.titleWords.pattern", "Pattern"),
      t("hero.titleWords.progression", "Progression"),
      t("hero.titleWords.voicing", "Voicing"),
      t("hero.titleWords.harmony", "Harmony"),
    ],
    [t]
  ); // Only recreate when translation function or language changes
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [centerWordWidth, setCenterWordWidth] = useState(120); // Default width
  const centerWordRef = useRef<HTMLSpanElement>(null);

  // Pre-measure word widths to avoid mixing them up during transitions
  const [wordWidths, setWordWidths] = useState<Record<number, number>>({});
  const wordMeasureRef = useRef<HTMLDivElement>(null);

  // Use windowSize hook to get both width and height
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isMobile = windowWidth <= 768;

  // Measure all word widths once on first render and when language changes
  // Defer this to avoid blocking FCP
  useEffect(() => {
    // Skip SSR execution
    if (typeof window === "undefined") return;

    // Use a longer timeout to ensure DOM is fully rendered and FCP is done
    const timeoutId = setTimeout(() => {
      if (wordMeasureRef.current) {
        const widths: Record<number, number> = {};

        const tempDiv = wordMeasureRef.current;
        const baseStyle = {
          visibility: "hidden",
          position: "absolute",
          fontSize: !isMobile ? "3.5rem" : "2.65rem", // Match HeroTitle font sizes
          whiteSpace: "nowrap",
          padding: "0 10px",
          fontWeight: "bold", // Match the actual font weight
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
        
        // Also update the current center word width
        setCenterWordWidth(widths[currentWordIndex] || 120);
      }
    }, 800); // Increased timeout to 800ms to ensure FCP is complete before measurement
    
    return () => clearTimeout(timeoutId);
  }, [titleWords, isMobile]);

  // Update center word width whenever the currentWordIndex changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // If we have measured widths, use them
    if (wordWidths && Object.keys(wordWidths).length > 0) {
      const newWidth = wordWidths[currentWordIndex] || 120;
      setCenterWordWidth(newWidth);
    }
    // Also update from the DOM if possible (as a fallback)
    else if (centerWordRef.current) {
      setCenterWordWidth(centerWordRef.current.offsetWidth);
    }
  }, [currentWordIndex, wordWidths, titleWords]);

  // ROBUST WORD CYCLING IMPLEMENTATION
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Create an interval that cycles the words every 2 seconds
    const intervalId = setInterval(() => {
      // Use function form of state update to ensure we're using the latest state
      setCurrentWordIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % titleWords.length;
        // console.log(
        //   `Cycling word from ${prevIndex} (${titleWords[prevIndex]}) to ${nextIndex} (${titleWords[nextIndex]})`
        // );
        return nextIndex;
      });
    }, 2000);

    // Clean up the interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [titleWords.length]); // Only depend on the length of titleWords, not the array itself

  // Function to get color for each title word
  const getWordColor = useCallback((index: number): string => {
    const colors = [
      "#E74C3C", // Red - Music
      "#FF5E5B", // Coral - Song
      "#FFD166", // Yellow - Chord
      "#06D6A0", // Green - Pattern
      "#118AB2", // Blue - Progression
      "#9370DB", // Purple - Voicing
      "#3F51B5", // Indigo - Harmony
    ];
    return colors[index % colors.length];
  }, []);

  // Basic state for the current chord
  const [currentChordIndex, setCurrentChordIndex] = useState(0);

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
    positions: typeof initialPositions;
    index: number;
  }

  // Voice leading state - initialize with a unique key to ensure proper rerenders
  const [displayedChord, setDisplayedChord] = useState<ChordType>({
    notes: chordProgression[0].notes,
    positions: initialPositions,
    index: 0,
  });

  const [previousChord, setPreviousChord] = useState<ChordType | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  // Add a guard flag to prevent overlapping transitions
  const isTransitioningRef = useRef(false);

  // Effect to sync the transition ref with the state for safer checks
  useEffect(() => {
    isTransitioningRef.current = transitioning;
  }, [transitioning]);

  // Reset transition state on mount to ensure a clean start
  useEffect(() => {
    setTransitioning(false);
  }, []);

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
  const [videoLoaded, setVideoLoaded] = useState(true); // Start as true for immediate fade-in
  const [videoError, setVideoError] = useState(false);
  const [textContentLoaded, setTextContentLoaded] = useState(false); // Track when text content is ready
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
        fontSize: !isMobile ? "3.5rem" : "2.65rem",
        whiteSpace: "nowrap",
        padding: "0 10px",
        fontWeight: "bold",
      };

      Object.assign(tempDiv.style, baseStyle);
      document.body.appendChild(tempDiv);

      titleWords.forEach((word, index) => {
        tempDiv.textContent = word;
        widths[index] = tempDiv.offsetWidth;
      });

      document.body.removeChild(tempDiv);
      setWordWidths(widths);
    }
  }, [titleWords, isMobile]);

  // Use the synth in a way consistent with the Try Me section
  // Defer initialization to avoid blocking FCP
  useEffect(() => {
    let localSynth: DisposableSynth = null;

    const initializeSynth = async () => {
      if (!effectsChain) return;

      try {
        // Initialize audio context if needed
        if (Tone.context.state !== "running") {
          await Tone.start();
          setAudioContextStarted(true);
        }

        // Create a new synth using the same approach as Try Me section
        const newSynth = createSynth("polysynth", effectsChain);

        // Store in ref
        synthRef.current = newSynth;
        localSynth = newSynth;

        // Apply the preset using the exact same method as in SynthesizerContainer
        if (newSynth) {
          try {
            const preset = getPresetById("atmospheric");

            // Apply synth parameters exactly as in SynthesizerContainer.js
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

            // Apply effects using the exact same approach
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
      } catch (error) {
        console.error("Error initializing synth in HeroSection:", error);
      }
    };

    // Defer synth initialization to after FCP (1.5 seconds)
    const timerId = setTimeout(() => {
      initializeSynth();
    }, 1500);

    // Clean up
    return () => {
      clearTimeout(timerId);
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
  const playNote = async (noteName: string): Promise<void> => {
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
        if (["A", "A#", "Bb", "B"].includes(noteName)) {
          noteWithOctave = `${noteName}3`; // Lower octave for A, Bb, B
        } else if (["C", "C#", "Db", "D", "D#", "Eb"].includes(noteName)) {
          noteWithOctave = `${noteName}4`; // Middle octave for C through E
        } else {
          noteWithOctave = `${noteName}4`; // Middle octave for F through G#
        }
      }

      // Exactly follow the pattern from SynthesizerContainer.js for playing notes
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
  };

  // Add a function to play all notes in the current chord
  const playChord = useCallback(async () => {
    try {
      // Make sure audio context is started
      if (Tone.context.state !== "running") {
        await Tone.start();
        setAudioContextStarted(true);
      }

      // Get the current chord's notes
      const currentChord = chordProgression[currentChordIndex];

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
          const notesWithOctaves = currentChord.notes.map((note) => {
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

          // Play all notes simultaneously
          synth.triggerAttackRelease(allNotes, "0.8s");
        }
      }
    } catch (error) {
      console.error("Error playing chord:", error);
    }
  }, [chordProgression, currentChordIndex, setAudioContextStarted, synthRef]);

  // Turn moveToNextChord into a useCallback
  const moveToNextChord = useCallback((): void => {
    // Prevent overlapping transitions using the ref for more reliability
    if (isTransitioningRef.current) {
      return;
    }
    
    // Get the next chord from the progression
    const nextChordIndex = (currentChordIndex + 1) % chordProgression.length;

    // Get current and next chord notes
    const currentNotes = chordProgression[currentChordIndex].notes;
    const nextNotes = chordProgression[nextChordIndex].notes;
    
    // Create a new array for the next positions based on voice leading principles
    const newPositions = [...initialPositions];
    
    // Map current displayed notes to their positions
    const currentNotePositions = displayedChord.notes.map((note, index) => ({
      note,
      position: displayedChord.positions[index]
    }));
    
    // Create a map to track which notes from the next chord have been assigned
    const assignedNextNotes = new Set<string>();
    
    // Create the voice-led notes array, starting with the current note positions
    const voiceLeadingNotes: string[] = [];
    
    // For each current note position, find the best voice leading note from the next chord
    currentNotePositions.forEach(({ note: currentNote }) => {
      // First, check if the same note exists in the next chord (common tone)
      if (nextNotes.includes(currentNote) && !assignedNextNotes.has(currentNote)) {
        // Common tone voice leading - reuse the same note
        voiceLeadingNotes.push(currentNote);
        assignedNextNotes.add(currentNote);
      } else {
        // Find the closest note in the next chord
        // This is a simple implementation - for real voice leading we'd consider semitone distances
        
        const noteIndex = {
          'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 
          'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 
          'A#': 10, 'Bb': 10, 'B': 11
        };
        
        // Get the chromatic index of the current note
        const currentNoteIndex = noteIndex[currentNote as keyof typeof noteIndex] || 0;
        
        // Find the unassigned note from the next chord with the closest distance
        let closestNote = '';
        let smallestDistance = 12; // Maximum semitone distance in an octave
        
        for (const nextNote of nextNotes) {
          if (!assignedNextNotes.has(nextNote)) {
            const nextNoteIndex = noteIndex[nextNote as keyof typeof noteIndex] || 0;
            
            // Calculate semitone distance (considering octave wrapping)
            let distance = Math.abs(nextNoteIndex - currentNoteIndex);
            if (distance > 6) distance = 12 - distance; // Consider the shorter path around the circle
            
            if (distance < smallestDistance) {
              smallestDistance = distance;
              closestNote = nextNote;
            }
          }
        }
        
        if (closestNote) {
          voiceLeadingNotes.push(closestNote);
          assignedNextNotes.add(closestNote);
        }
      }
    });
    
    // If there are any unassigned notes from the next chord, add them
    nextNotes.forEach(note => {
      if (!assignedNextNotes.has(note)) {
        voiceLeadingNotes.push(note);
        assignedNextNotes.add(note);
      }
    });
    
    // Ensure we have the same number of notes (should always be true for triads)
    while (voiceLeadingNotes.length < 3) {
      // Find any unused notes from the next chord
      const unusedNote = nextNotes.find(note => !voiceLeadingNotes.includes(note));
      if (unusedNote) {
        voiceLeadingNotes.push(unusedNote);
      } else {
        // Fallback - just duplicate the first note of the next chord
        voiceLeadingNotes.push(nextNotes[0]);
      }
    }

    // Set up the transition
    setPreviousChord(displayedChord);
    setTransitioning(true);
    isTransitioningRef.current = true; // Set the ref directly for immediate effect

    // Update current chord index
    setCurrentChordIndex(nextChordIndex);

    // Update the displayed chord with voice-led notes and the same positions
    setDisplayedChord({
      notes: voiceLeadingNotes,
      positions: newPositions,
      index: nextChordIndex,
    });
  }, [
    currentChordIndex,
    chordProgression,
    initialPositions,
    displayedChord,
    playChord,
  ]);

  // Change chord every 4 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      moveToNextChord();
    }, 4000);

    // Initial chord play after a short delay
    const initialPlayTimeout = setTimeout(() => {
      moveToNextChord();
    }, 2000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(initialPlayTimeout);
    };
  }, [moveToNextChord]);

  // Add animation progress tracker in useEffect
  useEffect(() => {
    if (!transitioning) {
      return;
    }

    let startTime: number | null = null;
    const duration = 1200; // 1.2 seconds for the transition (slightly shorter)

    // Animation frame to track progress
    const updateProgress = (timestamp: number): void => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

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

    // Ensure we clean up and force transition to end after max duration
    const safetyTimeout = setTimeout(() => {
      if (transitioning) {
        setTransitioning(false);
      }
    }, duration + 300); // Add a small buffer to the timeout

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(safetyTimeout);
    };
  }, [transitioning]);

  // Chord pill: stable size + no key remount per chord (was causing AnimatePresence jump); text only updates in place.
  const renderChordName = useCallback(() => (
    <motion.div
      layout={false}
      style={{
        position: "relative",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "min(240px, 100%)",
        minHeight: "42px",
        padding: "8px 12px",
        margin: "0 auto 0",
        textAlign: "center",
        color: "var(--text-secondary)",
        fontSize: "1.2rem",
        lineHeight: 1.2,
        background: "rgba(15, 14, 23, 0.7)",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
        cursor: "pointer",
        zIndex: 2,
      }}
      title={t("hero.tooltips.playChord", "Click to play the chord")}
      initial={false}
      animate={{ opacity: textContentLoaded ? 1 : 0 }}
      transition={{
        opacity: { duration: 0.45, delay: textContentLoaded ? 0.35 : 0 },
      }}
      onClick={playChord}
      whileHover={{
        boxShadow: "0 6px 16px rgba(0, 0, 0, 0.3)",
      }}
      whileTap={{ scale: 0.99 }}
    >
      {chordProgression[currentChordIndex].name}
    </motion.div>
  ), [
    currentChordIndex,
    chordProgression,
    t,
    playChord,
    textContentLoaded,
  ]);

  const renderContent = useCallback(() => {
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
              minHeight: isMobile ? "200px" : "88px",
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
                  fontSize: !isMobile ? "3.5rem" : "2.65rem",
                  display: !isMobile ? "inline-block" : "block",
                  textAlign: !isMobile ? "right" : "center",
                  marginBottom: !isMobile ? "0" : "1.1rem",
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
                  marginBottom: !isMobile ? "0" : "1.1rem",
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
                      fontSize: !isMobile ? "3.5rem" : "2.65rem",
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
                  fontSize: !isMobile ? "3.5rem" : "2.65rem",
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

        <HeroBundleLockup
          role="region"
          aria-labelledby="hero-bundle-label"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          <HeroBundleEyebrow id="hero-bundle-label">
            {t("hero.bundleEyebrow", "One subscription · two products")}
          </HeroBundleEyebrow>
          <HeroProductPair>
            <HeroProductChip $variant="cymasphere">
              <HeroProductImageFrame>
                <Image
                  src={HERO_PRODUCT_IMAGES.cymasphere}
                  alt={t(
                    "hero.bundleCymasphereImageAlt",
                    "Cymasphere song builder and arrangement workspace",
                  )}
                  fill
                  sizes="(max-width: 680px) 90vw, 340px"
                  priority
                  quality={88}
                  style={{
                    objectFit: "contain",
                    objectPosition: "center center",
                  }}
                />
              </HeroProductImageFrame>
              <HeroProductTextBlock>
                <HeroProductName>
                  {t("hero.bundleCymasphereTitle", "Cymasphere")}
                </HeroProductName>
                <HeroProductDesc>
                  {t(
                    "hero.bundleCymasphereDesc",
                    "Composition & theory suite",
                  )}
                </HeroProductDesc>
              </HeroProductTextBlock>
            </HeroProductChip>
            <HeroBundlePlus aria-hidden>+</HeroBundlePlus>
            <HeroProductChip $variant="cymaSynth">
              <HeroProductImageFrame>
                <Image
                  src={HERO_PRODUCT_IMAGES.cymaSynth}
                  alt={t(
                    "hero.bundleCymaSynthImageAlt",
                    "CymaSynth wavetable synthesizer product interface",
                  )}
                  fill
                  sizes="(max-width: 680px) 90vw, 340px"
                  quality={88}
                  style={{
                    objectFit: "cover",
                    objectPosition: "center center",
                  }}
                />
              </HeroProductImageFrame>
              <HeroProductTextBlock>
                <HeroProductName>
                  {t("hero.bundleCymaSynthTitle", "CymaSynth")}
                </HeroProductName>
                <HeroProductDesc>
                  {t(
                    "hero.bundleCymaSynthDesc",
                    "Wavetable synthesizer",
                  )}
                </HeroProductDesc>
              </HeroProductTextBlock>
            </HeroProductChip>
          </HeroProductPair>
          <HeroBundleFootnote>
            {t(
              "hero.bundleFootnote",
              "Both included — standalone, AU & VST3 · Every plan",
            )}
          </HeroBundleFootnote>
        </HeroBundleLockup>

        <HeroSubtitle
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
        >
          {t("hero.subtitle", "Enter the next evolution of music creation, where theoretical foundations invisibly guide your workflow. Chords and melodies connect with purpose, empowering your unique musical vision.")}
        </HeroSubtitle>

        <PlatformAvailability
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <PlatformBadge>
            <FaApple />
            {t("hero.platforms.macos", "macOS")}
          </PlatformBadge>
          <PlatformBadge>
            <FaWindows />
            {t("hero.platforms.windows", "Windows")}
          </PlatformBadge>
          <PlatformBadge>
            <FaTabletAlt />
            {t("hero.platforms.ipad", "iPad")}
          </PlatformBadge>
          <FormatBadge>
            <FaPlug />
            AU · VST3
          </FormatBadge>
        </PlatformAvailability>

        <ButtonGroup
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4 }}
          onAnimationComplete={() => {
            // Set text content as loaded when the buttons finish animating
            setTextContentLoaded(true);
          }}
        >
          <PrimaryButton
            href="#pricing"
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

        {renderChordName()}
      </HeroContent>
    );
  }, [
    titleWords,
    currentWordIndex,
    t,
    audioContextStarted,
    playChord,
    synthRef,
    wordMeasureRef,
    centerWordWidth,
    isMobile,
    getWordColor,
    displayedChord,
    previousChord, 
    transitioning,
    positionAnimationOffsets,
    textContentLoaded,
    setTextContentLoaded,
    renderChordName,
  ]);

  // Render the voice leading lines during transitions
  const renderVoiceLeadingLines = () => {
    if (!previousChord || !transitioning) {
      return null;
    }

    // Create lines between notes that are moving
    const lines = [];
    
    // Iterate through the notes in previous chord
    for (let i = 0; i < previousChord.notes.length; i++) {
      const prevNote = previousChord.notes[i];
      const prevPos = previousChord.positions[i] || { top: "15%", left: "10%" };
      const currNote = displayedChord.notes[i] || "";
      const currPos = displayedChord.positions[i] || { top: "15%", left: "10%" };
      
      // Calculate start position
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
          
      // Calculate end position
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
      const targetColor = pitchColors[displayedChord.notes[i]] || "#6C63FF";

      lines.push(
        <motion.div
          key={`line-${i}-${displayedChord.index}`}
          style={{
            position: "absolute",
            height: 2,
            top: startY,
            left: startX,
            width: length,
            zIndex: 2,
            transform: `rotate(${angle}deg)`,
            transformOrigin: "0 0",
            background: `linear-gradient(90deg, ${sourceColor}88, ${targetColor}88)`,
          }}
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: [0, 0.7, 0], scaleX: [0, 1, 0] }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      );
    }

    return lines;
  };

  // Render the floating musical notes
  const renderNotes = useCallback(() => {
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
              width: isMobile ? "45px" : "60px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "rgba(0, 0, 0, 0.2)",
              filter: "blur(4px)",
              zIndex: 2,
              top: shadowTop,
              bottom: shadowBottom,
              left: shadowLeft,
              right: shadowRight,
            }}
            initial={{ opacity: 0 }}
            animate={textContentLoaded ? {
              scale: [0.9, 1, 0.9],
              opacity: [0.3, 0.4, 0.3],
            } : { opacity: 0 }}
            transition={textContentLoaded ? {
              scale: {
                repeatType: "mirror",
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset.delay + 0.5, // Add extra delay after text loads
              },
              opacity: {
                repeatType: "mirror",
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset.delay + 0.5, // Add extra delay after text loads
              },
            } : {
              opacity: { duration: 0.8, delay: 0.3 + animationOffset.delay }
            }}
          />

          {/* Note circle */}
          <motion.div
            key={`note-${positionKey}`}
            style={{
              position: "absolute",
              width: isMobile ? "45px" : "60px",
              height: isMobile ? "45px" : "60px",
              borderRadius: "50%",
              backgroundColor: noteColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontWeight: "bold",
              fontSize: isMobile ? "1.2rem" : "1.5rem",
              textShadow:
                "0px 2px 3px rgba(0,0,0,0.5), 0px 1px 5px rgba(0,0,0,0.5)",
              zIndex: 3,
              cursor: "pointer",
              boxShadow:
                "0 10px 20px rgba(0, 0, 0, 0.2), inset 0 4px 10px rgba(255, 255, 255, 0.3), inset 0 -4px 10px rgba(0, 0, 0, 0.2)",
              ...position,
            }}
            title={t("hero.tooltips.playNote", "Click to play this note")}
            // Keep backgroundColor as an animated property during transitions
            initial={{ opacity: 0, scale: 0.8 }}
            animate={textContentLoaded ? {
              opacity: 1,
              backgroundColor: noteColor,
              y: [0, -15, 0],
              scale: [1, 1.05, 1],
            } : { 
              opacity: 1, 
              scale: 1,
              backgroundColor: noteColor 
            }}
            transition={textContentLoaded ? {
              backgroundColor: {
                duration: 1.5,
                ease: "easeInOut",
              },
              y: {
                repeatType: "mirror",
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset.delay + 0.5, // Add extra delay after text loads
              },
              scale: {
                repeatType: "mirror",
                repeat: Infinity,
                duration: 2.5,
                ease: "easeInOut",
                delay: animationOffset.delay + 0.5, // Add extra delay after text loads
              },
            } : {
              opacity: { duration: 0.8, delay: 0.3 + animationOffset.delay },
              scale: { duration: 0.6, delay: 0.3 + animationOffset.delay },
              backgroundColor: { duration: 0.6, delay: 0.3 + animationOffset.delay }
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
  }, [
    displayedChord,
    isMobile,
    transitioning,
    previousChord,
    positionAnimationOffsets,
    pitchColors,
    t,
    playNote,
    textContentLoaded
  ]);

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

  return (
    <HeroContainer id="home">
      {!videoError && (
        <BackgroundVideo
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          $loaded={videoLoaded}
          disablePictureInPicture
          disableRemotePlayback
          x-webkit-airplay="deny"
          onError={() => {
            setVideoError(true);
          }}
          onLoadStart={() => {}}
          onCanPlay={() => {
            setVideoLoaded(true);
          }}
          style={{ 
            willChange: 'auto',
            backfaceVisibility: 'hidden',
            perspective: '1000px'
          }}
        >
          <source src="/images/hero-background.webm" type="video/webm" />
          <source src="/images/hero-background.mp4" type="video/mp4" />
        </BackgroundVideo>
      )}
      {renderContent()}
      {renderVoiceLeadingLines()}
      {renderNotes()}
    </HeroContainer>
  );
};

export default HeroSection;
