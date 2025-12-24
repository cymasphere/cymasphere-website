/**
 * @fileoverview Synth Components Index
 * @module components/synth
 * 
 * Barrel export file for all synthesizer-related components. Provides a
 * centralized export point for synth UI components including controls,
 * selectors, chord bank, MIDI device selection, and particle system.
 * 
 * @example
 * // Import all synth components
 * import { SynthSelector, SynthControls, ChordBank } from '@/components/synth';
 */

export { default as SynthSelector } from './SynthSelector';
export { default as ChordBank } from './ChordBank';
export { default as MIDIDeviceSelector } from './MIDIDeviceSelector';
export { default as StopButton } from './StopButton';
export { default as ParticleSystem } from './ParticleSystem';
export { default as SynthControls } from './SynthControls.js'; 