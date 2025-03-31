/**
 * Utility functions for MIDI notes and frequency conversions
 */

/**
 * Convert MIDI note number to frequency
 * @param {number} midiNote - MIDI note number
 * @returns {number} - Frequency in Hz
 */
export const midiToFreq = (midiNote) => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

/**
 * Find closest note within an octave
 * @param {number} target - Target MIDI note
 * @param {Array<number>} candidates - Candidate MIDI notes
 * @returns {number} - Closest MIDI note
 */
export const findClosestNote = (target, candidates) => {
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

/**
 * Find optimal voice leading
 * @param {Array<number>} prevNotes - Previous chord notes
 * @param {Array<number>} newChord - New chord notes
 * @returns {Array<number>} - Optimally voiced chord
 */
export const findOptimalVoicing = (prevNotes, newChord) => {
  if (!prevNotes) return newChord;

  const bassNote = newChord[0]; // Keep bass note separate
  const prevUpperVoices = prevNotes.slice(1);
  const newUpperVoices = newChord.slice(1);
  
  // Find closest new notes to each previous note
  const voicedUpperNotes = prevUpperVoices.map(prevNote => {
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