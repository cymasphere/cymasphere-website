"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaCheck, FaGift, FaUnlock, FaTimes, FaCreditCard } from "react-icons/fa";
import { IoInformationCircle } from "react-icons/io5";
// Import Stripe actions
import {
  initiateCheckout,
  getPrices,
  PlanType,
  PriceData,
  checkExistingCustomer
} from "@/utils/stripe/actions";
import * as Tone from "tone"; // Import Tone.js for audio playback
// Import the CymasphereLogo component dynamically
import dynamic from "next/dynamic";
// Import useAuth hook
import { useAuth } from "@/contexts/AuthContext";
// Import useRouter from next/navigation
import { useRouter } from "next/navigation";
import { createPortal } from 'react-dom';
import EmailCollectionModal from "../modals/EmailCollectionModal";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

// Type definitions for chord positions
interface ChordPosition {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  rotationOffset: number;
  originalX: number;
  originalY: number;
  playingTime: number | null;
  collisionTime: number | null;
  displayRadius?: number;
  displayScale?: number;
  cachedGradient?: {
    key: string;
    gradient: CanvasGradient;
  };
}

interface ChordDefinition {
  name: string;
  notes: string[];
  color: string;
}

interface ChordCenter {
  x: number;
  y: number;
  z: number;
  radius: number;
  noteCount: number;
  color: string;
  scale: number;
}

// Type definitions for CymasphereLogo component
interface CymasphereLogoProps {
  size?: string;
  fontSize?: string;
  showText?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

// Use dynamic import to handle JavaScript component in TypeScript
const CymasphereLogo = dynamic(() => import("../common/CymasphereLogo"), {
  ssr: false,
}) as React.ComponentType<CymasphereLogoProps>;

// ChordWeb component for molecular chord background
const ChordWebCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* Set BELOW ContentContainer */
  opacity: 1; /* Maximum opacity for full visibility */
  cursor: default; /* Use default cursor by default */

