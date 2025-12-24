/**
 * @fileoverview Custom hook for initializing and managing MIDI device access.
 * @module hooks/useMIDISetup
 * @description Provides MIDI device initialization, output device listing, and device selection.
 * Automatically initializes MIDI access on mount and sets default output if available.
 */

import { useState, useEffect } from "react";
import { initializeMIDI } from "../utils/midiUtils";

/**
 * @brief Type definition for MIDI output device.
 * @description Represents a MIDI output device with its unique ID and display name.
 */
interface MIDIOutput {
  id: string;
  name: string;
}

/**
 * @brief Type definition for MIDI access object.
 * @description Represents the Web MIDI API access object with inputs and outputs.
 */
interface MIDIAccessType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputs: Record<string, any>;
}

/**
 * @brief Custom hook for initializing and managing MIDI access.
 * @description Initializes MIDI access on mount, lists available output devices,
 * and provides device selection functionality.
 * @returns {Object} Object containing MIDI state and device selection handler.
 * @returns {MIDIAccessType | null} returns.midiAccess - The MIDI access object or null if not initialized.
 * @returns {MIDIOutput[]} returns.midiOutputs - Array of available MIDI output devices.
 * @returns {MIDIOutput | null} returns.midiOutput - Currently selected MIDI output device.
 * @returns {string | null} returns.selectedOutput - ID of the selected output device.
 * @returns {string | null} returns.selectedPort - Name of the selected port.
 * @returns {Function} returns.handleMidiDeviceChange - Handler for MIDI device selection changes.
 * @note Automatically sets default output device if available on initialization.
 * @example
 * const { midiOutputs, midiOutput, handleMidiDeviceChange } = useMIDISetup();
 * <select onChange={handleMidiDeviceChange}>
 *   {midiOutputs.map(output => <option key={output.id}>{output.name}</option>)}
 * </select>
 */
const useMIDISetup = () => {
  const [midiAccess, setMidiAccess] = useState<MIDIAccessType | null>(null);
  const [midiOutputs, setMidiOutputs] = useState<MIDIOutput[]>([]);
  const [selectedOutput, setSelectedOutput] = useState<string | null>(null);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [midiOutput, setMidiOutput] = useState<MIDIOutput | null>(null);

  useEffect(() => {
    const initMidi = async () => {
      try {
        const midi = await initializeMIDI();
        if (midi) {
          setMidiAccess(midi.access as MIDIAccessType);
          setMidiOutputs(midi.outputs as MIDIOutput[]);

          // Set default output if available
          if (midi.defaultOutput && midi.defaultOutput.id) {
            setSelectedOutput(midi.defaultOutput.id);
            setMidiOutput(midi.defaultOutput as MIDIOutput);
          }
        }
      } catch (error) {
        console.error("Error initializing MIDI:", error);
      }
    };

    initMidi();
  }, []);

  /**
   * @brief Handles MIDI device selection change from a select element.
   * @param {React.ChangeEvent<HTMLSelectElement>} event - Change event from select element.
   * @description Updates the selected MIDI output device based on the selected device name.
   * @note Logs device selection for debugging purposes.
   */
  const handleMidiDeviceChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedName = event.target.value;
    setSelectedPort(selectedName);

    console.log("Selected MIDI device name:", selectedName);

    if (!selectedName) {
      setMidiOutput(null);
      console.log("No MIDI output selected");
      return;
    }

    const output = midiOutputs.find((output) => output.name === selectedName);
    if (output) {
      setMidiOutput(output);
      console.log(`Selected MIDI output: ${output.name} (ID: ${output.id})`);
    } else {
      setMidiOutput(null);
      console.log("Could not find MIDI output with name:", selectedName);
    }
  };

  return {
    midiAccess,
    midiOutputs,
    midiOutput,
    selectedOutput,
    selectedPort,
    handleMidiDeviceChange,
  };
};

export default useMIDISetup;
