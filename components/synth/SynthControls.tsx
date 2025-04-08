import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

const ControlsContainer = styled.div`
  width: 100%;
  background-color: rgba(15, 14, 23, 0.5);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(108, 99, 255, 0.2);
`;

const ControlTabs = styled.div`
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

interface TabButtonProps {
  $active?: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  padding: 10px 20px;
  background-color: transparent;
  color: var(--text);
  border: none;
  border-bottom: 2px solid
    ${(props) => (props.$active ? "var(--primary)" : "transparent")};
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(108, 99, 255, 0.1);
  }
`;

const ControlsPanel = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const ControlLabel = styled.label`
  font-size: 0.9rem;
  margin-bottom: 5px;
  color: var(--text-secondary);
  display: flex;
  justify-content: space-between;

  span {
    color: var(--text);
  }
`;

const Slider = styled.input`
  width: 100%;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: linear-gradient(to right, var(--primary), var(--accent));
  outline: none;
  margin: 10px 0;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
  }

  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
    border: none;
  }
`;

const tabVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

interface SynthControlsProps {
  selectedSynth: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  synth: any; // Would ideally be a more specific type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  effectsChain: any; // Would ideally be a more specific type
  updateSynthParam: (synth: string, param: string, value: number) => void;
  updateEffectParam: (effect: string, param: string, value: number) => void;
}

