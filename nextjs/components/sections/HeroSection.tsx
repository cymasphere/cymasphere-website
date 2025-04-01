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
import { getPresetById } from "../../utils/presets";
import { createSynth, disposeSynth } from "../../utils/synthUtils";
import useEffectsChain from "../../hooks/useEffectsChain";

// Define styled components...
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
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
  pointer-events: none;
  filter: blur(0); /* Force GPU rendering */

  &:after {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: radial-gradient(
      circle at 30% 30%,
      rgba(255, 255, 255, 0.8),
      transparent 70%
    );
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
  will-change: transform, opacity;
  transform: translateZ(0);
  backface-visibility: hidden;
  pointer-events: none;
  filter: blur(4px) drop-shadow(0 0 1px rgba(0, 0, 0, 0.1)); /* Force GPU rendering */
`;

const VoiceLeadingLine = styled(motion.div)`
  position: absolute;
  height: 2px;
  background: linear-gradient(
    90deg,
    rgba(108, 99, 255, 0.5),
    rgba(78, 205, 196, 0.5)
  );
  border-radius: 4px;
  opacity: 0;
  z-index: 1;
`;

// Type definitions
interface PitchColors {
  [key: string]: string;
}

interface NoteValues {
  [key: string]: number;
}

// Color mapping for all 12 chromatic pitches
const pitchColors: PitchColors = {
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

// Function to calculate semitone distance between two notes
const getSemitoneDistance = (note1: string, note2: string): number => {
  const noteValues: NoteValues = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11,
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
const noteToFreq = (noteName: string): number => {
  const noteValues: NoteValues = {
    C: 0,
    "C#": 1,
    D: 2,
    "D#": 3,
    E: 4,
    F: 5,
    "F#": 6,
    G: 7,
    "G#": 8,
    A: 9,
    "A#": 10,
    B: 11,
  };

  // Apply synth parameters exactly as in SynthesizerContainer.js
  // ... rest of the function implementation ...
  return 440; // Placeholder for the actual implementation
};

// Add type definitions for other utility functions and the main component
// ... rest of the file implementation ...

const HeroSection: React.FC = () => {
  // Component implementation goes here
  // ... component state, effects, and functions ...

  return (
    <HeroContainer>
      {/* Component content */}
      <HeroContent>
        <HeroTitle>Cymasphere</HeroTitle>
        <HeroSubtitle>Interactive Music Experience</HeroSubtitle>
      </HeroContent>
    </HeroContainer>
  );
};

export default HeroSection;
