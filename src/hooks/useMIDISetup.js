import { useState, useEffect } from 'react';
import { initializeMIDI } from '../utils/midiUtils';

/**
 * Custom hook for initializing and managing MIDI access
 * @returns {Object} Object containing MIDI state (access, outputs, selectedOutput)
 */
const useMIDISetup = () => {
  const [midiAccess, setMidiAccess] = useState(null);
  const [midiOutputs, setMidiOutputs] = useState([]);
  const [selectedOutput, setSelectedOutput] = useState(null);
  const [selectedPort, setSelectedPort] = useState(null);
  const [midiOutput, setMidiOutput] = useState(null);

  useEffect(() => {
    const initMidi = async () => {
      try {
        const midi = await initializeMIDI();
        if (midi) {
          setMidiAccess(midi.access);
          setMidiOutputs(midi.outputs);
          
          // Set default output if available
          if (midi.defaultOutput) {
            setSelectedOutput(midi.defaultOutput.id);
            setMidiOutput(midi.defaultOutput);
          }
        }
      } catch (error) {
        console.error("Error initializing MIDI:", error);
      }
    };

    initMidi();
  }, []);

  // Handle MIDI device selection change
  const handleMidiDeviceChange = (event) => {
    const selectedName = event.target.value;
    setSelectedPort(selectedName);
    
    console.log("Selected MIDI device name:", selectedName);
    
    if (!selectedName) {
      setMidiOutput(null);
      console.log('No MIDI output selected');
      return;
    }
    
    const output = midiOutputs.find(output => output.name === selectedName);
    if (output) {
      setMidiOutput(output);
      console.log(`Selected MIDI output: ${output.name} (ID: ${output.id})`);
    } else {
      setMidiOutput(null);
      console.log('Could not find MIDI output with name:', selectedName);
    }
  };

  return {
    midiAccess,
    midiOutputs,
    midiOutput,
    selectedOutput,
    selectedPort,
    handleMidiDeviceChange
  };
};

export default useMIDISetup; 