const SynthControls: React.FC<SynthControlsProps> = ({
  selectedSynth,
  synth,
  effectsChain,
  updateSynthParam,
  updateEffectParam,
}) => {
  const [activeTab, setActiveTab] = useState("synth");
  const [synthParams, setSynthParams] = useState({
    // PolySynth params
    polyVolume: -15,
    polyDetune: 0,
    polyAttack: 0.1,
    polyDecay: 0.3,
    polySustain: 0.5,
    polyRelease: 0.8,

    // FMSynth params
    fmVolume: -15,
    fmModulationIndex: 10,
    fmHarmonicity: 3,
    fmAttack: 0.1,
    fmDecay: 0.3,
    fmSustain: 0.5,
    fmRelease: 0.8,

    // PadSynth params
    padVolume: -15,
    padDetune: 5,
    padFilterFreq: 2000,
    padAttack: 1.5,
    padDecay: 1.0,
    padSustain: 0.8,
    padRelease: 3.0,
  });

  const [effectParams, setEffectParams] = useState({
    reverbDecay: 5,
    reverbPreDelay: 0.1,
    reverbWet: 0.3,

    delayTime: 0.25,
    delayFeedback: 0.4,
    delayWet: 0.3,

    chorusFrequency: 1.5,
    chorusDepth: 0.7,
    chorusWet: 0.3,

    stereoWidth: 0.7,
    masterVolume: -6,
  });

  // Update local state when a synth parameter changes
  const handleSynthParamChange = (param: string, value: number) => {
    setSynthParams((prev) => ({ ...prev, [param]: value }));
    if (updateSynthParam) {
      updateSynthParam(selectedSynth, param, parseFloat(value.toString()));
    }
  };

  // Update local state when an effect parameter changes
  const handleEffectParamChange = (
    effect: string,
    param: string,
    value: number
  ) => {
    setEffectParams((prev) => ({
      ...prev,
      [param]: value,
    }));

    updateEffectParam(effect, param, value);
  };

  // Reset to default values when synth type changes
  useEffect(() => {
    if (selectedSynth === "polysynth") {
      setActiveTab("synth");
    } else if (selectedSynth === "fmsynth") {
      setActiveTab("synth");
    } else if (selectedSynth === "padsynth") {
      setActiveTab("synth");
    }
  }, [selectedSynth]);

  useEffect(() => {
    // Sync with synth state when synth changes
    if (synth && selectedSynth === "polysynth") {
      // Update state from synth
      try {
        const vol =
          synth.volume && typeof synth.volume.value !== "undefined"
            ? synth.volume.value
            : -15;

        setSynthParams((prev) => ({
          ...prev,
          polyVolume: vol,
        }));
      } catch (error) {
        console.warn("Error reading synth volume:", error);
      }
    }

    // Set initial effect params from effects chain
    if (effectsChain) {
      const newEffectParams = { ...effectParams };

      // Update reverb params if available
      if (effectsChain.reverb) {
        newEffectParams.reverbWet = effectsChain.reverb.wet.value;
        newEffectParams.reverbDecay = effectsChain.reverb.decay;
        newEffectParams.reverbPreDelay = effectsChain.reverb.preDelay;
      }

      // Update delay params if available
      if (effectsChain.delay) {
        newEffectParams.delayWet = effectsChain.delay.wet.value;
        newEffectParams.delayTime = effectsChain.delay.delayTime.value;
        newEffectParams.delayFeedback = effectsChain.delay.feedback.value;
      }

      // Update chorus params if available
      if (effectsChain.chorus) {
        newEffectParams.chorusWet = effectsChain.chorus.wet.value;
        newEffectParams.chorusFrequency = effectsChain.chorus.frequency.value;
        newEffectParams.chorusDepth = effectsChain.chorus.depth.value;
      }

      // Update master volume if available
      if (effectsChain.masterVolume) {
        newEffectParams.masterVolume = effectsChain.masterVolume.volume.value;
      }

      setEffectParams(newEffectParams);
    }
  }, [synth, selectedSynth, effectsChain, effectParams]);

  return (
    <ControlsContainer>
      <ControlTabs>
        <TabButton
          $active={activeTab === "synth"}
          onClick={() => setActiveTab("synth")}
        >
          Synth Parameters
        </TabButton>
        <TabButton
          $active={activeTab === "effects"}
          onClick={() => setActiveTab("effects")}
        >
          Effects
        </TabButton>
      </ControlTabs>

      {activeTab === "synth" && (
        <ControlsPanel
          initial="hidden"
          animate="visible"
          variants={tabVariants}
          key="synth"
        >
          {/* PolySynth Controls */}
          {selectedSynth === "polysynth" && (
            <>
              <ControlGroup>
                <ControlLabel>
                  Volume <span>{synthParams.polyVolume} dB</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="-40"
                  max="0"
                  step="1"
                  value={synthParams.polyVolume}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "polyVolume",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Detune <span>{synthParams.polyDetune} cents</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="-50"
                  max="50"
                  step="1"
                  value={synthParams.polyDetune}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "polyDetune",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Attack <span>{synthParams.polyAttack}s</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={synthParams.polyAttack}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "polyAttack",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Decay <span>{synthParams.polyDecay}s</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={synthParams.polyDecay}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "polyDecay",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Sustain <span>{synthParams.polySustain}</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={synthParams.polySustain}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "polySustain",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Release <span>{synthParams.polyRelease}s</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={synthParams.polyRelease}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "polyRelease",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>
            </>
          )}

          {/* FMSynth Controls */}
          {selectedSynth === "fmsynth" && (
            <>
              <ControlGroup>
                <ControlLabel>
                  Volume <span>{synthParams.fmVolume} dB</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="-40"
                  max="0"
                  step="1"
                  value={synthParams.fmVolume}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "fmVolume",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Modulation Index <span>{synthParams.fmModulationIndex}</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={synthParams.fmModulationIndex}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "fmModulationIndex",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Harmonicity <span>{synthParams.fmHarmonicity}</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.1"
                  value={synthParams.fmHarmonicity}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "fmHarmonicity",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Attack <span>{synthParams.fmAttack}s</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={synthParams.fmAttack}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "fmAttack",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Decay <span>{synthParams.fmDecay}s</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.01"
                  max="2"
                  step="0.01"
                  value={synthParams.fmDecay}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "fmDecay",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Sustain <span>{synthParams.fmSustain}</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={synthParams.fmSustain}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "fmSustain",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Release <span>{synthParams.fmRelease}s</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={synthParams.fmRelease}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "fmRelease",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>
            </>
          )}

          {/* PadSynth Controls */}
          {selectedSynth === "padsynth" && (
            <>
              <ControlGroup>
                <ControlLabel>
                  Volume <span>{synthParams.padVolume} dB</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="-40"
                  max="0"
                  step="1"
                  value={synthParams.padVolume}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "padVolume",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Detune <span>{synthParams.padDetune} cents</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={synthParams.padDetune}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "padDetune",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Filter Frequency <span>{synthParams.padFilterFreq} Hz</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={synthParams.padFilterFreq}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "padFilterFreq",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Attack <span>{synthParams.padAttack}s</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={synthParams.padAttack}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "padAttack",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Decay <span>{synthParams.padDecay}s</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={synthParams.padDecay}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "padDecay",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Sustain <span>{synthParams.padSustain}</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={synthParams.padSustain}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "padSustain",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>

              <ControlGroup>
                <ControlLabel>
                  Release <span>{synthParams.padRelease}s</span>
                </ControlLabel>
                <Slider
                  type="range"
                  min="0.1"
                  max="10"
                  step="0.1"
                  value={synthParams.padRelease}
                  onChange={(e) =>
                    handleSynthParamChange(
                      "padRelease",
                      parseFloat(e.target.value)
                    )
                  }
                />
              </ControlGroup>
            </>
          )}
        </ControlsPanel>
      )}

      {activeTab === "effects" && (
        <ControlsPanel
          initial="hidden"
          animate="visible"
          variants={tabVariants}
          key="effects"
        >
          {/* Master Volume - Always show this */}
          <ControlGroup>
            <ControlLabel>
              Master Volume <span>{effectParams.masterVolume || -6} dB</span>
            </ControlLabel>
            <Slider
              type="range"
              min="-40"
              max="0"
              step="1"
              value={effectParams.masterVolume || -6}
              onChange={(e) =>
                handleEffectParamChange(
                  "masterVolume",
                  "volume",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          {/* Reverb Controls */}
          <ControlGroup>
            <ControlLabel>
              Reverb Decay <span>{effectParams.reverbDecay}s</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={effectParams.reverbDecay}
              onChange={(e) =>
                handleEffectParamChange(
                  "reverb",
                  "Decay",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          <ControlGroup>
            <ControlLabel>
              Reverb Pre-Delay <span>{effectParams.reverbPreDelay}s</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={effectParams.reverbPreDelay}
              onChange={(e) =>
                handleEffectParamChange(
                  "reverb",
                  "PreDelay",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          <ControlGroup>
            <ControlLabel>
              Reverb Mix{" "}
              <span>{Math.round(effectParams.reverbWet * 100)}%</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectParams.reverbWet}
              onChange={(e) =>
                handleEffectParamChange(
                  "reverb",
                  "Wet",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          {/* Delay Controls */}
          <ControlGroup>
            <ControlLabel>
              Delay Time <span>{effectParams.delayTime}s</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={effectParams.delayTime}
              onChange={(e) =>
                handleEffectParamChange(
                  "delay",
                  "Time",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          <ControlGroup>
            <ControlLabel>
              Delay Feedback{" "}
              <span>{Math.round(effectParams.delayFeedback * 100)}%</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0"
              max="0.9"
              step="0.01"
              value={effectParams.delayFeedback}
              onChange={(e) =>
                handleEffectParamChange(
                  "delay",
                  "Feedback",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          <ControlGroup>
            <ControlLabel>
              Delay Mix <span>{Math.round(effectParams.delayWet * 100)}%</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectParams.delayWet}
              onChange={(e) =>
                handleEffectParamChange(
                  "delay",
                  "Wet",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          {/* Chorus Controls */}
          <ControlGroup>
            <ControlLabel>
              Chorus Rate <span>{effectParams.chorusFrequency} Hz</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={effectParams.chorusFrequency}
              onChange={(e) =>
                handleEffectParamChange(
                  "chorus",
                  "Frequency",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          <ControlGroup>
            <ControlLabel>
              Chorus Depth{" "}
              <span>{Math.round(effectParams.chorusDepth * 100)}%</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectParams.chorusDepth}
              onChange={(e) =>
                handleEffectParamChange(
                  "chorus",
                  "Depth",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          <ControlGroup>
            <ControlLabel>
              Chorus Mix{" "}
              <span>{Math.round(effectParams.chorusWet * 100)}%</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectParams.chorusWet}
              onChange={(e) =>
                handleEffectParamChange(
                  "chorus",
                  "Wet",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>

          {/* Stereo Controls */}
          <ControlGroup>
            <ControlLabel>
              Stereo Width{" "}
              <span>{Math.round(effectParams.stereoWidth * 100)}%</span>
            </ControlLabel>
            <Slider
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={effectParams.stereoWidth}
              onChange={(e) =>
                handleEffectParamChange(
                  "stereoWidener",
                  "Width",
                  parseFloat(e.target.value)
                )
              }
            />
          </ControlGroup>
        </ControlsPanel>
      )}
    </ControlsContainer>
  );
};

export default SynthControls;
