import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaCheck, FaGift, FaArrowRight } from 'react-icons/fa';
import StripeCheckout from '../checkout/StripeCheckout';
import * as Tone from 'tone'; // Import Tone.js for audio playback

// ChordWeb component for molecular chord background
const ChordWebCanvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1; /* Set BELOW ContentContainer */
  opacity: 1.0; /* Maximum opacity for full visibility */
  cursor: default; /* Use default cursor by default */
  
  /* Hide on mobile devices */
  @media (max-width: 768px) {
    display: none;
  }
`;

// Note frequencies (simplified for demonstration)
const noteFrequencies = {
  'C': 261.63, 'C#': 277.18, 'Db': 277.18, 'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'Gb': 369.99, 'G': 392.00, 'G#': 415.30, 
  'Ab': 415.30, 'A': 440.00, 'A#': 466.16, 'Bb': 466.16, 'B': 493.88
};

// Memoize the ChordWeb component to prevent re-renders when parent state changes
const ChordWeb = React.memo(() => {
  const canvasRef = useRef(null);
  const requestIdRef = useRef(null);
  const positionsInitialized = useRef(false);
  const synth = useRef(null);
  const activeChords = useRef(new Set()); // Track currently playing chords
  const timeoutIds = useRef({}); // Store timeout IDs for cleanup
  const currentTime = useRef(0); // Add a ref to store the current animation time
  
  // Initialize Tone.js synth
  useEffect(() => {
    // Create a more ambient synth sound with underwater qualities
    const ambientSynth = new Tone.PolySynth(Tone.AMSynth, {
      oscillator: {
        type: 'sine',
        modulationType: 'triangle' // Changed to triangle for more underwater harmonics
      },
      envelope: {
        attack: 0.5, // Slower attack for underwater muffled effect
        decay: 3,    // Longer decay
        sustain: 0.6, // Higher sustain
        release: 8    // Much longer release for underwater trail
      },
      modulation: {
        type: 'sine',
        frequency: 0.8 // Slower frequency for underwater wavering
      },
      modulationEnvelope: {
        attack: 0.8,  // Slower modulation attack
        decay: 1.5,   // Longer decay
        sustain: 0.4,
        release: 10   // Much longer release
      }
    });
    
    // Create lowpass filter for underwater muffled effect
    const filter = new Tone.Filter({
      type: "lowpass",
      frequency: 800, // Low frequency cutoff for underwater effect
      Q: 1.5,
      rolloff: -24
    });
    
    // Create reverb effect with longer decay for underwater spaciousness
    const reverb = new Tone.Reverb({
      decay: 16,     // Increased from 12 for more underwater echo
      wet: 0.98,     // Higher wet mix
      preDelay: 0.2  // Slightly higher preDelay
    }).toDestination();
    
    // Create a volume node to reduce gain
    const volume = new Tone.Volume(-14); // Slightly higher volume
    
    // Add vibrato for underwater wavering
    const vibrato = new Tone.Vibrato({
      frequency: 1.5, // Slow vibrato
      depth: 0.3      // Moderate depth
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
  const playChord = (chord, chordIndex) => {
    // Check if we've reached the maximum number of simultaneous chords (4)
    if (activeChords.current.size >= 4 && !activeChords.current.has(chordIndex)) {
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
    const notes = chord.notes.map((note, index) => {
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
    if (Tone.context.state !== 'running') {
      Tone.start().then(() => {
        playNotes(notes, chordIndex);
      });
    } else {
      playNotes(notes, chordIndex);
    }
    
    function playNotes(notes, chordIndex) {
      // Play chord for longer duration (2n = half note) to let reverb shine
      synth.current.triggerAttackRelease(notes, "2n");
      
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
  };
  
  // Reduce number of chords for better performance
  const chords = [
    // Evenly distributed chord types (triads, 7ths, 9ths, 11ths, 13ths)
    { name: 'C', notes: ['C', 'E', 'G'], color: 'rgba(128, 119, 255, 0.9)' },             // C major triad
    { name: 'Bb7sus4', notes: ['Bb', 'Eb', 'F', 'Ab'], color: 'rgba(255, 210, 80, 0.9)' }, // Eb major sus4
    { name: 'Dmaj9', notes: ['D', 'F#', 'A', 'C#', 'E'], color: 'rgba(150, 230, 255, 0.95)' }, // C major 9th
    { name: 'Gm', notes: ['G', 'Bb', 'D'], color: 'rgba(255, 130, 90, 0.9)' },           // Eb major triad
    { name: 'Cmaj13', notes: ['C', 'E', 'G', 'B', 'D', 'A'], color: 'rgba(160, 255, 220, 0.95)' }, // C major 13th
    { name: 'Ebm9', notes: ['Eb', 'Gb', 'Bb', 'Db', 'F'], color: 'rgba(150, 230, 255, 0.95)' }, // Eb major 9th
    { name: 'Dm', notes: ['D', 'F', 'A'], color: 'rgba(128, 119, 255, 0.9)' },           // C major triad
    { name: 'Fmaj7(#11)', notes: ['F', 'A', 'C', 'E', 'G', 'B'], color: 'rgba(255, 200, 70, 0.95)' }, // C major 7th with #11
    { name: 'G7sus4', notes: ['G', 'C', 'D', 'F'], color: 'rgba(255, 210, 80, 0.9)' },   // C major sus4
    { name: 'Eb', notes: ['Eb', 'G', 'Bb'], color: 'rgba(255, 130, 90, 0.9)' },          // Eb major triad
    { name: 'Am11', notes: ['A', 'C', 'E', 'G', 'B', 'D'], color: 'rgba(255, 200, 70, 0.95)' }, // C major 11th
    { name: 'Fmaj7', notes: ['F', 'A', 'C', 'E'], color: 'rgba(90, 255, 140, 0.9)' },    // C major 7th
    { name: 'Abmaj13', notes: ['Ab', 'C', 'Eb', 'G', 'Bb', 'F'], color: 'rgba(160, 255, 220, 0.95)' }, // Eb major 13th
    { name: 'Cmaj7', notes: ['C', 'E', 'G', 'B'], color: 'rgba(90, 255, 140, 0.9)' }     // C major 7th
  ];
  
  // Define positions for each chord molecule
  const chordPositions = useRef([]);
  
  // Animation properties
  const animationSpeed = 0.0003; /* Reduced from 0.0006 for gentler animation */
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { alpha: true });
    let time = 0;
    let animationFrameId;
    let lastFrameTime = 0;
    let resizeTimeout;
    
    // Optimize canvas attributes for performance
    context.imageSmoothingQuality = 'low';
    context.globalCompositeOperation = 'lighter';

    // Add mousemove listener to change cursor when hovering over molecules
    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      let isOverMolecule = false;
      
      // Find if mouse is over any chord molecule
      for (let i = 0; i < chordPositions.current.length; i++) {
        const position = chordPositions.current[i];
        if (!position) continue;
        
        // Calculate distance to chord center
        const dx = mouseX - position.x;
        const dy = mouseY - position.y;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Get molecule properties - use actual molecule radius
        const scale = position.displayScale || 400 / (400 + position.z);
        const chord = chords[i];
        const noteCount = chord.notes.length;
        const baseRadius = 25;
        const moleculeRadius = (baseRadius + Math.sqrt(noteCount - 3) * 5) * scale;
        
        // Use actual molecule radius for hover detection
        if (distanceToCenter <= moleculeRadius * 1.5) { // 1.5x for slightly easier hovering
          isOverMolecule = true;
          position.isHovering = true;
        } else {
          position.isHovering = false;
        }
      }
      
      // Update cursor style based on whether mouse is over a molecule
      canvas.style.cursor = isOverMolecule ? 'pointer' : 'default';
    };
    
    // Add event listener for mousemove
    canvas.addEventListener('mousemove', handleMouseMove);

    // Set canvas dimensions with debouncing
    const resizeCanvas = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        
        // Set display size (css pixels)
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        
        // Set actual size in memory (scaled for device pixel ratio)
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        
        // Scale context to match dpr
        context.scale(dpr, dpr);
        
        // Only initialize positions once to prevent jumping
        if (!positionsInitialized.current) {
          initializePositions(width, height);
          positionsInitialized.current = true;
        }
      }, 250); // 250ms debounce
    };
    
    const initializePositions = (width, height) => {
      // Define center safe zone - no molecules in this area
      const centerX = width / 2;
      const centerY = height / 2;
      const safeZoneWidth = width * 0.7;
      const safeZoneHeight = height * 0.8;
      
      // Position chord molecules in an evenly distributed pattern
      const allPositions = [];
      
      // Place chords evenly around the edges of the safe zone with some randomness
      const totalChords = chords.length;
      const angleStep = (2 * Math.PI) / totalChords;
      
      chords.forEach((chord, index) => {
        // Consider chords with 5+ notes "complex"
        const isComplex = chord.notes.length >= 5;
        
        // Calculate position along a rough ellipse around the content
        const angle = index * angleStep + (Math.random() * 0.3 - 0.15); // Add slight randomness to angle
        
        // Elliptical distribution with some randomness
        const radiusX = width * 0.35 + (Math.random() * 0.1 - 0.05) * width; // Reduced from 0.45 to bring molecules closer
        const radiusY = height * 0.35 + (Math.random() * 0.1 - 0.05) * height; // Reduced from 0.45 to bring molecules closer
        
        const x = centerX + Math.cos(angle) * radiusX;
        const y = centerY + Math.sin(angle) * radiusY;
        
        // Randomize movement properties - higher velocity for visibility
        const movementSpeed = isComplex ? 
          0.03 + Math.random() * 0.03 : // Reduced range for more consistent motion
          0.04 + Math.random() * 0.04; // Reduced range for more consistent motion
        
        // Use smaller z-depth range for better visibility
        const zDepth = isComplex ? 
          10 + Math.random() * 40 : // More visible
          20 + Math.random() * 60; // More varied depth
        
        allPositions.push({
          x,
          y,
          z: zDepth,
          vx: (Math.random() - 0.5) * movementSpeed,
          vy: (Math.random() - 0.5) * movementSpeed,
          vz: (Math.random() - 0.5) * 0.05,
          rotationOffset: Math.random() * Math.PI * 2,
          pulseSpeed: 0.3 + Math.random() * 0.5,
          pulsePhase: Math.random() * Math.PI * 2,
          wigglePhase: Math.random() * Math.PI * 2,
          lastVisibilityChange: 0,
          baseAngle: angle, // Store original angle for maintaining distribution
          originalX: x, // Store original position to keep molecules from drifting too far
          originalY: y,
          radiusX, // Store ellipse dimensions
          radiusY
        });
      });
      
      // Assign all positions
      chordPositions.current = allPositions;
    };
    
    // Initial resize
    resizeCanvas();
    
    // Throttled resize event listener
    window.addEventListener('resize', resizeCanvas);
    
    // Draw a note (atom) with 3D effect - simplified for performance
    const drawNote = (x, y, z, noteName, color, time, index, totalNotes) => {
      // Scale based on z-depth (perspective)
      const scale = 400 / (400 + z);
      const size = 8 * scale; // Increased from 6 for better visibility
      
      // Simplified pulsing to improve performance
      const pulse = 1 + Math.sin(time * 2 + index * 0.5) * 0.2; // Increased from 0.15
      
      // Stronger glow effect for better visibility
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
      context.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      context.lineWidth = 1 * scale;
      context.stroke();
      
      // Only draw text if note is large enough (optimization)
      if (size > 3.5) {
        // Note name (small label)
        context.font = `bold ${8 * scale}px Arial`; // Made font bold and slightly larger
        context.fillStyle = 'rgba(255, 255, 255, 1)'; // Full opacity
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(noteName, x, y);
      }
      
      // Reset shadow
      context.shadowBlur = 0;
    };
    
    // Draw a chord (molecule) with 3D effect - simplified for performance
    const drawChord = (chordIndex, time, deltaTime) => {
      const chord = chords[chordIndex];
      const position = chordPositions.current[chordIndex];
      
      if (!position) return;
      
      // Move the chord position with 3D effect - scale by deltaTime for consistent speed
      // Use gentle velocity updates
      position.x += position.vx * deltaTime * 8; // Reduced from 15 for gentler movement
      position.y += position.vy * deltaTime * 8; // Reduced from 15 for gentler movement
      position.z += position.vz * deltaTime * 5; // Kept lower for z-axis
      
      // Get canvas size for boundary checking
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      // Bounce off the edges with gentle velocity changes
      if (position.x < width * 0.05) {
        position.vx = Math.abs(position.vx) * 0.5; // Gentle bounce
        position.x = width * 0.05; // Prevent getting stuck at the boundary
      } else if (position.x > width * 0.95) {
        position.vx = -Math.abs(position.vx) * 0.5; // Gentle bounce
        position.x = width * 0.95; // Prevent getting stuck at the boundary
      }
      
      if (position.y < height * 0.05) {
        position.vy = Math.abs(position.vy) * 0.5; // Gentle bounce
        position.y = height * 0.05; // Prevent getting stuck at the boundary
      } else if (position.y > height * 0.95) {
        position.vy = -Math.abs(position.vy) * 0.5; // Gentle bounce
        position.y = height * 0.95; // Prevent getting stuck at the boundary
      }
      
      // Z-axis bounds with gentle correction
      if (position.z < 0) {
        position.vz = Math.abs(position.vz) * 0.5;
        position.z = 0;
      } else if (position.z > 200) {
        position.vz = -Math.abs(position.vz) * 0.5;
        position.z = 200;
      }
      
      // Stay out of the center area
      const centerX = width / 2;
      const centerY = height / 2;
      const safeZoneWidth = width * 0.7; 
      const safeZoneHeight = height * 0.8;
      
      // If entering safe zone, push away with stronger force (less expensive collision detection)
      if (Math.abs(position.x - centerX) < safeZoneWidth / 2 && 
          Math.abs(position.y - centerY) < safeZoneHeight / 2) {
        const distToLeft = position.x - (centerX - safeZoneWidth / 2);
        const distToRight = (centerX + safeZoneWidth / 2) - position.x;
        const distToTop = position.y - (centerY - safeZoneHeight / 2);
        const distToBottom = (centerY + safeZoneHeight / 2) - position.y;
        
        const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
        
        // Apply stronger repulsion with additional velocity - gentler version
        if (minDist === distToLeft) {
          position.vx = (-Math.abs(position.vx) - 0.02 * deltaTime * 10) * 0.7; // Damped repulsion
          // Gently move outside safe zone
          position.x = Math.min(position.x, centerX - safeZoneWidth/2 - 2);
        } else if (minDist === distToRight) {
          position.vx = (Math.abs(position.vx) + 0.02 * deltaTime * 10) * 0.7; // Damped repulsion
          position.x = Math.max(position.x, centerX + safeZoneWidth/2 + 2);
        } else if (minDist === distToTop) {
          position.vy = (-Math.abs(position.vy) - 0.02 * deltaTime * 10) * 0.7; // Damped repulsion
          position.y = Math.min(position.y, centerY - safeZoneHeight/2 - 2);
        } else {
          position.vy = (Math.abs(position.vy) + 0.02 * deltaTime * 10) * 0.7; // Damped repulsion
          position.y = Math.max(position.y, centerY + safeZoneHeight/2 + 2);
        }
      }
      
      // Get canvas size for reference
      // Calculate scale and radius for collision detection
      const scale = 400 / (400 + position.z);
      const pulse = Math.sin(time * position.pulseSpeed + position.pulsePhase) * 0.15 + 1;
      const noteCount = chord.notes.length;
      const baseRadius = 25;
      const radius = (baseRadius + Math.sqrt(noteCount - 3) * 5) * scale;
      
      // Store radius and position for collision detection
      position.displayRadius = radius;
      position.displayScale = scale;
      
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
        const minDistance = position.displayRadius + otherPosition.displayRadius + 20; // Increased padding
        
        // If overlapping, push away
        if (distance < minDistance) {
          // Direction vector
          const nx = dx / distance || 0;
          const ny = dy / distance || 0;
          
          // Overlap amount - push harder when overlapping more
          const overlap = (minDistance - distance) * 0.8; // Increased from 0.5 to 0.8
          
          // Scale repulsion by z-depth - closer chords (lower z) push harder
          const zFactor = 1 - Math.min(0.8, zDiff / 100);
          
          // Apply stronger repulsion forces with elasticity (reduced speeds)
          position.vx += nx * overlap * 0.01 * zFactor; // Very gentle repulsion
          position.vy += ny * overlap * 0.01 * zFactor; // Very gentle repulsion
          
          // Add elasticity bounce effect (reduced rebound)
          position.vx = position.vx * 0.95 + nx * Math.abs(position.vx) * 0.15; // More damping
          position.vy = position.vy * 0.95 + ny * Math.abs(position.vy) * 0.15; // More damping
          
          // Cap maximum velocity to ensure super slow movement
          const maxVelocity = 0.03; // Very low max velocity
          position.vx = Math.max(-maxVelocity, Math.min(maxVelocity, position.vx));
          position.vy = Math.max(-maxVelocity, Math.min(maxVelocity, position.vy));
          position.vz = Math.max(-0.01, Math.min(0.01, position.vz)); // Minimal z-axis movement
          
          // More aggressive immediate position correction to prevent overlaps
          position.x += nx * overlap * 0.05; // Reduced from 0.1
          position.y += ny * overlap * 0.05; // Reduced from 0.1
          
          // Visual feedback for collision - briefly increase pulse
          position.collisionTime = time;
        }
      }
      
      // Add visual pulse effect when collision occurs
      let collisionPulse = 0;
      if (position.collisionTime && time - position.collisionTime < 0.5) {
        collisionPulse = 0.3 * (1 - (time - position.collisionTime) / 0.5);
      }
      
      // Simplified pulse for performance
      const rotationAngle = time * 0.5 + position.rotationOffset;
      
      // Simplified glow - only draw if object is large enough
      if (scale > 0.6) {
        // Add a background glow effect for the entire chord
        const glowRadius = 20 * scale * (pulse + collisionPulse);
        context.beginPath();
        const gradient = context.createRadialGradient(
          position.x, position.y, 0,
          position.x, position.y, glowRadius
        );
        
        // Change glow color based on playing state
        let glowColor;
        if (position.playingTime && time - position.playingTime < 5) {
          // Ethereal glow that fades slowly for reverb effect
          const playFactor = Math.pow(1 - (time - position.playingTime) / 5, 1.2);
          glowColor = chord.color.replace('0.9', (0.5 * playFactor + 0.2).toString());
        } else if (position.collisionTime && time - position.collisionTime < 0.5) {
          glowColor = chord.color.replace('0.9', '0.35'); // Brighter during collision 
        } else {
          glowColor = chord.color.replace('0.9', '0.2');
        }
          
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        context.fillStyle = gradient;
        
        // Larger glow radius when playing to match reverb effect
        const displayRadius = position.playingTime && time - position.playingTime < 5 
          ? glowRadius * (1.5 + Math.sin(time * 2) * 0.2) // Pulsing effect for playing
          : glowRadius;
          
        context.arc(position.x, position.y, displayRadius, 0, Math.PI * 2);
        context.fill();
        
        // Draw clickable area circle around molecule
        const clickableRadius = radius * 3; // Reduced from 5 to 3 for smaller circles
        
        // Don't display the circle outline visually, but keep the clickable area
        // context.beginPath();
        // context.arc(position.x, position.y, clickableRadius, 0, Math.PI * 2);
        // context.setLineDash([5, 3]);
        // context.stroke();
        // context.setLineDash([]); // Reset line dash
        
        // Draw chord name with "Click to play" indicator when hovering
        if (scale > 0.7) {
          // Draw chord name with 3D effect - position further away from the molecule
          const nameOffset = radius + 15 * scale;
          
          context.font = `${12 * scale}px Arial`;
          context.fillStyle = 'rgba(255, 255, 255, 0.9)'; 
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          
          // Show playing status with reverb indicator
          if (position.playingTime && time - position.playingTime < 5) {
            const fadePhase = (time - position.playingTime) / 5;
            context.fillText(chord.name, position.x, position.y - nameOffset);
          } else {
            context.fillText(chord.name, position.x, position.y - nameOffset);
          }
        }
      }
      
      const notePositions = chord.notes.map((note, index) => {
        // 3D rotation effect
        const angle = (index / noteCount) * Math.PI * 2;
        const x3d = Math.cos(angle) * radius;
        const y3d = Math.sin(angle) * radius;
        
        // Apply 3D rotation
        const rotatedX = x3d * Math.cos(rotationAngle) - y3d * Math.sin(rotationAngle);
        const rotatedY = x3d * Math.sin(rotationAngle) + y3d * Math.cos(rotationAngle);
        
        return {
          x: position.x + rotatedX,
          y: position.y + rotatedY,
          z: position.z,
          note
        };
      });
      
      // Draw lines connecting notes (bonds) with glow effect BEFORE drawing notes
      if (scale > 0.5) {
        context.shadowColor = chord.color;
        
        // Enhanced glow for playing chords
        const playingEffect = position.playingTime && time - position.playingTime < 5
          ? 3 * Math.pow(1 - (time - position.playingTime) / 5, 1.5) // Stronger glow that fades with reverb
          : 0;
          
        context.shadowBlur = 3 * scale * (1 + (collisionPulse + playingEffect) * 2);
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
          lineOpacity = 0.5 + 0.4 * Math.pow(1 - (time - position.playingTime) / 5, 1.2);
        } else if (position.collisionTime && time - position.collisionTime < 0.5) {
          lineOpacity = 0.7; // Bright during collision
        } else {
          lineOpacity = 0.5; // Normal state
        }
        
        context.strokeStyle = `rgba(255, 255, 255, ${lineOpacity})`;
        context.lineWidth = 1.2 * scale * (pulse + (collisionPulse + playingEffect) * 0.5);
        context.stroke();
        context.shadowBlur = 0;
      }
      
      // Draw notes AFTER drawing the connecting lines
      notePositions.forEach((notePos, index) => {
        drawNote(notePos.x, notePos.y, notePos.z, notePos.note, chord.color, time, index, noteCount);
      });
      
      // Return center position for web connections with z-depth
      return { 
        x: position.x, 
        y: position.y, 
        z: position.z, 
        radius: 20 * scale * pulse,
        noteCount: noteCount,
        color: chord.color,
        scale: scale
      };
    };
    
    // Draw connections between chord molecules - fewer connections for performance
    const drawConnections = (positions) => {
      const validPositions = positions.filter(p => p);
      
      // Only draw connections for closer objects (performance optimization)
      const sortedPositions = [...validPositions]
        .filter(p => p.scale > 0.4) // Only include more visible chords
        .sort((a, b) => a.z - b.z)
        .slice(0, 8); // Limit to 8 closest chords
      
      // Limit the number of connections (performance optimization)
      const maxConnections = 8;
      let connectionCount = 0;
      
      for (let i = 0; i < sortedPositions.length && connectionCount < maxConnections; i++) {
        for (let j = i + 1; j < sortedPositions.length && connectionCount < maxConnections; j++) {
          const pos1 = sortedPositions[i];
          const pos2 = sortedPositions[j];
          
          // Calculate 3D distance
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const dz = pos2.z - pos1.z;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const distance3d = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          // Use consistent connection threshold
          const connectionThreshold = 300;
          
          // Only connect if close enough
          if (distance3d < connectionThreshold) {
            connectionCount++;
            
            // Opacity based on distance and perspective
            const opacity = (1 - (distance3d / connectionThreshold)) * Math.min(pos1.scale, pos2.scale);
            
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
    
    // Simplified background radiance effect
    const drawBackgroundRadiance = (deltaTime) => {
      // Reduce to only 2 glow spots for performance
      const glowSpots = [
        { x: canvas.clientWidth * 0.1, y: canvas.clientHeight * 0.1, size: 250, color: 'rgba(108, 99, 255, 0.08)' }, // Increased from 0.04
        { x: canvas.clientWidth * 0.9, y: canvas.clientHeight * 0.9, size: 250, color: 'rgba(249, 110, 70, 0.08)' } // Increased from 0.04
      ];
      
      // Draw spots with less GPU-intensive gradients
      glowSpots.forEach(spot => {
        const pulse = 0.8 + Math.sin(time * 0.5) * 0.2;
        context.beginPath();
        const gradient = context.createRadialGradient(
          spot.x, spot.y, 0,
          spot.x, spot.y, spot.size * pulse
        );
        gradient.addColorStop(0, spot.color.replace('0.08', '0.12')); // Increased from 0.06
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        context.fillStyle = gradient;
        context.arc(spot.x, spot.y, spot.size * pulse, 0, Math.PI * 2);
        context.fill();
      });
    };
    
    // Frame rate throttling - aim for steady 30 FPS
    const targetFPS = 20; // Increased from 15 for smoother animation
    const frameInterval = 1000 / targetFPS;
    let lastFrameTimestamp = 0;
    
    // Animation loop with performance optimizations
    const render = (timestamp) => {
      // Skip frames to maintain target framerate
      const elapsed = timestamp - lastFrameTimestamp;
      if (elapsed < frameInterval) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      
      lastFrameTimestamp = timestamp - (elapsed % frameInterval);
      const deltaTime = Math.min(0.05, elapsed / 1000);
      
      time += animationSpeed * deltaTime * 60;
      currentTime.current = time; // Update the time ref with the current animation time
      
      // Get canvas dimensions
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      
      // Simple update for all positions
      chordPositions.current.forEach(position => {
        if (!position) return;
        
        // Apply wiggle effect to velocity - reduced for more gentle movement
        const wiggleX = Math.sin(time * 0.8 + position.wigglePhase) * 0.01; // Reduced speed and amplitude
        const wiggleY = Math.cos(time * 0.7 + position.wigglePhase) * 0.01; // Reduced speed and amplitude
        
        // Add wiggle with damping to prevent accumulation
        position.vx = position.vx * 0.98 + wiggleX; // 2% damping
        position.vy = position.vy * 0.98 + wiggleY; // 2% damping
        
        // Ensure minimum velocity (never completely stop)
        const minVelocity = 0.02; // Reduced from 0.05
        const maxVelocity = 0.1;  // Reduced from 0.2
        
        // Normalize velocity if below minimum - with gentler transition
        if (Math.abs(position.vx) < minVelocity) {
          // Gradually increase toward minimum instead of jumping
          position.vx += (position.vx >= 0 ? 1 : -1) * 0.001;
        }
        if (Math.abs(position.vy) < minVelocity) {
          // Gradually increase toward minimum instead of jumping
          position.vy += (position.vy >= 0 ? 1 : -1) * 0.001;
        }
        
        // Cap maximum velocity with damping for smooth transitions
        if (Math.abs(position.vx) > maxVelocity) {
          position.vx = (position.vx > 0 ? maxVelocity : -maxVelocity) * 0.95 + position.vx * 0.05;
        }
        if (Math.abs(position.vy) > maxVelocity) {
          position.vy = (position.vy > 0 ? maxVelocity : -maxVelocity) * 0.95 + position.vy * 0.05;
        }
        
        // Add gentle force to maintain original even distribution
        // Calculate current distance from original position
        const dx = position.x - position.originalX;
        const dy = position.y - position.originalY;
        const distanceFromOrigin = Math.sqrt(dx * dx + dy * dy);
        
        // Very gentle correction that increases with distance
        const correctionFactor = 0.00015; // Very small value for extremely gentle correction
        position.vx -= dx * correctionFactor;
        position.vy -= dy * correctionFactor;
      });
      
      // Clear only once
      context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      
      // Draw background radiance with less intensity
      drawBackgroundRadiance(deltaTime);
      
      // Draw all chords and collect their positions
      const chordCenters = [];
      
      // Only process visible chords - skip every other chord when far away
      for (let i = 0; i < chords.length; i++) {
        const position = chordPositions.current[i];
        if (!position) continue;
        
        // Skip some far chords for performance
        if (position.z > 120 && i % 2 !== 0) continue;
        
        const center = drawChord(i, time, deltaTime);
        if (center) chordCenters.push(center);
      }
      
      // Draw connections between chords
      drawConnections(chordCenters);
      
      animationFrameId = requestAnimationFrame(render);
    };
    
    // Start animation
    animationFrameId = requestAnimationFrame(render);
    
    // Add click event listener for chord playback
    const handleCanvasClick = (event) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      // Find which chord was clicked (if any)
      for (let i = 0; i < chordPositions.current.length; i++) {
        const position = chordPositions.current[i];
        if (!position) continue;
        
        // Calculate distance to chord center (direct)
        const dx = mouseX - position.x;
        const dy = mouseY - position.y;
        const distanceToCenter = Math.sqrt(dx * dx + dy * dy);
        
        // Get molecule properties - use actual molecule radius
        const scale = position.displayScale || 400 / (400 + position.z);
        const chord = chords[i];
        const noteCount = chord.notes.length;
        const baseRadius = 25;
        const moleculeRadius = (baseRadius + Math.sqrt(noteCount - 3) * 5) * scale;
        
        // Use actual molecule radius for click detection
        if (distanceToCenter <= moleculeRadius * 1.5) { // 1.5x for slightly easier clicking
          playChord(chords[i], i);
          break;
        }
      }
    };
    
    // Add event listener
    canvas.addEventListener('click', handleCanvasClick);
    
    // Clean up when component unmounts
    return () => {
      // Clean up all timeouts
      Object.values(timeoutIds.current).forEach(id => clearTimeout(id));
      
      // Clean up other resources
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      clearTimeout(resizeTimeout);
    };
  }, []); // Empty dependency array means this effect runs once on mount
  
  return <ChordWebCanvas ref={canvasRef} />;
});

const PricingContainer = styled.section`
  padding: 150px 20px 120px; /* Increased top padding from 120px to 150px */
  background-color: var(--background);
  position: relative;
  overflow: hidden;
  min-height: 1000px; /* Increased from 900px for more vertical space */
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 80% 20%, rgba(108, 99, 255, 0.08), transparent 40%);
    opacity: 0.6;
    z-index: 0;
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
  padding: 60px 10px 50px;
  box-shadow: 0 0 40px 20px rgba(0, 0, 0, 0.2);
  pointer-events: none; /* Allow clicks to pass through to molecules */