  /* Hide on mobile devices */
  @media (max-width: 768px) {
    display: none;
  }
`;

// Memoize the ChordWeb component to prevent re-renders when parent state changes
const ChordWeb = React.memo(() => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const positionsInitialized = useRef<boolean>(false);
  const synth = useRef<Tone.PolySynth<Tone.AMSynth> | null>(null);
  const activeChords = useRef<Set<number>>(new Set()); // Track currently playing chords
  const timeoutIds = useRef<Record<number, NodeJS.Timeout>>({});
  const currentTime = useRef<number>(0);
  const mousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseOverCanvas = useRef<boolean>(false);

  // Initialize Tone.js synth
  useEffect(() => {
    // Create a more ambient synth sound with underwater qualities
    const ambientSynth = new Tone.PolySynth(Tone.AMSynth, {
      oscillator: {
        type: "sine",
      },
      envelope: {
        attack: 0.5, // Slower attack for underwater muffled effect
        decay: 3, // Longer decay
        sustain: 0.6, // Higher sustain
        release: 8, // Much longer release for underwater trail
      },
      modulation: {
        type: "sine",
      },
      modulationEnvelope: {
        attack: 0.8, // Slower modulation attack
        decay: 1.5, // Longer decay
        sustain: 0.4,
        release: 10, // Much longer release
      },
    });

    // Create lowpass filter for underwater muffled effect
    const filter = new Tone.Filter({
      type: "lowpass",
      frequency: 800, // Low frequency cutoff for underwater effect
      Q: 1.5,
      rolloff: -24,
    });

    // Create reverb effect with longer decay for underwater spaciousness
    const reverb = new Tone.Reverb({
      decay: 16, // Increased from 12 for more underwater echo
      wet: 0.98, // Higher wet mix
      preDelay: 0.2, // Slightly higher preDelay
    }).toDestination();

    // Create a volume node to reduce gain
    const volume = new Tone.Volume(-14); // Slightly higher volume

    // Add vibrato for underwater wavering
    const vibrato = new Tone.Vibrato({
      frequency: 1.5, // Slow vibrato
      depth: 0.3, // Moderate depth
    });

    // Chain effects: synth -> vibrato -> filter -> volume -> reverb -> destination
    ambientSynth.chain(vibrato, filter, volume, reverb);

    // Store synth in ref
    synth.current = ambientSynth;

    return () => {
      // Clean up synth and effects when component unmounts
      if (synth.current) {
        synth.current.dispose();
      }
      reverb.dispose();
      filter.dispose();
      vibrato.dispose();
      volume.dispose();
    };
  }, []);

  // Function to play a chord when clicked
  const playChord = useCallback(
    (chord: ChordDefinition, chordIndex: number) => {
      // Check if we've reached the maximum number of simultaneous chords (4)
      if (
        activeChords.current.size >= 4 &&
        !activeChords.current.has(chordIndex)
      ) {
        // If we're at the limit and this is a new chord, don't play it
        return;
      }

      // If this chord is already playing, don't play it again
      if (activeChords.current.has(chordIndex)) {
        return;
      }

      // Add this chord to the set of active chords
      activeChords.current.add(chordIndex);

      // Convert note names to frequencies with octave information
      const notes = chord.notes.map((note: string, index: number) => {
        // Determine octave (lower for string ensemble sound)
        const baseOctave = 3; // Lower range for richness

        // Root note (first note) gets an octave lower for stronger bass foundation
        if (index === 0) {
          return `${note}${baseOctave - 1}`;
        }

        // For the rest of the notes, distribute across orchestral string ranges
        let octave = baseOctave;

        // For larger chords, distribute notes across octaves for orchestral arrangement
        if (chord.notes.length > 3) {
          // Middle range - viola-like
          if (index < 3) {
            octave = baseOctave;
          }
          // Higher range - violin-like
          else {
            octave = baseOctave + 1;
          }
        }

        return `${note}${octave}`;
      });

      // Start Tone.js audio context if it's not started yet
      if (Tone.context.state !== "running") {
        Tone.start().then(() => {
          playNotes(notes, chordIndex);
        });
      } else {
        playNotes(notes, chordIndex);
      }

      function playNotes(notes: string[], chordIndex: number) {
        // Play chord for longer duration (2n = half note) to let reverb shine
        if (synth.current) {
          synth.current.triggerAttackRelease(notes, "2n");
        }

        // Clear any existing timeout for this chord
        if (timeoutIds.current[chordIndex]) {
          clearTimeout(timeoutIds.current[chordIndex]);
        }

        // Add visual feedback for the playing chord
        const position = chordPositions.current[chordIndex];
        if (position) {
          position.playingTime = currentTime.current; // Use the ref value instead of direct time variable
        }

        // Set timeout to remove chord from active list after it finishes
        timeoutIds.current[chordIndex] = setTimeout(() => {
          activeChords.current.delete(chordIndex);
          delete timeoutIds.current[chordIndex];
        }, 5000); // Increased from 3000 to match longer reverb tail
      }
    },
    []
  );

  // Pre-compute color values for better performance
  const chordColors = useMemo(() => {
    return [
      "rgba(128, 119, 255, 0.9)", // C major triad
      "rgba(255, 210, 80, 0.9)", // Eb major sus4
      "rgba(150, 230, 255, 0.95)", // C major 9th
      "rgba(255, 130, 90, 0.9)", // Eb major triad
      "rgba(160, 255, 220, 0.95)", // C major 13th
      "rgba(150, 230, 255, 0.95)", // Eb major 9th
      "rgba(128, 119, 255, 0.9)", // C major triad
      "rgba(255, 200, 70, 0.95)", // C major 7th with #11
      "rgba(255, 210, 80, 0.9)", // C major sus4
      "rgba(255, 130, 90, 0.9)", // Eb major triad
      "rgba(255, 200, 70, 0.95)", // C major 11th
      "rgba(90, 255, 140, 0.9)", // C major 7th
      "rgba(160, 255, 220, 0.95)", // Eb major 13th
      "rgba(90, 255, 140, 0.9)", // C major 7th
    ];
  }, []);

  // Reduce number of chords for better performance
  const chords = useMemo(
    () => [
      // Evenly distributed chord types (triads, 7ths, 9ths, 11ths, 13ths)
      { name: "C", notes: ["C", "E", "G"], color: chordColors[0] },
      {
        name: "Bb7sus4",
        notes: ["Bb", "Eb", "F", "Ab"],
        color: chordColors[1],
      },
      {
        name: "Dmaj9",
        notes: ["D", "F#", "A", "C#", "E"],
        color: chordColors[2],
      },
      { name: "Gm", notes: ["G", "Bb", "D"], color: chordColors[3] },
      {
        name: "Cmaj13",
        notes: ["C", "E", "G", "B", "D", "A"],
        color: chordColors[4],
      },
      {
        name: "Ebm9",
        notes: ["Eb", "Gb", "Bb", "Db", "F"],
        color: chordColors[5],
      },
      { name: "Dm", notes: ["D", "F", "A"], color: chordColors[6] },
      {
        name: "Fmaj7(#11)",
        notes: ["F", "A", "C", "E", "G", "B"],
        color: chordColors[7],
      },
      { name: "G7sus4", notes: ["G", "C", "D", "F"], color: chordColors[8] },
      { name: "Eb", notes: ["Eb", "G", "Bb"], color: chordColors[9] },
      {
        name: "Am11",
        notes: ["A", "C", "E", "G", "B", "D"],
        color: chordColors[10],
      },
      { name: "Fmaj7", notes: ["F", "A", "C", "E"], color: chordColors[11] },
      {
        name: "Abmaj13",
        notes: ["Ab", "C", "Eb", "G", "Bb", "F"],
        color: chordColors[12],
      },
      { name: "Cmaj7", notes: ["C", "E", "G", "B"], color: chordColors[13] },
    ],
    [chordColors]
  );

  // Define positions for each chord molecule
  const chordPositions = useRef<ChordPosition[]>([]);

  // Animation properties
  const animationSpeed = 0.0003; /* Reduced from 0.0006 for gentler animation */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    let time = 0;
    let lastFrameTime = 0;
    let resizeTimeout: NodeJS.Timeout;

    // Optimize canvas attributes for performance
    context.imageSmoothingQuality = "low";
    context.globalCompositeOperation = "lighter";

    // Add mousemove listener to change cursor when hovering over molecules
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Store mouse position for use in animation loop instead of recalculating for each chord
      mousePosition.current = { x: mouseX, y: mouseY };

      let isOverMolecule = false;

      // Find if mouse is over any chord molecule - only check visible ones
      for (let i = 0; i < chordPositions.current.length; i++) {
        const position = chordPositions.current[i];
        if (!position) continue;

        // Skip checking faraway molecules for performance
        if (position.z > 100) continue;

        // Calculate distance to chord center
        const dx = mouseX - position.x;
        const dy = mouseY - position.y;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

        // Get molecule properties - use actual molecule radius
        const scale = position.displayScale || 400 / (400 + position.z);
        const chord = chords[i];
        const noteCount = chord.notes.length;
        const baseRadius = 25;
        const moleculeRadius =
          (baseRadius + Math.sqrt(noteCount - 3) * 5) * scale;

        // Use actual molecule radius for hover detection
        if (distanceToCenter <= moleculeRadius * 1.5) {
          // 1.5x for slightly easier hovering
          isOverMolecule = true;
          break;
        }
      }

      // Only change the cursor style if the state changes
      if (isOverMolecule !== isMouseOverCanvas.current) {
        canvas.style.cursor = isOverMolecule ? "pointer" : "default";
        isMouseOverCanvas.current = isOverMolecule;
      }
    };

    // Debounced resize handler for better performance
    const resizeCanvas = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }

      resizeTimeout = setTimeout(() => {
        // Set canvas dimensions to match display size
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;

        // Re-initialize positions after resize
        positionsInitialized.current = false;
      }, 200); // 200ms debounce
    };

    // Set initial canvas size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Add event listeners
    canvas.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("resize", resizeCanvas, { passive: true });

    // Initialize positions
    const initializePositions = (width: number, height: number) => {
      // Define center safe zone - no molecules in this area
      const centerX = width / 2;
      const centerY = height / 2;

      // Define a wider, more rectangular safe zone that better matches the content area
      // These are intentionally unused since they're for documentation purposes
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const safeZoneWidth = width * 0.9; // Increased from 0.8 to 0.9
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const safeZoneHeight = height * 0.95; // Increased from 0.85 to 0.95

      // Position chord molecules in an evenly distributed pattern
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const allPositions = [];

      // Place chords evenly around the edges of the safe zone with LESS randomness
      const totalChords = chords.length;
      const angleStep = (2 * Math.PI) / totalChords;

      chords.forEach((chord, index) => {
        // Consider chords with 5+ notes "complex"
        const isComplex = chord.notes.length >= 5;

        // Calculate position along a rough ellipse around the content
        // Reduce randomness for more consistent oval shape
        const angle = index * angleStep + (Math.random() * 0.2 - 0.1); // Reduced randomness

        // More pronounced elliptical distribution with less randomness and pushed further out
        const radiusX = width * 0.45 + (Math.random() * 0.04 - 0.02) * width; // Increased from 0.38 to 0.45
        const radiusY = height * 0.45 + (Math.random() * 0.04 - 0.02) * height; // Increased from 0.38 to 0.45

        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;

        // Slower overall movement
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const movementSpeed = isComplex
          ? 0.02 + Math.random() * 0.02 // Reduced from 0.03 for slower motion
          : 0.025 + Math.random() * 0.025; // Reduced from 0.04 for slower motion

        // Use smaller z-depth range for better visibility
        const zDepth = isComplex
          ? 10 + Math.random() * 40 // More visible
          : 20 + Math.random() * 60;

        // Store Z-depth for z-sorting
        const position: ChordPosition = {
          x: x,
          y: y,
          z: zDepth,
          vx: 0,
          vy: 0,
          rotationOffset: Math.random() * Math.PI * 2, // Random starting rotation
          originalX: x, // Store original position for gentle reset force
          originalY: y,
          // Add a playing flag to track state (optimized for fewer property checks)
          playingTime: null,
          collisionTime: null,
        };

        chordPositions.current[index] = position;
      });

      // Mark as initialized
      positionsInitialized.current = true;
    };

    // Draw a note (atom) with 3D effect - simplified for performance
    const drawNote = (
      x: number,
      y: number,
      z: number,
      noteName: string,
      color: string,
      time: number,
      index: number,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      totalNotes: number
    ) => {
      // Scale based on z-depth (perspective)
      const scale = 400 / (400 + z);
      const size = 8 * scale; // Increased from 6 for better visibility

      // Skip drawing very small notes for performance
      if (size < 2) return;

      // Simplified pulsing to improve performance
      const pulse = 1 + Math.sin(time * 2 + index * 0.5) * 0.2; // Increased from 0.15

      // Stronger glow effect for better visibility - only apply for closer objects
      if (size > 3) {
        context.shadowColor = color;
        context.shadowBlur = 8 * scale; // Increased from 4
      }

      // Main circle
      context.beginPath();
      context.arc(x, y, size * pulse, 0, Math.PI * 2);
      context.fillStyle = color;
      context.fill();

      // Add outline for better visibility
      context.strokeStyle = "rgba(255, 255, 255, 0.7)";
      context.lineWidth = 1 * scale;
      context.stroke();

      // Only draw text if note is large enough (optimization)
      if (size > 3.5) {
        // Note name (small label)
        context.font = `bold ${8 * scale}px Arial`; // Made font bold and slightly larger
        context.fillStyle = "rgba(255, 255, 255, 1)"; // Full opacity
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(noteName, x, y);
      }

      // Reset shadow
      context.shadowBlur = 0;
    };

    // Cache gradient values
    const backgroundGradients: Record<string, CanvasGradient> = {};

    // Draw a radiant background glow to enhance depth
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const drawBackgroundRadiance = (deltaTime: number) => {
      // Skip entirely for performance if needed
      if (window.innerWidth < 1000) return;

      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Create a subtle gradient glow around canvas center
      const radius = Math.max(width, height) * 0.5;

      // Use cached gradient if available
      let gradient = backgroundGradients[width + "x" + height];
      if (!gradient) {
        gradient = context.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );

        // Use gradient that matches the overall color theme
        gradient.addColorStop(0, "rgba(108, 99, 255, 0.03)"); // Center color - purple
        gradient.addColorStop(0.5, "rgba(78, 205, 196, 0.02)"); // Middle color - teal
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)"); // Edge - transparent

        // Cache the gradient
        backgroundGradients[width + "x" + height] = gradient;
      }

      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    };

    // Draw a chord object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const drawChord = (chordIndex: number, time: number, deltaTime: number) => {
      const chord = chords[chordIndex];
      const position = chordPositions.current[chordIndex];

      if (!chord || !position) return null;

      // Calculate scale based on z-depth (perspective)
      const scale = 400 / (400 + position.z);

      // Skip drawing very small chords for performance
      if (scale < 0.3) return null;

      // Create gentle pulse effect for visual interest
      const pulseSpeed = 1 + (chord.notes.length > 4 ? 0.2 : 0); // Faster pulse for complex chords
      const pulse = 1 + Math.sin(time * pulseSpeed + chordIndex * 0.7) * 0.1; // Gentle pulsing

      // Add collision feedback (visual response when chords collide)
      let collisionPulse = 0;

      // If recently collided, add pulse effect that fades with time
      if (position.collisionTime && time - position.collisionTime < 0.5) {
        collisionPulse = 0.3 * (1 - (time - position.collisionTime) / 0.5);
      }

      // Simplified pulse for performance
      const rotationAngle = time * 0.1 + position.rotationOffset; // Reduced from 0.5 to 0.1 for much slower rotation

      // Simplified glow - only draw if object is large enough
      if (scale > 0.6) {
        // Precalculate note positions for better performance
        const noteCount = chord.notes.length;
        const baseRadius = 25;
        const radius = (baseRadius + Math.sqrt(noteCount - 3) * 5) * scale;

        // Store radius and position for collision detection
        position.displayRadius = radius;
        position.displayScale = scale;

        // Add a background glow effect for the entire chord
        const glowRadius = 20 * scale * (pulse + collisionPulse);
        context.beginPath();

        // Cache gradient for performance
        const gradientKey = `${position.x.toFixed(0)},${position.y.toFixed(
          0
        )},${glowRadius.toFixed(1)}`;
        let gradient =
          position.cachedGradient?.key === gradientKey
            ? position.cachedGradient.gradient
            : null;

        if (!gradient) {
          gradient = context.createRadialGradient(
            position.x,
            position.y,
            0,
            position.x,
            position.y,
            glowRadius
          );

          // Change glow color based on playing state
          let glowColor;
          if (position.playingTime && time - position.playingTime < 5) {
            // Ethereal glow that fades slowly for reverb effect
            const playFactor = Math.pow(
              1 - (time - position.playingTime) / 5,
              1.2
            );
            glowColor = chord.color.replace(
              "0.9",
              (0.5 * playFactor + 0.2).toString()
            );
          } else if (
            position.collisionTime &&
            time - position.collisionTime < 0.5
          ) {
            glowColor = chord.color.replace("0.9", "0.35"); // Brighter during collision
          } else {
            glowColor = chord.color.replace("0.9", "0.2");
          }

          gradient.addColorStop(0, glowColor);
          gradient.addColorStop(1, "rgba(0,0,0,0)");

          // Cache the gradient
          position.cachedGradient = { key: gradientKey, gradient };
        }

        context.fillStyle = gradient;

        // Larger glow radius when playing to match reverb effect
        const displayRadius =
          position.playingTime && time - position.playingTime < 5
            ? glowRadius * (1.5 + Math.sin(time * 2) * 0.2) // Pulsing effect for playing
            : glowRadius;

        context.arc(position.x, position.y, displayRadius, 0, Math.PI * 2);
        context.fill();

        // Draw chord name with "Click to play" indicator when hovering
        if (scale > 0.7) {
          // Draw chord name with 3D effect - position further away from the molecule
          const nameOffset = radius + 15 * scale;

          context.font = `${12 * scale}px Arial`;
          context.fillStyle = "rgba(255, 255, 255, 0.9)";
          context.textAlign = "center";
          context.textBaseline = "middle";

          // Show playing status with reverb indicator
          if (position.playingTime && time - position.playingTime < 5) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const fadePhase = (time - position.playingTime) / 5;
            context.fillText(chord.name, position.x, position.y - nameOffset);
          } else {
            context.fillText(chord.name, position.x, position.y - nameOffset);
          }
        }
      } else {
        // Precalculate note positions for better performance even when not drawing
        const noteCount = chord.notes.length;
        const baseRadius = 25;
        const radius = (baseRadius + Math.sqrt(noteCount - 3) * 5) * scale;

        // Store radius and position for collision detection
        position.displayRadius = radius;
        position.displayScale = scale;
      }

      // Get the note positions based on the radius
      const noteCount = chord.notes.length;
      const baseRadius = 25;
      const radius =
        position.displayRadius ||
        (baseRadius + Math.sqrt(noteCount - 3) * 5) * scale;

      // Check collisions with other chords (except those with very different z depths)
      for (let i = 0; i < chordPositions.current.length; i++) {
        if (i === chordIndex) continue; // Skip self

        const otherPosition = chordPositions.current[i];
        if (!otherPosition || !otherPosition.displayRadius) continue;

        // Skip collision detection for chords with very different z-depths
        const zDiff = Math.abs(position.z - otherPosition.z);
        if (zDiff > 80) continue;

        // Calculate distance between chord centers
        const dx = position.x - otherPosition.x;
        const dy = position.y - otherPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Sum of radii plus padding
        const minDistance =
          position.displayRadius + otherPosition.displayRadius + 20;

        // If colliding, apply collision physics
        if (distance < minDistance) {
          // Collision impulse strength
          const collisionStrength = 0.01; // Adjusted for smoother motion

          // Direction vector between the two centers
          const nx = dx / distance;
          const ny = dy / distance;

          // Calculate impulse magnitude (stronger for more overlap)
          const overlap = minDistance - distance;
          const impulse =
            overlap *
            collisionStrength *
            (otherPosition.displayRadius / position.displayRadius);

          // Apply impulse to velocity and position
          position.vx += nx * impulse;
          position.vy += ny * impulse;

          // Update collision time for visual effect
          position.collisionTime = time;
        }
      }

      const notePositions = chord.notes.map((note, index) => {
        // 3D rotation effect
        const angle = (index / noteCount) * Math.PI * 2;
        const x3d = Math.cos(angle) * radius;
        const y3d = Math.sin(angle) * radius;

        // Apply 3D rotation
        const rotatedX =
          x3d * Math.cos(rotationAngle) - y3d * Math.sin(rotationAngle);
        const rotatedY =
          x3d * Math.sin(rotationAngle) + y3d * Math.cos(rotationAngle);

        return {
          x: position.x + rotatedX,
          y: position.y + rotatedY,
          z: position.z,
          note,
        };
      });

      // Draw lines connecting notes (bonds) with glow effect BEFORE drawing notes
      if (scale > 0.5) {
        context.shadowColor = chord.color;

        // Enhanced glow for playing chords
        const playingEffect =
          position.playingTime && time - position.playingTime < 5
            ? 3 * Math.pow(1 - (time - position.playingTime) / 5, 1.5) // Stronger glow that fades with reverb
            : 0;

        context.shadowBlur =
          3 * scale * (1 + (collisionPulse + playingEffect) * 2);
        context.beginPath();

        // For all chords, connect in a circular pattern
        notePositions.forEach((notePos, index) => {
          const nextNotePos = notePositions[(index + 1) % noteCount];
          context.moveTo(notePos.x, notePos.y);
          context.lineTo(nextNotePos.x, nextNotePos.y);
        });

        // Brighter lines when playing to match reverb effect
        let lineOpacity;
        if (position.playingTime && time - position.playingTime < 5) {
          // Fade out slowly to match reverb tail
          lineOpacity =
            0.5 + 0.4 * Math.pow(1 - (time - position.playingTime) / 5, 1.2);
        } else if (
          position.collisionTime &&
          time - position.collisionTime < 0.5
        ) {
          lineOpacity = 0.7; // Bright during collision
        } else {
          lineOpacity = 0.5; // Normal state
        }

        context.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
        context.lineWidth =
          1.2 * scale * (pulse + (collisionPulse + playingEffect) * 0.5);
        context.stroke();
        context.shadowBlur = 0;
      }

      // Draw notes AFTER drawing the connecting lines
      notePositions.forEach((notePos, index) => {
        drawNote(
          notePos.x,
          notePos.y,
          notePos.z,
          notePos.note,
          chord.color,
          time,
          index,
          noteCount
        );
      });

      // Return center position for web connections with z-depth
      return {
        x: position.x,
        y: position.y,
        z: position.z,
        radius: 20 * scale * pulse,
        noteCount: noteCount,
        color: chord.color,
        scale: scale,
      };
    };

    // Draw connections between chord molecules - fewer connections for performance
    const drawConnections = (positions: (ChordCenter | null)[]) => {
      const validPositions = positions.filter(
        (p) => p !== null
      ) as ChordCenter[];

      // Only draw connections for closer objects (performance optimization)
      const sortedPositions = [...validPositions]
        .filter((p) => p.scale > 0.4) // Only include more visible chords
        .sort((a, b) => a.z - b.z)
        .slice(0, 8); // Limit to 8 closest chords

      // Limit the number of connections (performance optimization)
      const maxConnections = 8;
      let connectionCount = 0;

      for (
        let i = 0;
        i < sortedPositions.length && connectionCount < maxConnections;
        i++
      ) {
        for (
          let j = i + 1;
          j < sortedPositions.length && connectionCount < maxConnections;
          j++
        ) {
          const pos1 = sortedPositions[i];
          const pos2 = sortedPositions[j];

          // Calculate 3D distance
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const dz = pos2.z - pos1.z;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const distance = Math.sqrt(dx * dx + dy * dy);
          const distance3d = Math.sqrt(dx * dx + dy * dy + dz * dz);

          // Use consistent connection threshold
          const connectionThreshold = 300;

          // Only connect if close enough
          if (distance3d < connectionThreshold) {
            connectionCount++;

            // Opacity based on distance and perspective
            const opacity =
              (1 - distance3d / connectionThreshold) *
              Math.min(pos1.scale, pos2.scale);

            // Simplified connection style
            context.beginPath();
            context.moveTo(pos1.x, pos1.y);
            context.lineTo(pos2.x, pos2.y);
            context.strokeStyle = `rgba(150, 150, 255, ${opacity * 0.3})`;
            context.lineWidth = 0.8 * Math.min(pos1.scale, pos2.scale);
            context.stroke();
          }
        }
      }
    };

    // Main animation loop - optimized
    const render = (timestamp: number) => {
      // Skip initialization frames to prevent animation stutter
      if (!positionsInitialized.current) {
        // Initialize only when ready
        initializePositions(canvas.width, canvas.height);
      }

      // Calculate time delta for smooth animation regardless of frame rate
      const deltaTime = lastFrameTime
        ? (timestamp - lastFrameTime) / 1000
        : 0.016;
      lastFrameTime = timestamp;

      // Clamp deltaTime to prevent jumps after tab switch
      const clampedDelta = Math.min(deltaTime, 0.05);

      // Update time variable
      time += clampedDelta;
      currentTime.current = time;

      // Simplified physics calculations - process movement only once per frame
      const maxVelocity = 10; // Reduced from 20 for slower movement
      chordPositions.current.forEach((position) => {
        if (!position) return;

        // Apply slight random forces for gentle, continuous movement
        // Reduced force magnitude for slower movement
        const forceX = (Math.random() - 0.5) * animationSpeed * 0.6; // Reduced by 40%
        const forceY = (Math.random() - 0.5) * animationSpeed * 0.6; // Reduced by 40%

        // Incorporate force, gravity, and damping in one step
        position.vx += forceX;
        position.vy += forceY;

        // Apply stronger velocity damping for more stable positions
        position.vx *= 0.98; // Increased damping from 0.99
        position.vy *= 0.98; // Increased damping from 0.99

        // Update position
        position.x += position.vx;
        position.y += position.vy;

        // Add z-axis movement in a sine wave pattern for 3D effect - reduced speed
        position.z += Math.sin(time * 0.3 + position.x * 0.01) * 0.1; // Reduced from 0.5 and 0.2

        // Keep z-values within range for consistent depth perception
        if (position.z < 10) position.z = 10;
        if (position.z > 200) position.z = 200;

        // Cap maximum velocity with damping for smooth transitions
        if (Math.abs(position.vx) > maxVelocity) {
          position.vx =
            (position.vx > 0 ? maxVelocity : -maxVelocity) * 0.95 +
            position.vx * 0.05;
        }
        if (Math.abs(position.vy) > maxVelocity) {
          position.vy =
            (position.vy > 0 ? maxVelocity : -maxVelocity) * 0.95 +
            position.vy * 0.05;
        }

        // Add stronger force to maintain original positions
        // Calculate current distance from original position
        const dx = position.x - position.originalX;
        const dy = position.y - position.originalY;
        const distanceFromOrigin = Math.sqrt(dx * dx + dy * dy);

        // Stronger correction that increases with distance
        const correctionFactor = 0.0005; // Increased from 0.00015 for stronger return force

        // Apply stronger correction when further from original position
        // This creates a "spring" effect that gets stronger with distance
        const distanceMultiplier = 1.0 + distanceFromOrigin / 100; // Scale force with distance
        position.vx -= dx * correctionFactor * distanceMultiplier;
        position.vy -= dy * correctionFactor * distanceMultiplier;

        // Hard boundary to prevent wandering too far from original position
        const maxDistance = 150; // Maximum pixels to wander from starting point
        if (distanceFromOrigin > maxDistance) {
          // Force immediate position correction
          position.x =
            position.originalX + (dx / distanceFromOrigin) * maxDistance;
          position.y =
            position.originalY + (dy / distanceFromOrigin) * maxDistance;

          // Reverse velocity to bounce back toward origin
          position.vx = -position.vx * 0.5;
          position.vy = -position.vy * 0.5;
        }
      });

      // Clear only once
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      // Draw background radiance with less intensity
      drawBackgroundRadiance(clampedDelta);

      // Draw all chords and collect their positions
      const chordCenters = [];

      // Sort by z-depth for proper rendering
      const sortedIndices = [...Array(chords.length).keys()]
        .filter((i) => chordPositions.current[i])
        .sort((a, b) => {
          return chordPositions.current[b].z - chordPositions.current[a].z;
        });

      // Draw chords in z-order (back to front)
      for (const i of sortedIndices) {
        const position = chordPositions.current[i];
        if (!position) continue;

        // Skip some far chords for performance
        if (position.z > 120 && i % 2 !== 0) continue;

        const center = drawChord(i, time, clampedDelta);
        if (center) chordCenters.push(center);
      }

      // Draw connections between chords
      drawConnections(chordCenters);

      // Request next frame
      animationFrameId.current = requestAnimationFrame(render);
    };

    // Start animation
    animationFrameId.current = requestAnimationFrame(render);

    // Add click event listener for chord playback - with optimization
    const handleCanvasClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // Find which chord was clicked (if any)
      for (let i = 0; i < chordPositions.current.length; i++) {
        const position = chordPositions.current[i];
        if (!position) continue;

        // Skip checking far chords that would be too small to click
        if (position.z > 150) continue;

        // Calculate distance to chord center (direct)
        const dx = mouseX - position.x;
        const dy = mouseY - position.y;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);

        // Get molecule properties - use actual molecule radius
        const scale = position.displayScale || 400 / (400 + position.z);
        const chord = chords[i];
        const noteCount = chord.notes.length;
        const baseRadius = 25;
        const moleculeRadius =
          (baseRadius + Math.sqrt(noteCount - 3) * 5) * scale;

        // Use actual molecule radius for click detection
        if (distanceToCenter <= moleculeRadius * 1.5) {
          // 1.5x for slightly easier clicking
          playChord(chords[i], i);
          break;
        }
      }
    };

    // Add event listener with passive flag for performance
    canvas.addEventListener("click", handleCanvasClick, { passive: true });

    // Clean up when component unmounts
    return () => {
      // Clean up all timeouts
      Object.values(timeoutIds.current).forEach((id) => clearTimeout(id));

      // Clean up other resources
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      window.removeEventListener("resize", resizeCanvas);
      clearTimeout(resizeTimeout);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return <ChordWebCanvas ref={canvasRef} />;
});

// Add display name to ChordWeb
ChordWeb.displayName = "ChordWeb";

const PricingContainer = styled.section`
  padding: 150px 20px 120px; /* Increased top padding from 120px to 150px */
  background-color: var(--background);
  position: relative;
  overflow: hidden;
  min-height: 1000px; /* Increased from 900px for more vertical space */

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at 80% 20%,
      rgba(108, 99, 255, 0.08),
      transparent 40%
    );
    opacity: 0.6;
    z-index: 0;
  }

  /* Mobile responsive styling */
  @media (max-width: 768px) {
    padding: 100px 10px 80px; /* Reduce padding on mobile */
    min-height: 800px;
  }

  @media (max-width: 480px) {
    padding: 80px 5px 60px; /* Further reduce padding on smaller mobile devices */
    min-height: 700px;
  }
