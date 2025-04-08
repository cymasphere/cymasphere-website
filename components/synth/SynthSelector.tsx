import React from "react";
import { getPresetOptions } from "../../utils/presets";

interface MidiOutput {
  id: string;
  name: string;
}

interface SynthSelectorProps {
  selectedSynth: string;
  onSynthChange: (event: { target: { value: string } }) => void;
  midiOutputs?: MidiOutput[];
  selectedOutput?: string;
  onOutputChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  selectedPreset?: string;
  onPresetChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const SynthSelector: React.FC<SynthSelectorProps> = ({
  selectedSynth,
  onSynthChange,
  midiOutputs,
  selectedOutput,
  onOutputChange,
  selectedPreset,
  onPresetChange,
}) => {
  // Create a handler that directly passes the synth type string
  const handleSynthChange = (synthType: string) => {
    onSynthChange({ target: { value: synthType } });
  };

  // Get preset options from our presets utility
  const presetOptions = getPresetOptions();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "15px",
        width: "100%",
        maxWidth: "600px",
        marginBottom: "20px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <button
          onClick={() => handleSynthChange("internal")}
          style={{
            padding: "15px",
            borderRadius: "10px",
            backgroundColor:
              selectedSynth === "internal"
                ? "#6C63FF"
                : "rgba(30, 30, 30, 0.5)",
            border:
              "1px solid " +
              (selectedSynth === "internal"
                ? "#6C63FF"
                : "rgba(255, 255, 255, 0.1)"),
            color: "white",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            minWidth: "80px",
            transition: "all 0.3s ease",
          }}
        >
          <span style={{ fontSize: "24px" }}>🎹</span>
          <span style={{ fontSize: "0.8rem" }}>MIDI</span>
        </button>
        <button
          onClick={() => handleSynthChange("polysynth")}
          style={{
            padding: "15px",
            borderRadius: "10px",
            backgroundColor:
              selectedSynth === "polysynth"
                ? "#6C63FF"
                : "rgba(30, 30, 30, 0.5)",
            border:
              "1px solid " +
              (selectedSynth === "polysynth"
                ? "#6C63FF"
                : "rgba(255, 255, 255, 0.1)"),
            color: "white",
            cursor: "pointer",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "5px",
            minWidth: "80px",
            transition: "all 0.3s ease",
          }}
        >
          <span style={{ fontSize: "24px" }}>🎵</span>
          <span style={{ fontSize: "0.8rem" }}>Synth</span>
        </button>
      </div>

      {/* Show MIDI device dropdown when MIDI is selected */}
      {selectedSynth === "internal" &&
        midiOutputs &&
        midiOutputs.length > 0 && (
          <select
            value={selectedOutput || ""}
            onChange={onOutputChange}
            style={{
              padding: "10px",
              borderRadius: "5px",
              backgroundColor: "#2A2A2A",
              color: "white",
              border: "1px solid #444",
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
        )}

      {/* Show preset dropdown when polysynth is selected */}
      {selectedSynth === "polysynth" && (
        <select
          value={selectedPreset || "default"}
          onChange={onPresetChange}
          style={{
            padding: "10px",
            borderRadius: "5px",
            backgroundColor: "#2A2A2A",
            color: "white",
            border: "1px solid #444",
            width: "300px",
          }}
        >
          <option value="" disabled>
            Select Synth Preset
          </option>
          {presetOptions.map((preset) => (
            <option key={preset.value} value={preset.value}>
              {preset.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};

export default SynthSelector;