`;

const SectionTitle = styled.h2`
  font-size: 2.2rem;
  text-align: center;
  margin-bottom: 0.8rem;
  margin-top: 20px;
  position: relative;
  pointer-events: none; /* No need for interaction */
  
  &:after {
    content: '';
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
const BillingToggleButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--text-secondary)'};
  border: ${props => props.$active ? 'none' : '1px solid rgba(255, 255, 255, 0.2)'};
  border-radius: 30px;
  padding: 12px 10px;
  font-weight: ${props => props.$active ? '600' : '400'};
  font-size: 1.05rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 6px;
  position: relative;
  flex: 1;
  z-index: 5;
  pointer-events: auto !important; /* Force pointer events */
  
  &:hover {
    background: ${props => props.$active ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'rgba(255, 255, 255, 0.1)'};
    color: ${props => props.$active ? 'white' : 'var(--text)'};
  }
`;

const SaveLabel = styled.span`
  background: linear-gradient(135deg, var(--accent), var(--primary));
  color: white;
  padding: 3px 7px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
  margin-left: 6px;
`;

// Add new styled components for the free trial
const TrialBanner = styled.div`
  background: linear-gradient(135deg, rgba(249, 200, 70, 0.1), rgba(249, 110, 70, 0.1));
  border-radius: 10px;
  padding: 12px 20px;
  margin: 20px auto 30px;
  max-width: 650px;
  text-align: center;
  border: 1px solid rgba(249, 200, 70, 0.3);
  position: relative;
  overflow: hidden;
  pointer-events: none; /* No need for interaction */
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, rgba(249, 200, 70, 0.05), rgba(249, 110, 70, 0.05));
    z-index: 0;
  }