`;

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 3;
  background: linear-gradient(
    rgba(var(--background-rgb), 0.8) 0%,
    rgba(var(--background-rgb), 0.95) 20%,
    rgba(var(--background-rgb), 0.95) 80%,
    rgba(var(--background-rgb), 0.8) 100%
  );
  border-radius: 12px;
  padding: 60px 40px 50px; /* Increased horizontal padding from 10px to 40px */
  box-shadow: 0 0 40px 20px rgba(0, 0, 0, 0.2);
  pointer-events: none; /* Allow clicks to pass through to molecules */

  /* Mobile responsive styling */
  @media (max-width: 768px) {
    padding: 40px 15px 30px; /* Reduce padding on mobile for more space */
    border-radius: 8px;
  }

  @media (max-width: 480px) {
    padding: 30px 10px 25px; /* Further reduce padding on smaller mobile devices */
  }
`;

const SectionTitle = styled.h2`
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 0.8rem;
  margin-top: 20px;
  position: relative;
  pointer-events: none; /* No need for interaction */

  &:after {
    content: "";
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 70px;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    border-radius: 2px;
  }
`;

const SectionSubtitle = styled.p`
  text-align: center;
  color: var(--text-secondary);
  font-size: 1rem;
  max-width: 700px;
  margin: 0 auto 40px;
  pointer-events: none; /* No need for interaction */
`;

