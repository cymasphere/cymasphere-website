import { useState, useEffect } from "react";
import { initializeMIDI } from "../utils/midiUtils";

interface MIDIOutput {
  id: string;
  name: string;
}

// Using a more specific approach for MIDIAccess
interface MIDIAccessType {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  inputs: Record<string, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  outputs: Record<string, any>;
}

/**
 * Custom hook for initializing and managing MIDI access
 * @returns {Object} Object containing MIDI state (access, outputs, selectedOutput)
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

  // Handle MIDI device selection change
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
