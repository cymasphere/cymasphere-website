/**
 * @fileoverview MIDI (Musical Instrument Digital Interface) utilities for Web MIDI API integration.
 * @module utils/midiUtils
 * @description Provides functions for initializing MIDI access, sending MIDI messages,
 * and managing MIDI output devices. Includes support for note on/off, chords, and
 * panic (all notes off) functionality. Uses the Web MIDI API for browser-based MIDI communication.
 */

// Removing unused import
// import * as Tone from 'tone';

/**
 * @brief Interface for MIDI output device.
 * @description Represents a MIDI output device with methods to send MIDI messages.
 */
interface MIDIOutput {
  send: (data: number[]) => void;
  id?: string;
  name?: string;
}

// Declare Web MIDI API types for TypeScript
declare global {
  interface Navigator {
    requestMIDIAccess(options?: { sysex: boolean }): Promise<MIDIAccess>;
  }

  interface MIDIAccess {
    readonly outputs: MIDIOutputMap;
  }

  interface MIDIOutputMap {
    entries(): IterableIterator<[string, MIDIOutput]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<MIDIOutput>;
    forEach(
      callback: (output: MIDIOutput, key: string, map: MIDIOutputMap) => void
    ): void;
  }
}

/**
 * @brief Initializes MIDI access for the application.
 * @description Requests access to the Web MIDI API and returns available MIDI outputs.
 * Returns null if MIDI is not supported or access is denied.
 * @returns {Promise<{access: MIDIAccess, outputs: MIDIOutput[], defaultOutput: MIDIOutput | null} | null>} Promise resolving to MIDI access object with outputs, or null if unavailable.
 * @note Requires user interaction to grant MIDI access (browser security requirement).
 * @note Returns the first available output as the default output.
 * @note Does not request sysex (system exclusive) access for security.
 * @example
 * ```typescript
 * const midi = await initializeMIDI();
 * if (midi) {
 *   console.log(`Found ${midi.outputs.length} MIDI outputs`);
 *   // Use midi.defaultOutput or midi.outputs[0] to send MIDI messages
 * }
 * ```
 */
export const initializeMIDI = async () => {
  if (!navigator.requestMIDIAccess) {
    console.warn("WebMIDI is not supported in this browser");
    return null;
  }

  try {
    const access = await navigator.requestMIDIAccess({ sysex: false });
    console.log("MIDI access granted");

    // Get available outputs
    const outputs = Array.from(access.outputs.values());

    return {
      access,
      outputs,
      defaultOutput: outputs.length > 0 ? outputs[0] : null,
    };
  } catch (err) {
    console.error("MIDI access denied:", err);
    return null;
  }
};

/**
 * @brief Sends a MIDI note on message to a MIDI output device.
 * @description Sends a note on message to trigger a note on the specified MIDI channel.
 * @param {MIDIOutput | null} midiOutput - MIDI output device to send the message to.
 * @param {number} note - MIDI note number (0-127, where 60 is middle C).
 * @param {number} [velocity=100] - Note velocity (0-127), controls volume/attack.
 * @param {number} [channel=0] - MIDI channel (0-15).
 * @returns {void}
 * @note Does nothing if midiOutput is null.
 * @note MIDI note 60 is middle C (C4).
 * @note Velocity 0 is effectively a note off.
 * @example
 * ```typescript
 * sendMIDINoteOn(midiOutput, 60, 100, 0); // Play middle C on channel 0
 * ```
 */
export const sendMIDINoteOn = (
  midiOutput: MIDIOutput | null,
  note: number,
  velocity = 100,
  channel = 0
) => {
  if (!midiOutput) return;

  const noteOnStatus = 0x90 + channel; // Note On on the specified channel
  midiOutput.send([noteOnStatus, note, velocity]);
};

/**
 * @brief Sends a MIDI note off message to a MIDI output device.
 * @description Sends a note off message to stop a playing note on the specified MIDI channel.
 * @param {MIDIOutput | null} midiOutput - MIDI output device to send the message to.
 * @param {number} note - MIDI note number (0-127) to turn off.
 * @param {number} [channel=0] - MIDI channel (0-15).
 * @returns {void}
 * @note Does nothing if midiOutput is null.
 * @note Sends velocity 0 with note off status.
 * @example
 * ```typescript
 * sendMIDINoteOff(midiOutput, 60, 0); // Stop middle C on channel 0
 * ```
 */
export const sendMIDINoteOff = (
  midiOutput: MIDIOutput | null,
  note: number,
  channel = 0
) => {
  if (!midiOutput) return;

  const noteOffStatus = 0x80 + channel; // Note Off on the specified channel
  midiOutput.send([noteOffStatus, note, 0]);
};

/**
 * @brief Sends multiple MIDI notes simultaneously (chord).
 * @description Sends note on messages for all notes in the array to play a chord.
 * @param {MIDIOutput | null} midiOutput - MIDI output device to send the messages to.
 * @param {number[]} notes - Array of MIDI note numbers (0-127) to play simultaneously.
 * @param {number} [velocity=100] - Note velocity (0-127) for all notes in the chord.
 * @param {number} [channel=0] - MIDI channel (0-15) for all notes.
 * @returns {void}
 * @note Does nothing if midiOutput is null or notes array is empty/null.
 * @note All notes are sent on the same channel with the same velocity.
 * @example
 * ```typescript
 * sendMIDIChord(midiOutput, [60, 64, 67], 100, 0); // Play C major chord
 * ```
 */
export const sendMIDIChord = (
  midiOutput: MIDIOutput | null,
  notes: number[],
  velocity = 100,
  channel = 0
) => {
  if (!midiOutput || !notes) return;

  notes.forEach((note: number) => {
    sendMIDINoteOn(midiOutput, note, velocity, channel);
  });
};

/**
 * @brief Turns off all notes on a MIDI channel or all channels (panic function).
 * @description Sends MIDI "All Notes Off" control change message to stop all playing notes.
 * Useful for clearing stuck notes or resetting the MIDI device.
 * @param {MIDIOutput | null} midiOutput - MIDI output device to send the message to.
 * @param {number | null} [channel=null] - MIDI channel (0-15) to clear, or null to clear all channels.
 * @returns {void}
 * @note Does nothing if midiOutput is null.
 * @note Uses MIDI Control Change 123 (0x7B) for "All Notes Off".
 * @note When channel is null, sends the message to all 16 MIDI channels.
 * @example
 * ```typescript
 * allNotesOff(midiOutput, 0); // Clear all notes on channel 0
 * allNotesOff(midiOutput); // Clear all notes on all channels
 * ```
 */
export const allNotesOff = (
  midiOutput: MIDIOutput | null,
  channel: number | null = null
) => {
  if (!midiOutput) return;

  if (channel !== null) {
    // Send all notes off for specific channel
    midiOutput.send([0xb0 + channel, 0x7b, 0]);
  } else {
    // Send all notes off for all channels
    for (let ch = 0; ch < 16; ch++) {
      midiOutput.send([0xb0 + ch, 0x7b, 0]);
    }
  }
};