// Update the container padding to accommodate the pointer
const BillingToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  position: relative;
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  z-index: 5;
  pointer-events: auto !important; /* Force pointer events */
`;

// Make the buttons larger to fill the width
type BillingToggleButtonProps = {
  $active: boolean;
};

const BillingToggleButton = styled.button<BillingToggleButtonProps>`
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : "transparent"};
  color: ${(props) => (props.$active ? "white" : "var(--text-secondary)")};
  border: ${(props) =>
    props.$active ? "none" : "1px solid rgba(255, 255, 255, 0.2)"};
  border-radius: 30px;
  padding: 12px 10px;
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 6px;
  position: relative;
  flex: 1;
  z-index: 5;
  pointer-events: auto !important; /* Force pointer events */

  &:hover {
    background: ${(props) =>
      props.$active
        ? "linear-gradient(135deg, var(--primary), var(--accent))"
        : "rgba(255, 255, 255, 0.1)"};
    color: ${(props) => (props.$active ? "white" : "var(--text)")};
  }
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SaveLabel = styled.span`
  background: linear-gradient(135deg, var(--accent), var(--primary));
  color: white;
  padding: 3px 7px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
  margin-left: 6px;
`;

// Add new styled components after TrialOption

const RadioButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 15px 0;
`;

const RadioOptionsContainer = styled.div`
  background: rgba(108, 99, 255, 0.05);
  border: 1px solid rgba(108, 99, 255, 0.2);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