`;

const TrialText = styled.div`
  position: relative;
  z-index: 1;
  
  h3 {
    font-size: 1.4rem;
    margin: 0 0 5px;
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    
    svg {
      margin-right: 10px;
      color: #F96E46;
    }
    
    span {
      background: linear-gradient(90deg, #F9C846, #F96E46);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-weight: 700;
      margin: 0 5px;
    }
  }
  
  p {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }
`;

const TrialBadge = styled.div`
  position: absolute;
  top: -15px;
  right: -15px;
  background: linear-gradient(90deg, #F9C846, #F96E46);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(249, 110, 70, 0.3);
  z-index: 2;
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
`;

const CardHeader = styled.div`
  padding: 20px;
  background: linear-gradient(90deg, #000000, #1a1a2e);
  color: white;
  text-align: center;
  position: relative;
  pointer-events: auto !important;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(90deg, rgba(0, 0, 0, 0.7), rgba(26, 26, 46, 0.3));
  }
`;

const PlanName = styled.h3`
  font-size: 1.8rem;
  margin-bottom: 5px;
  font-weight: 700;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
`;

const LogoImage = styled.img`
  height: 40px;
  width: 40px;
  margin-right: 10px;
  transition: transform 0.3s ease;
`;

const LogoText = styled.span`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  
  span {
    font-family: 'Montserrat', sans-serif;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const PlanPrice = styled.div`
  margin: 10px 0;
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
  color: #F96E46;
  font-weight: 600;
  background: rgba(249, 110, 70, 0.08);
  padding: 8px 15px;
  border-radius: 8px;
  display: inline-block;
  pointer-events: none; /* No need for interaction */
  
  span {
    font-weight: 700;
    color: #F9C846;
  }
`;

const PricingSection = () => {
  // State to track the selected billing period
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  
  // State to track the pointer position
  const [pointerTop, setPointerTop] = useState(0);
  
  // Reference objects for the buttons
  const monthlyBtnRef = React.useRef(null);
  const yearlyBtnRef = React.useRef(null);
  const lifetimeBtnRef = React.useRef(null);
  
  // Update pointer position when billing period changes
  useEffect(() => {
    const updatePointerPosition = () => {
      let currentRef;
      switch(billingPeriod) {
        case 'monthly':
          currentRef = monthlyBtnRef.current;
          break;
        case 'yearly':
          currentRef = yearlyBtnRef.current;
          break;
        case 'lifetime':
          currentRef = lifetimeBtnRef.current;
          break;
        default:
          currentRef = monthlyBtnRef.current;
      }
      
      if (currentRef) {
        const buttonRect = currentRef.getBoundingClientRect();
        const containerRect = currentRef.parentElement.getBoundingClientRect();
        const relativeTop = buttonRect.top - containerRect.top + buttonRect.height/2 - 10;
        setPointerTop(relativeTop);
      }
    };
    
    // Update position after render
    updatePointerPosition();
    
    // Also update on window resize
    window.addEventListener('resize', updatePointerPosition);
    return () => window.removeEventListener('resize', updatePointerPosition);
  }, [billingPeriod]);

  // Define the plan details for each billing period
  const planOptions = {
    monthly: {
      name: "Cymasphere Pro",
      price: "8",
      period: "/month",
      buttonText: "Start Free Trial",
      priceId: process.env.REACT_APP_STRIPE_PRICE_MONTHLY || "price_monthly",
      isSubscription: true,
      trialDays: 14
    },
    yearly: {
      name: "Cymasphere Pro",
      price: "69",
      period: "/year",
      monthlyPrice: "$6/month",
      buttonText: "Start Free Trial",
      priceId: process.env.REACT_APP_STRIPE_PRICE_YEARLY || "price_yearly",
      isSubscription: true,
      trialDays: 14
    },
    lifetime: {
      name: "Cymasphere Pro",
      price: "199",
      period: "",
      lifetimeLabel: "one-time purchase",
      buttonText: "Buy Now",
      priceId: process.env.REACT_APP_STRIPE_PRICE_LIFETIME || "price_lifetime",
      isSubscription: false
    }
  };

  // Features included in the plan
  const features = [
    "Interactive Harmony Palette",
    "Advanced Voice Leading Control",
    "Unlimited Saved Progressions",
    "Premium Sound Libraries",
    "MIDI Export & Import",
    "Dynamic Pattern Editor",
    "Song Builder Tool",
    "Cloud Storage & Backup",
    "Priority Email Support",
    "Free Updates"
  ];

  // Get the current plan based on selected billing period
  const currentPlan = planOptions[billingPeriod];

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
          <SectionTitle>Simple, Transparent Pricing</SectionTitle>
          
          {/* Free Trial Banner - Moved above the subtext */}
          <TrialBanner>
            <TrialText>
              <h3><FaGift /> Try <span> FREE </span> for 14 days</h3>
              <p>Experience all premium features without commitment.
              <br />No credit card required to start.</p>
            </TrialText>
          </TrialBanner>
          
          <SectionSubtitle>
            Choose the billing option that works best for you.
            <br />All options include full access to all features.
          </SectionSubtitle>
        
          {/* Billing period toggle */}
          <BillingToggleContainer>
            <BillingToggleButton 
              ref={monthlyBtnRef}
              $active={billingPeriod === 'monthly'} 
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </BillingToggleButton>
            
            <BillingToggleButton 
              ref={yearlyBtnRef}
              $active={billingPeriod === 'yearly'} 
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly
            </BillingToggleButton>
            
            <BillingToggleButton 
              ref={lifetimeBtnRef}
              $active={billingPeriod === 'lifetime'} 
              onClick={() => setBillingPeriod('lifetime')}
            >
              Lifetime
            </BillingToggleButton>
          </BillingToggleContainer>
          
          {/* Savings info based on selected billing period */}
          <div style={{ textAlign: 'center' }}>
            {billingPeriod === 'monthly' && (
              <SavingsInfo>
                <span>Most Flexible</span> - Pay month-to-month, cancel anytime
              </SavingsInfo>
            )}
            {billingPeriod === 'yearly' && (
              <SavingsInfo>
                Save <span>25%</span> with yearly billing
              </SavingsInfo>
            )}
            {billingPeriod === 'lifetime' && (
              <SavingsInfo>
                <span>Best Value</span> - One-time payment, lifetime access
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
            {billingPeriod !== 'lifetime' && (
              <TrialBadge>14-Day Free Trial</TrialBadge>
            )}
            <CardHeader>
              <PlanName>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LogoImage src="/logo-cymasphere.svg" alt="CYMASPHERE Logo" />
                  <LogoText>
                    <span>CYMA</span>SPHERE PRO
                  </LogoText>
                </div>
              </PlanName>
              <div style={{ fontSize: '1.1rem', opacity: 0.8 }}>
                Complete solution for music producers
              </div>
              
              <PlanPrice>
                <Price>${currentPlan.price}</Price>
                <BillingPeriod>{currentPlan.period}</BillingPeriod>
                {billingPeriod === 'yearly' && (
                  <div style={{ marginTop: '5px', fontSize: '1rem' }}>
                    {currentPlan.monthlyPrice} billed annually
                  </div>
                )}
                {billingPeriod === 'lifetime' && (
                  <div style={{ marginTop: '5px', fontSize: '1rem', opacity: 0.8 }}>
                    {currentPlan.lifetimeLabel}
                  </div>
                )}
                {billingPeriod !== 'lifetime' && (
                  <div style={{ 
                    marginTop: '10px', 
                    fontSize: '0.9rem', 
                    color: '#F96E46', 
                    fontWeight: 'bold',
                    background: 'rgba(249, 110, 70, 0.1)',
                    padding: '5px 10px',
                    borderRadius: '6px',
                    display: 'inline-block'
                  }}>
                    First {currentPlan.trialDays} days free - Cancel anytime
                  </div>
                )}
              </PlanPrice>
            </CardHeader>
            
            <CardBody>
              <Divider />
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text)', marginTop: '0' }}>
                All Plans Include:
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
              
              <StripeCheckout 
                priceId={currentPlan.priceId}
                buttonText={currentPlan.buttonText}
                billingPeriod={billingPeriod}
                price={currentPlan.price}
                trialDays={currentPlan.trialDays}
              />
            </CardBody>
          </PricingCard>
        </motion.div>
      </ContentContainer>
    </PricingContainer>
  );
};

export default PricingSection;