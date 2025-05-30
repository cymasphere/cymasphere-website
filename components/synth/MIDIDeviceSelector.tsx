import React from "react";

interface MIDIDevice {
  id: string;
  name: string;
}

interface MIDIDeviceSelectorProps {
  midiOutputs: MIDIDevice[];
  selectedOutput: string | null;
  onOutputChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const MIDIDeviceSelector: React.FC<MIDIDeviceSelectorProps> = ({
  midiOutputs,
  selectedOutput,
  onOutputChange,
}) => {
  if (!midiOutputs || midiOutputs.length === 0) return null;

  return (
    <select
      value={selectedOutput || ""}
      onChange={onOutputChange}
      style={{
        padding: "10px",
        borderRadius: "5px",
        backgroundColor: "#2A2A2A",
        color: "white",
        border: "1px solid #444",
        marginBottom: "20px",
        width: "300px",
      }}
    >
      <option value="">Select MIDI Output</option>
      {midiOutputs.map((device) => (
        <option key={device.id} value={device.name}>
          {device.name}
        </option>
      ))}
    </select>
  );
};

export default MIDIDeviceSelector;