`;

const RadioOptionTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text);
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 6px;
    color: var(--primary);
  }
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding: 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-bottom: 5px;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const RadioInput = styled.input`
  position: relative;
  cursor: pointer;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(108, 99, 255, 0.4);
  border-radius: 50%;
  margin-right: 10px;
  outline: none;
  transition: all 0.2s ease;

  &:checked {
    border-color: var(--primary);
    background-color: transparent;
    
    &:after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
    }
  }

  &:hover {
    border-color: var(--primary);
  }
`;

const TrialDescription = styled.span`
  margin-left: 8px;
  flex: 1;
`;

const InfoIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  color: var(--primary);
  cursor: pointer;
  margin-left: 5px;
`;

const TooltipContent = styled.div`
  position: fixed;
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid var(--primary);
  border-radius: 8px;
  padding: 10px 12px;
  width: 240px;
  font-size: 0.8rem;
  color: var(--text);
  z-index: 9999;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const TrialIcon = styled.span`
  margin-right: 8px;
  font-size: 0.9rem;
`;

// Single pricing card
const PricingCard = styled(motion.div)`
  position: relative;
  background-color: rgba(25, 23, 36, 0.6);
  border-radius: 12px;
  overflow: visible; /* Changed from 'hidden' to 'visible' to allow badge overflow */
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  max-width: 400px;
  margin: 0 auto 100px; /* Increased bottom margin from 40px to 100px for more spacing */
  border: 2px solid var(--primary);
  z-index: 5;
  pointer-events: auto !important; /* Force pointer events */

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
  }

  /* Mobile responsive styling */
  @media (max-width: 768px) {
    max-width: 90vw; /* Use 90% of viewport width on mobile */
    margin: 0 auto 60px; /* Reduce bottom margin on mobile */
  }

  @media (max-width: 480px) {
    max-width: 95vw; /* Use 95% of viewport width on smaller mobile devices */
    margin: 0 auto 50px;
  }
