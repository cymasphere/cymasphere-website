/**
 * @fileoverview MIDI note and frequency conversion utilities.
 * @module utils/noteUtils
 * @description Provides functions for converting between MIDI note numbers and frequencies,
 * finding closest notes, and calculating optimal voice leading for smooth chord progressions.
 * Uses equal temperament tuning with A4 = 440 Hz as the reference.
 */

/**
 * @brief Converts a MIDI note number to its corresponding frequency in Hz.
 * @description Calculates the frequency using equal temperament tuning with A4 (MIDI note 69) = 440 Hz.
 * @param {number} midiNote - MIDI note number (0-127, where 60 is middle C).
 * @returns {number} Frequency in Hz.
 * @note Uses the formula: frequency = 440 * 2^((midiNote - 69) / 12).
 * @note MIDI note 69 is A4 (440 Hz).
 * @note MIDI note 60 is middle C (C4, approximately 261.63 Hz).
 * @example
 * ```typescript
 * const freq = midiToFreq(69); // Returns 440 (A4)
 * const freq = midiToFreq(60); // Returns ~261.63 (C4)
 * ```
 */
export const midiToFreq = (midiNote: number): number => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

/**
 * @brief Finds the closest note to a target note from a list of candidates.
 * @description Compares notes within the same octave (using modulo 12) to find the closest
 * pitch class match, then adjusts the octave to be closest to the target.
 * @param {number} target - Target MIDI note number to match.
 * @param {number[]} candidates - Array of candidate MIDI note numbers to choose from.
 * @returns {number} The closest MIDI note from the candidates array.
 * @note Compares pitch classes (note % 12) to find the closest match.
 * @note Adjusts octave to minimize distance from the target.
 * @example
 * ```typescript
 * const closest = findClosestNote(61, [60, 64, 67]); // Returns 60 (C is closer to C# than E or G)
 * ```
 */
export const findClosestNote = (
  target: number,
  candidates: number[]
): number => {
  let closestNote = candidates[0];
  let minDistance = Math.abs((target % 12) - (candidates[0] % 12));

  candidates.forEach((note: number) => {
    const distance = Math.abs((target % 12) - (note % 12));
    if (distance < minDistance) {
      minDistance = distance;
      closestNote = note;
    }
  });

  // Adjust the octave to be closest to the target
  const octaveAdjust = Math.round((target - (closestNote % 12)) / 12) * 12;
  return (closestNote % 12) + octaveAdjust;
};

/**
 * @brief Finds optimal voice leading between two chords.
 * @description Calculates the smoothest transition from a previous chord to a new chord
 * by minimizing the distance each voice moves. Preserves the bass note and finds the
 * closest upper voice positions, allowing voice crossing for smoother transitions.
 * @param {number[] | null} prevNotes - Previous chord notes (MIDI note numbers), or null if no previous chord.
 * @param {number[]} newChord - New chord notes (MIDI note numbers) to voice optimally.
 * @returns {number[]} Optimally voiced chord with minimal voice movement.
 * @note Keeps the bass note (first note) of the new chord unchanged.
 * @note Considers notes in nearby octaves (±12 semitones) for each voice.
 * @note Sorts upper voices to maintain proper spacing.
 * @note Returns the new chord unchanged if prevNotes is null.
 * @example
 * ```typescript
 * const prev = [48, 60, 64, 67]; // C major in root position
 * const next = [52, 60, 64, 68]; // E major
 * const voiced = findOptimalVoicing(prev, next); // Minimizes voice movement
 * ```
 */
export const findOptimalVoicing = (
  prevNotes: number[] | null,
  newChord: number[]
): number[] => {
  if (!prevNotes) return newChord;

  const bassNote = newChord[0]; // Keep bass note separate
  const prevUpperVoices = prevNotes.slice(1);
  const newUpperVoices = newChord.slice(1);

  // Find closest new notes to each previous note
  const voicedUpperNotes = prevUpperVoices.map((prevNote: number) => {
    // Get available notes for this voice (allow crossing voices)
    const availableNotes = newUpperVoices
      .map((note: number) => {
        // Consider notes in nearby octaves
        return [note - 12, note, note + 12];
      })
      .flat();

    return findClosestNote(prevNote, availableNotes);
  });

  // Sort the voiced notes to maintain proper spacing
  voicedUpperNotes.sort((a: number, b: number) => a - b);

  return [bassNote, ...voicedUpperNotes];
};
