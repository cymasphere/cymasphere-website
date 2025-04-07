/**
 * Monkey patches for Tone.js to prevent "undefinedNaN" errors
 * This file fixes issues with undefined parameters in triggerAttack/triggerAttackRelease methods
 */

import * as Tone from "tone";

// Apply patches when this file is imported
export const applyTonePatches = () => {
  console.log(
    "Applying radical Tone.js patches to prevent undefined parameter issues"
  );

  try {
    // COMPLETE REPLACEMENT OF FMSynth.triggerAttack
    // This is a nuclear option that completely bypasses the original buggy implementation
    Tone.FMSynth.prototype.triggerAttack = function (note, time, velocity = 1) {
      // Log attempt to help with debugging
      console.log(
        `FMSynth.triggerAttack override called: note=${note}, time=${time}, velocity=${velocity}`
      );

      try {
        // Get absolute time
        const now = this.context.currentTime;
        const computedTime =
          time !== undefined && time !== null ? this.toSeconds(time) : now;
        const computedVelocity =
          velocity !== undefined && velocity !== null ? velocity : 1;

        // Normalize the note to frequency if it isn't already
        let freq = note;
        if (typeof note !== "number") {
          try {
            // Use Tone's get method instead of direct constructor
            freq = Tone.Frequency(note).valueOf();
          } catch (e) {
            console.warn("Could not convert note to frequency:", e);
            return this; // Exit if we can't get a valid frequency
          }
        }

        // Safety check - if frequency is not a number or is NaN, use A4 (440Hz) as fallback
        if (typeof freq !== "number" || isNaN(freq)) {
          console.warn("Invalid frequency, using 440Hz as fallback");
          freq = 440;
        }

        // Instead of using the problematic internal setNote method, we'll set parameters directly
        // This avoids the internal setValueAtTime calls that are causing the errors
        try {
          // Set oscillator frequency directly
          if (this.oscillator) {
            this.oscillator.frequency.setValueAtTime(freq, computedTime);
          }

          // Set modulator frequency based on the current harmonicity
          if (
            this.modulationIndex &&
            typeof this.modulationIndex.value === "number"
          ) {
            const modFreq = freq * this.harmonicity.value;
            if (this.modulation) {
              this.modulation.frequency.setValueAtTime(modFreq, computedTime);
            }
          }

          // Trigger the amplitude envelope
          if (this.envelope) {
            this.envelope.triggerAttack(computedTime, computedVelocity);
          }

          // Trigger the modulation envelope
          if (this.modulationEnvelope) {
            this.modulationEnvelope.triggerAttack(
              computedTime,
              computedVelocity
            );
          }

          return this;
        } catch (e) {
          console.error(
            "Error in FMSynth.triggerAttack direct parameter setting:",
            e
          );
          return this;
        }
      } catch (e) {
        console.error("Error in FMSynth.triggerAttack override:", e);
        return this;
      }
    };

    // Also patch PolySynth to handle the FMSynth issues
    const originalPolySynthTriggerAttack =
      Tone.PolySynth.prototype.triggerAttack;
    Tone.PolySynth.prototype.triggerAttack = function (notes, time, velocity) {
      try {
        // Simple null check for parameters
        const safeTime =
          time !== undefined && time !== null ? time : Tone.now();
        const safeVelocity =
          velocity !== undefined && velocity !== null ? velocity : 1;

        // Make sure notes is at least an array
        let safeNotes = notes;
        if (!Array.isArray(notes)) {
          safeNotes = notes !== undefined && notes !== null ? [notes] : [];
        }

        if (Array.isArray(safeNotes) && safeNotes.length === 0) {
          console.warn("No valid notes to play, skipping triggerAttack");
          return this;
        }

        // Call the original with safe parameters
        return originalPolySynthTriggerAttack.call(
          this,
          safeNotes,
          safeTime,
          safeVelocity
        );
      } catch (e) {
        console.error("Error in PolySynth.triggerAttack patch:", e);
        return this;
      }
    };

    console.log("Tone.js radical patches applied successfully");
  } catch (error) {
    console.error("Failed to apply Tone.js patches:", error);
  }
};

// Apply patches automatically when imported
applyTonePatches();

export default applyTonePatches;