`;

const PlanName = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  position: relative;

  .logo-container {
    display: flex;
    align-items: center;
  }

  .pro-label {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--accent);
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-8px);
  }
`;

const CardHeader = styled.div`
  padding: 20px;
  background: linear-gradient(90deg, #000000, #1a1a2e);
  color: white;
  text-align: center;
  position: relative;
  pointer-events: auto !important;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.7),
      rgba(26, 26, 46, 0.3)
    );
  }
`;

const Price = styled.span`
  font-size: 3rem;
  font-weight: 700;
`;

const BillingPeriod = styled.span`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
`;

const CardBody = styled.div`
  padding: 25px 20px;
  background: rgba(30, 28, 42, 0.8);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  z-index: 4; /* Add z-index here too */
  pointer-events: auto !important;
`;

const Divider = styled.hr`
  border: 0;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 15px 0;
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
`;

const Feature = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
`;

const FeatureIcon = styled.span`
  margin-right: 10px;
  color: var(--success);
  font-size: 1rem;
`;

// Simplified particle element - just one subtle accent
const Particle = styled.div`
  position: absolute;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  border-radius: 50%;
  opacity: 0.05;
  z-index: 0;
  filter: blur(20px);
  width: 200px;
  height: 200px;
  bottom: 5%;
  right: 5%;
`;

// Add a new styled component for showing savings info below tabs
const SavingsInfo = styled.div`
  text-align: center;
  margin: 8px auto 20px;
  font-size: 0.95rem;
  color: #f96e46;
  font-weight: 600;
  background: rgba(249, 110, 70, 0.08);
  padding: 8px 15px;
  border-radius: 8px;
  display: inline-block;
  pointer-events: none; /* No need for interaction */

  span {
    font-weight: 700;
    color: #f9c846;
  }
`;

// Add a loader component
const Loader = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-left: 8px;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

// Update the button for checkout with loading state
const CheckoutButton = styled.button<{ $variant?: "primary" | "secondary" }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  background: ${(props) =>
    props.$variant === "secondary"
      ? "rgba(255, 255, 255, 0.1)"
      : "linear-gradient(135deg, var(--primary), var(--accent))"};
  color: ${(props) =>
    props.$variant === "secondary" ? "var(--text)" : "white"};
  padding: 14px 20px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  border: ${(props) =>
    props.$variant === "secondary"
      ? "1px solid rgba(255, 255, 255, 0.2)"
      : "none"};
  transition: all 0.3s ease;
  margin-bottom: ${(props) => (props.$variant === "secondary" ? "0" : "10px")};
  pointer-events: auto !important;

  &:hover {
    background: ${(props) =>
      props.$variant === "secondary"
        ? "rgba(255, 255, 255, 0.15)"
        : "linear-gradient(135deg, var(--accent), var(--primary))"};
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

// Add styled component for price display with discount
const PriceDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
`;

const OriginalPrice = styled.span`
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  margin-bottom: 5px;
`;

const DiscountTag = styled.span`
  background: linear-gradient(135deg, #f9c846, #f96e46);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 10px;
`;

const TrialOptionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 15px;
`;

// Add definitions for the components causing linter errors
const TrialBanner = styled.div`
  background: rgba(108, 99, 255, 0.1);
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 10px;
  padding: 15px 20px;
  margin: 20px auto 30px;
  max-width: 700px;
  pointer-events: none;
`;

const TrialText = styled.div`
  text-align: center;
  
  h3 {
    font-size: 1.3rem;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      margin-right: 8px;
      color: var(--primary);
    }
    
    span {
      background: linear-gradient(135deg, var(--primary), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0 5px;
      font-weight: 700;
    }
  }
  
  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
    line-height: 1.5;
  }
`;

const CardTrialBadge = styled.div`
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 8px 15px;
  border-radius: 30px;
  font-size: 0.9rem;
  font-weight: 600;
  z-index: 5;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const InfoButton = ({ onClick, isActive }: { onClick: () => void; isActive: boolean }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const iconRef = useRef<HTMLDivElement>(null);

  const updateTooltipPosition = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      // Position to the right of the icon
      setTooltipPosition({
        top: rect.top,
        left: rect.right + 10
      });
    }
  };

  useEffect(() => {
    if (showTooltip) {
      updateTooltipPosition();
      window.addEventListener('scroll', updateTooltipPosition);
      window.addEventListener('resize', updateTooltipPosition);
    }
    
    return () => {
      window.removeEventListener('scroll', updateTooltipPosition);
      window.removeEventListener('resize', updateTooltipPosition);
    };
  }, [showTooltip]);

  return (
    <>
      <InfoIcon 
        ref={iconRef} 
        onClick={onClick}
        onMouseEnter={() => {
          setShowTooltip(true);
          updateTooltipPosition();
        }}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <IoInformationCircle size={22} />
      </InfoIcon>
      {showTooltip && typeof document !== 'undefined' && createPortal(
        <TooltipContent style={{ top: tooltipPosition.top + 'px', left: tooltipPosition.left + 'px' }}>
          Credit card required for 14-day trial. You can cancel anytime before the trial ends to avoid being charged.
        </TooltipContent>,
        document.body
      )}
    </>
  );
};

const PricingSection = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  // Get authentication context
  const { user } = useAuth();

  // Track language to force re-render on language change
  const [language, setLanguage] = useState(() => 
    typeof window !== 'undefined' ? i18next.language : 'en'
  );
  
  // Effect to listen for language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      console.log(`Language changed to: ${lng}`);
      setLanguage(lng);
    };
    
    if (typeof window !== 'undefined') {
      i18next.on('languageChanged', handleLanguageChanged);
      return () => {
        i18next.off('languageChanged', handleLanguageChanged);
      };
    }
    return undefined;
  }, []);

  // State to track the selected billing period
  const [billingPeriod, setBillingPeriod] = useState<PlanType>("monthly");
  const [checkoutLoading, setCheckoutLoading] = useState<
    "short" | "long" | null
  >(null);
  // State for prices from Stripe
  const [prices, setPrices] = useState<Record<PlanType, PriceData> | null>(
    null
  );
  const [pricesLoading, setPricesLoading] = useState(true);
  // Set default trial type to 14 days
  const [trialType, setTrialType] = useState<"7day" | "14day">("14day");
  // State for email collection modal
  const [showEmailModal, setShowEmailModal] = useState(false);

  // Reference objects for the buttons
  const monthlyBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const yearlyBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const lifetimeBtnRef = React.useRef<HTMLButtonElement | null>(null);

  // Fetch prices from Stripe on component mount
  useEffect(() => {
    const fetchPrices = async () => {
      setPricesLoading(true);
      try {
        const result = await getPrices();
        if (result.prices) {
          setPrices(result.prices);
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      } finally {
        setPricesLoading(false);
      }
    };

    fetchPrices();
  }, []);

  // Simplify the resize effect to avoid unused variables
  useEffect(() => {
    // Just keep the event listener for resize
    const handleResize = () => {
      // Empty handler that does nothing but satisfies the dependency
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [billingPeriod]);

  // Handle checkout with different trial options
  const handleCheckout = async (collectPaymentMethod: boolean) => {
    if (!prices) return;

    console.log("user", JSON.stringify(user, null, 2));
    // If user is logged in and has Pro, redirect to dashboard instead of checkout
    if (user && user.profile && user.profile.subscription !== "none") {
      router.push("/dashboard");
      return;
    }

    // If user is not logged in and starting a trial, show email collection modal
    if (!user && (trialType === "7day" || trialType === "14day")) {
      setShowEmailModal(true);
      return;
    }

    setCheckoutLoading(collectPaymentMethod ? "long" : "short");

    try {
      const promotionCode = prices[billingPeriod]?.discount?.promotion_code;
      // Ensure customerId is a string or undefined, not null
      const customerId = user?.profile?.customer_id || undefined;
      // Make sure email is a string or undefined, not null
      const userEmail = user?.email || undefined;

      const result = await initiateCheckout(
        billingPeriod,
        userEmail,
        customerId,
        promotionCode,
        collectPaymentMethod
      );

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
      } else if (result.error) {
        console.error("Checkout error:", result.error);
        // Handle error (could add toast notification here)
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Handle email submission from modal
  const handleEmailSubmit = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!prices) return { success: false, error: "Price information is not available" };
    
    try {
      // Check if the customer already exists and has a subscription or prior transactions
      const customerCheck = await checkExistingCustomer(email);
      
      if (customerCheck.error) {
        return { success: false, error: customerCheck.error };
      }
      
      // If the customer has prior transactions, direct them to login
      if (customerCheck.exists && customerCheck.hasPriorTransactions) {
        return { 
          success: false, 
          error: "This email is already associated with an account. Please sign in to continue."
        };
      }
      
      // If we get here, either the customer doesn't exist yet or doesn't have prior transactions
      setShowEmailModal(false);
      setCheckoutLoading(trialType === "14day" ? "long" : "short");

      const promotionCode = prices[billingPeriod]?.discount?.promotion_code;
      const collectPaymentMethod = trialType === "14day";

      const result = await initiateCheckout(
        billingPeriod,
        email,
        undefined,
        promotionCode,
        collectPaymentMethod
      );

      if (result.url) {
        // Redirect to Stripe Checkout
        window.location.href = result.url;
        return { success: true };
      } else if (result.error) {
        console.error("Checkout error:", result.error);
        setCheckoutLoading(null);
        return { success: false, error: result.error };
      }
      
      // If we get here, the checkout was initiated but no URL was returned
      setCheckoutLoading(null);
      return { success: false, error: "Could not create checkout session" };
    } catch (error) {
      console.error("Checkout error:", error);
      setCheckoutLoading(null);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      };
    }
  };

  // Define the plan details based on prices from Stripe
  const currentPlan = prices?.[billingPeriod];

  // Calculate the discounted price if a discount exists
  const getDisplayPrice = (plan: PriceData | undefined) => {
    if (!plan) return { display: "--" };

    const baseAmount = plan.amount / 100;
    let discountedAmount = baseAmount;
    let discountText = "";

    if (plan.discount) {
      if (plan.discount.percent_off) {
        discountedAmount = baseAmount * (1 - plan.discount.percent_off / 100);
        discountText = `${plan.discount.percent_off}% OFF`;
      } else if (plan.discount.amount_off) {
        discountedAmount = baseAmount - plan.discount.amount_off / 100;
        discountText = `$${plan.discount.amount_off / 100} OFF`;
      }
    }

    return {
      display: `$${discountedAmount.toFixed(0)}`,
      original: plan.discount ? `$${baseAmount.toFixed(0)}` : undefined,
      discountText,
    };
  };

  // Translate features
  const features = React.useMemo(() => {
    // If translations exist for features, use them, otherwise use English defaults
    try {
      // Use the correct type for the t function with returnObjects
      const translatedFeatures = t("pricing.features", {
        returnObjects: true
      });
      
      // Check if it's an array and has elements
      if (Array.isArray(translatedFeatures) && translatedFeatures.length > 0) {
        return translatedFeatures;
      }
    } catch (error) {
      console.log("Error loading translated features", error);
    }
    
    // Fallback to English features
    return [
      "Song Builder with Multi-Track Management",
      "Intelligent Pattern Editor & Chord Adaptation",
      "Gestural Harmony Palette Interface",
      "Advanced Voice Leading & Chord Voicings",
      "Interactive Chord Progression Timeline",
      "Complete Voice and Range Control",
      "Standalone App & DAW Plugin Support",
      "Real-Time Chord Reharmonization Tools",
      "Comprehensive Arrangement View",
      "Custom Voicing Generation Engine",
      "Cloud Storage & Project Backups",
      "Premium Support & All Future Updates",
    ];
  }, [t, language]);

  // Get price details for the current plan
  const priceDetails = getDisplayPrice(currentPlan);

  // Period text based on billing period
  const getPeriodText = () => {
    switch (billingPeriod) {
      case "monthly":
        return t("pricing.perMonth", "/month");
      case "annual":
        return t("pricing.perYear", "/year");
      case "lifetime":
        return "";
      default:
        return "";
    }
  };

  // Check if user has completed a trial or has a subscription
  const shouldHideTrialContent = React.useMemo(() => {
    if (!user?.profile) return false;
    
    // Hide trial content if:
    return (
      // User has an active subscription
      user.profile.subscription !== "none" ||
      // User previously had a trial that expired
      (user.profile.trial_expiration && new Date(user.profile.trial_expiration) < new Date()) ||
      // User previously had a subscription that ended
      (user.profile.subscription === "none" && user.profile.subscription_expiration && 
       new Date(user.profile.subscription_expiration) < new Date())
    );
  }, [user]);

  // Determine if we should show trial options
  const showTrialOptions = React.useMemo(() => {
    // Don't show trial options for lifetime plan or if user shouldn't see trial content
    return billingPeriod !== "lifetime" && !shouldHideTrialContent;
  }, [billingPeriod, shouldHideTrialContent]);

  return (
    <PricingContainer id="pricing">
      {/* Render ChordWeb only once on initial mount - won't be affected by state changes */}
      <ChordWeb />
      <Particle />
      <ContentContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle>{t("pricing.simpleTransparent", "Simple, Transparent Pricing")}</SectionTitle>

          {/* Free Trial Banner - Only show if user hasn't completed a trial */}
          {!shouldHideTrialContent && (
            <TrialBanner>
              <TrialText>
                <h3>
                  <FaGift /> {t("pricing.freeTrial.title", "Try FREE for up to 14 days")}
                </h3>
                <p>
                  {t("pricing.freeTrial.description", "Experience all premium features with two trial options.")}
                  <br />
                  {t("pricing.freeTrial.options", "Choose 7 days with no card or 14 days with card on file.")}
                </p>
              </TrialText>
            </TrialBanner>
          )}

          <SectionSubtitle>
            {t("pricing.chooseOption", "Choose the billing option that works best for you.")}
            <br />
            {t("pricing.allFeatures", "All options include full access to all features.")}
          </SectionSubtitle>

          {/* Billing period toggle */}
          <BillingToggleContainer>
            <BillingToggleButton
              ref={monthlyBtnRef}
              $active={billingPeriod === "monthly"}
              onClick={() => setBillingPeriod("monthly")}
            >
              {t("pricing.monthly", "Monthly")}
            </BillingToggleButton>

            <BillingToggleButton
              ref={yearlyBtnRef}
              $active={billingPeriod === "annual"}
              onClick={() => setBillingPeriod("annual")}
            >
              {t("pricing.yearly", "Yearly")}
            </BillingToggleButton>

            <BillingToggleButton
              ref={lifetimeBtnRef}
              $active={billingPeriod === "lifetime"}
              onClick={() => setBillingPeriod("lifetime")}
            >
              {t("pricing.lifetime", "Lifetime")}
            </BillingToggleButton>
          </BillingToggleContainer>

          {/* Savings info based on selected billing period */}
          <div style={{ textAlign: "center" }}>
            {billingPeriod === "monthly" && (
              <SavingsInfo>
                <span>{t("pricing.mostFlexible", "Most Flexible")}</span> - {t("pricing.payMonthly", "Pay month-to-month, cancel anytime")}
              </SavingsInfo>
            )}
            {billingPeriod === "annual" && (
              <SavingsInfo>
                {t("pricing.save", "Save")} <span>25%</span> {t("pricing.withYearlyBilling", "with yearly billing")}
              </SavingsInfo>
            )}
            {billingPeriod === "lifetime" && (
              <SavingsInfo>
                <span>{t("pricing.bestValue", "Best Value")}</span> - {t("pricing.oneTimePayment", "One-time payment, lifetime access")}
              </SavingsInfo>
            )}
          </div>
        </motion.div>

        {/* Single pricing card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <PricingCard>
            {showTrialOptions && (
              <CardTrialBadge>{t("pricing.freeTrial.title", "14-Day Free Trial")}</CardTrialBadge>
            )}
            <CardHeader>
              <PlanName>
                <div className="logo-container">
                  <CymasphereLogo
                    size="40px"
                    fontSize="1.8rem"
                    showText={true}
                    onClick={(e: React.MouseEvent) => e.preventDefault()}
                    href=""
                    className=""
                  />
                  <span className="pro-label">PRO</span>
                </div>
              </PlanName>
              <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>
                {t("pricing.proSolution")}
              </div>

              {pricesLoading ? (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <Loader />
                </div>
              ) : (
                <PriceDisplay>
                  {priceDetails.original && (
                    <OriginalPrice>
                      {priceDetails.original}
                      {getPeriodText()}
                    </OriginalPrice>
                  )}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Price>{priceDetails.display}</Price>
                    <BillingPeriod>{getPeriodText()}</BillingPeriod>
                    {priceDetails.discountText && (
                      <DiscountTag>{priceDetails.discountText}</DiscountTag>
                    )}
                  </div>
                  {billingPeriod === "annual" && currentPlan && (
                    <div style={{ marginTop: "5px", fontSize: "1rem" }}>
                      ${(currentPlan.amount / 100 / 12).toFixed(0)}/
                      {t("pricing.perMonth", "month")} {t("pricing.billed", "billed annually")}
                    </div>
                  )}
                  {billingPeriod === "lifetime" && (
                    <div
                      style={{
                        marginTop: "5px",
                        fontSize: "1rem",
                        opacity: 0.8,
                      }}
                    >
                      {t("pricing.oneTimePurchase", "one-time purchase")}
                    </div>
                  )}
                </PriceDisplay>
              )}
            </CardHeader>

            <CardBody>
              <Divider />
              <h4
                style={{
                  marginBottom: "0.5rem",
                  color: "var(--text)",
                  marginTop: "0",
                }}
              >
                {t("pricing.allPlansInclude", "All Plans Include:")}
              </h4>
              <FeaturesList>
                {features.map((feature, index) => (
                  <Feature key={index}>
                    <FeatureIcon>
                      <FaCheck />
                    </FeatureIcon>
                    {feature}
                  </Feature>
                ))}
              </FeaturesList>

              {showTrialOptions ? (
                <TrialOptionContainer>
                  <RadioOptionsContainer>
                    <RadioOptionTitle>
                      <FaGift /> {t("pricing.freeTrial.chooseFree", "Choose your free trial option:")}
                    </RadioOptionTitle>
                    <RadioButtonGroup>
                      <RadioOption>
                        <RadioInput
                          type="radio"
                          name="trialOption"
                          value="14day"
                          checked={trialType === "14day"}
                          onChange={() => setTrialType("14day")}
                        />
                        <TrialIcon>
                          <FaUnlock />
                        </TrialIcon>
                        <TrialDescription>
                          {t("pricing.freeTrial.withCard", "14-day trial - Add card on file")} <InfoButton onClick={() => {}} isActive={false} />
                          <br />{t("pricing.freeTrial.noCharge", "(won't be charged until trial ends)")}
                        </TrialDescription>
                      </RadioOption>

                      <RadioOption>
                        <RadioInput
                          type="radio"
                          name="trialOption"
                          value="7day"
                          checked={trialType === "7day"}
                          onChange={() => setTrialType("7day")}
                        />
                        <TrialIcon>
                          <FaUnlock />
                        </TrialIcon>
                        <TrialDescription>
                          {t("pricing.freeTrial.noCard", "7-day trial - No credit card required")}
                        </TrialDescription>
                      </RadioOption>
                    </RadioButtonGroup>
                  </RadioOptionsContainer>

                  <CheckoutButton
                    onClick={() => handleCheckout(trialType === "14day")}
                    disabled={pricesLoading || checkoutLoading !== null}
                  >
                    {checkoutLoading !== null ? (
                      <>
                        {t("pricing.processing", "Processing")} <Loader />
                      </>
                    ) : (
                      t("pricing.freeTrial.startTrial", "Start Trial")
                    )}
                  </CheckoutButton>
                </TrialOptionContainer>
              ) : null}

              {/* Only show Buy Now button for Lifetime plan or when trial options are hidden */}
              {(billingPeriod === "lifetime" || !showTrialOptions) && (
                <CheckoutButton
                  onClick={() => handleCheckout(false)}
                  disabled={pricesLoading || checkoutLoading !== null}
                >
                  {checkoutLoading === "short" ? (
                    <>
                      {t("pricing.processing", "Processing")} <Loader />
                    </>
                  ) : (
                    shouldHideTrialContent && user?.profile?.subscription === "none" ? 
                      t("pricing.upgradeNow", "Upgrade Now") : 
                      t("pricing.buyNow", "Buy Now")
                  )}
                </CheckoutButton>
              )}
            </CardBody>
          </PricingCard>
        </motion.div>
      </ContentContainer>

      {/* Show email collection modal if open */}
      {showEmailModal && (
        <EmailCollectionModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          onSubmit={handleEmailSubmit}
          collectPaymentMethod={trialType === "14day"}
          trialDays={trialType === "14day" ? 14 : 7}
        />
      )}
    </PricingContainer>
  );
};

export default PricingSection;
