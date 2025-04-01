/**
 * Utility functions to handle synth and effect parameter updates
 */

/**
 * Updates a parameter on the selected synthesizer
 * @param {Object} synth - The synthesizer instance
 * @param {string} synthType - The type of synthesizer
 * @param {string} param - The parameter to update
 * @param {number} value - The new value for the parameter
 */
export const updateSynthParameter = (synth, synthType, param, value) => {
  if (!synth) {
    console.warn('Cannot update parameter: No synth provided');
    return;
  }
  
  // Ensure value is a valid number
  if (typeof value !== 'number' || isNaN(value)) {
    console.warn(`Invalid parameter value for ${param}: ${value}. Must be a number.`);
    return;
  }
  
  try {
    console.log(`Setting ${synthType} parameter: ${param} = ${value}`);
    
    // Special handling for multi-voice padsynth
    if (synthType === 'padsynth' && synth.voices) {
      handlePadSynthParameter(synth, param, value);
      return;
    }
    
    // Handle envelope parameters (common across many synths)
    if (param.includes('envelope.')) {
      const envParam = param.split('.')[1];
      
      // Try the most common methods of setting envelope params
      if (synth.envelope && typeof synth.envelope[envParam] !== 'undefined') {
        // 1. Direct envelope property
        synth.envelope[envParam] = value;
        return;
      } else if (synth.set) {
        // 2. Use the set method available on many Tone.js instruments
        synth.set({ envelope: { [envParam]: value } });
        return;
      } else if (synthType === 'polysynth' && synth.get && synth.get('envelope')) {
        // 3. For PolySynth specifically
        const envelopeObj = {};
        envelopeObj[envParam] = value;
        synth.set({ envelope: envelopeObj });
        return;
      } else {
        // Try direct path setting for complex synths
        try {
          setPropByPath(synth, `envelope.${envParam}`, value);
          return;
        } catch (e) {
          console.warn(`Failed to set ${param} on ${synthType}: ${e.message}`);
        }
      }
    }
    
    // Handle type-specific parameters using built-in methods
    switch (synthType) {
      case 'polysynth':
        handlePolySynthParameter(synth, param, value);
        break;
      
      case 'fmsynth':
        handleFMSynthParameter(synth, param, value);
        break;
      
      case 'padsynth':
        // Already handled by the special case above
        break;
        
      default:
        console.warn(`Unknown synth type: ${synthType}`);
    }
    
  } catch (err) {
    console.error(`Error updating synth parameter: ${param}=${value} for ${synthType}:`, err);
  }
};

/**
 * Handles a polyVolume parameter by properly setting the volume on the synth
 * Volume is a special parameter that needs careful handling due to how Tone.js manages it
 */
function handleVolumeParameter(synth, value) {
  console.log(`Setting volume to ${value}dB`);
  
  // Try multiple approaches to ensure volume is set
  try {
    // First approach: use volume.value if available
    if (synth.volume && typeof synth.volume.value !== 'undefined') {
      synth.volume.value = parseFloat(value);
      console.log(`Set volume to ${value}dB using volume.value`);
      return true;
    }
  } catch (error) {
    console.warn("Error setting volume.value directly:", error.message);
  }
  
  try {
    // Second approach: use set method with volume parameter
    if (synth.set) {
      synth.set({ volume: parseFloat(value) });
      console.log(`Set volume to ${value}dB using set method`);
      return true;
    }
  } catch (error) {
    console.warn("Error setting volume using set method:", error.message);
  }
  
  try {
    // Last resort: try to access volume as a property
    if (typeof synth.volume === 'number') {
      synth.volume = parseFloat(value);
      console.log(`Set volume to ${value}dB by direct assignment`);
      return true;
    }
  } catch (error) {
    console.warn("Error setting volume directly:", error.message);
  }
  
  console.error("Failed to set volume using any method");
  return false;
}

/**
 * Helper function to handle PolySynth parameters
 */
function handlePolySynthParameter(synth, param, value) {
  // Handle general ADSR envelope parameters
  if (param.match(/^(attack|decay|sustain|release)$/)) {
    // Try to set envelope parameter directly
    if (synth.envelope && synth.envelope[param] !== undefined) {
      try {
        synth.envelope[param] = value;
      } catch (error) {
        console.warn(`Error setting ${param} directly on envelope:`, error.message);
        
        // Try alternative method
        if (synth.set) {
          try {
            synth.set({ envelope: { [param]: value } });
          } catch (setError) {
            console.error(`Error setting ${param} via set:`, setError.message);
          }
        }
      }
    } else if (synth.set) {
      // Try to set using the set method
      try {
        synth.set({ envelope: { [param]: value } });
      } catch (error) {
        console.error(`Error setting envelope.${param}:`, error.message);
      }
    }
  } else if (param === 'detune') {
    // Handle detune parameter
    try {
      if (synth.detune && typeof synth.detune.value !== 'undefined') {
        synth.detune.value = value;
      } else if (synth.set) {
        synth.set({ detune: value });
      }
      
      // Also try to set detune on individual voices if this is a PolySynth
      if (synth.voices && Array.isArray(synth.voices)) {
        synth.voices.forEach(voice => {
          if (voice.detune && voice.detune.value !== undefined) {
            voice.detune.value = value;
          }
        });
      }
    } catch (error) {
      console.warn("Error setting detune:", error.message);
    }
  } else if (param === 'volume' || param === 'polyVolume') {
    // Use our special volume handler
    handleVolumeParameter(synth, value);
  } else if (param.startsWith('poly')) {
    // Legacy parameter names (e.g., polyAttack -> envelope.attack)
    const mappedParam = mapLegacyParameter(param);
    if (mappedParam && synth.set) {
      try {
        synth.set(mappedParam, value);
      } catch (error) {
        console.warn(`Error setting legacy parameter ${param}:`, error.message);
      }
    }
  }
}

/**
 * Helper function to handle FMSynth parameters
 */
function handleFMSynthParameter(synth, param, value) {
  if (param === 'modulationIndex') {
    // Try multiple ways to set modulationIndex
    if (synth.modulationIndex && typeof synth.modulationIndex.value !== 'undefined') {
      synth.modulationIndex.value = value;
    } else if (synth.set) {
      synth.set({ modulationIndex: value });
    }
  } else if (param === 'harmonicity') {
    // Try multiple ways to set harmonicity
    if (synth.harmonicity && typeof synth.harmonicity.value !== 'undefined') {
      synth.harmonicity.value = value;
    } else if (synth.set) {
      synth.set({ harmonicity: value });
    }
  } else if (param === 'volume' || param === 'fmVolume') {
    // Use our special volume handler
    handleVolumeParameter(synth, value);
  } else if (param.startsWith('fm')) {
    // Legacy parameter names (e.g., fmAttack -> envelope.attack)
    const mappedParam = mapLegacyParameter(param);
    if (mappedParam && synth.set) {
      synth.set(mappedParam, value);
    }
  }
}

/**
 * Special handling for pad synth parameter updates
 * @param {Object} synth - The pad synth object
 * @param {string} param - The parameter to update
 * @param {number} value - The new parameter value
 */
const handlePadSynthParameter = (synth, param, value) => {
  if (!synth) {
    console.warn('Cannot update parameter: No pad synth provided');
    return;
  }
  
  if (!synth.voices) {
    console.warn('PadSynth has no voices property');
    return;
  }
  
  console.log(`Applying parameter ${param}=${value} to pad synth voices`);
  
  // For envelope parameters, we need special handling
  if (param.includes('envelope.')) {
    const envParam = param.split('.')[1];
    
    if (!envParam) {
      console.warn('Invalid envelope parameter format:', param);
      return;
    }
    
    let atLeastOneSuccess = false;
    
    // Apply to each voice individually
    Object.entries(synth.voices).forEach(([voiceName, voice]) => {
      try {
        if (!voice) {
          console.warn(`Voice ${voiceName} is null or undefined`);
          return;
        }
        
        // Use multiple strategies to set the envelope parameter
        // Strategy 1: Through the voice's envelope object directly
        if (voice.envelope && typeof voice.envelope[envParam] !== 'undefined') {
          voice.envelope[envParam] = value;
          console.log(`Set ${envParam}=${value} on ${voiceName} envelope directly`);
          atLeastOneSuccess = true;
          return; // Exit this voice's setup once successful
        }
        
        // Strategy 2: Using the voice's set method (most common for Tone.js)
        if (voice.set) {
          try {
            voice.set({ envelope: { [envParam]: value } });
            console.log(`Set ${envParam}=${value} on ${voiceName} using set method`);
            atLeastOneSuccess = true;
            return; // Exit this voice's setup once successful
          } catch (setError) {
            console.warn(`Failed to use set method for ${voiceName}:`, setError.message);
            // Continue to next strategy
          }
        }
        
        // Strategy 3: Try capitalized property format (e.g. envelopeAttack)
        const capitalizedProp = `envelope${envParam.charAt(0).toUpperCase() + envParam.slice(1)}`;
        if (typeof voice[capitalizedProp] !== 'undefined') {
          voice[capitalizedProp] = value;
          console.log(`Set ${capitalizedProp}=${value} on ${voiceName}`);
          atLeastOneSuccess = true;
          return; // Exit this voice's setup once successful
        }
        
        // Strategy 4: For PolySynth-based voices, try the voice's internal voices
        if (voice.voices && Array.isArray(voice.voices) && voice.voices.length > 0) {
          let voiceSuccess = false;
          
          voice.voices.forEach((innerVoice, index) => {
            if (!innerVoice) return;
            
            try {
              if (innerVoice.envelope && typeof innerVoice.envelope[envParam] !== 'undefined') {
                innerVoice.envelope[envParam] = value;
                console.log(`Set ${envParam}=${value} on ${voiceName} inner voice ${index}`);
                voiceSuccess = true;
              } else if (innerVoice.set) {
                innerVoice.set({ envelope: { [envParam]: value } });
                console.log(`Set ${envParam}=${value} on ${voiceName} inner voice ${index} using set`);
                voiceSuccess = true;
              }
            } catch (innerError) {
              console.warn(`Error setting envelope on ${voiceName} inner voice ${index}:`, innerError.message);
            }
          });
          
          if (voiceSuccess) {
            atLeastOneSuccess = true;
            return; // Exit this voice's setup once successful
          }
        }
        
        // Strategy 5: Try direct parameter application for voice
        if (typeof voice[envParam] !== 'undefined') {
          voice[envParam] = value;
          console.log(`Set ${envParam}=${value} directly on ${voiceName}`);
          atLeastOneSuccess = true;
          return;
        }
        
        console.warn(`Failed to find a way to set ${envParam} on ${voiceName}`);
      } catch (e) {
        console.warn(`Error setting ${param} on ${voiceName}:`, e.message);
      }
    });
    
    if (!atLeastOneSuccess) {
      console.warn(`Failed to set envelope parameter ${envParam} on any voices`);
    }
    
    return;
  }
  
  // Handle detune parameter (very common)
  if (param === 'detune') {
    let atLeastOneSuccess = false;
    
    Object.entries(synth.voices).forEach(([voiceName, voice]) => {
      try {
        if (!voice) return;
        
        if (voice.detune && typeof voice.detune.value !== 'undefined') {
          voice.detune.value = value;
          console.log(`Set detune=${value} on ${voiceName} using detune.value`);
          atLeastOneSuccess = true;
        } else if (voice.detune !== undefined) {
          voice.detune = value;
          console.log(`Set detune=${value} on ${voiceName} directly`);
          atLeastOneSuccess = true;
        } else if (voice.set) {
          voice.set({ detune: value });
          console.log(`Set detune=${value} on ${voiceName} using set method`);
          atLeastOneSuccess = true;
        }
      } catch (e) {
        console.warn(`Error setting detune on ${voiceName}:`, e.message);
      }
    });
    
    if (!atLeastOneSuccess) {
      console.warn(`Failed to set detune parameter on any voices`);
    }
    
    return;
  }
  
  // Handle volume parameter
  if (param === 'volume') {
    let atLeastOneSuccess = false;
    
    Object.entries(synth.voices).forEach(([voiceName, voice]) => {
      try {
        if (!voice) return;
        
        if (voice.volume && typeof voice.volume.value !== 'undefined') {
          voice.volume.value = value;
          console.log(`Set volume=${value} on ${voiceName} using volume.value`);
          atLeastOneSuccess = true;
        } else if (voice.volume !== undefined) {
          try {
            voice.volume = value;
            console.log(`Set volume=${value} on ${voiceName} directly`);
            atLeastOneSuccess = true;
          } catch (volumeError) {
            console.warn(`Error setting volume directly on ${voiceName}:`, volumeError.message);
            
            // Try alternative approach for volume
            if (voice.set) {
              voice.set({ volume: value });
              console.log(`Set volume=${value} on ${voiceName} using set method after direct failure`);
              atLeastOneSuccess = true;
            }
          }
        } else if (voice.set) {
          voice.set({ volume: value });
          console.log(`Set volume=${value} on ${voiceName} using set method`);
          atLeastOneSuccess = true;
        }
      } catch (e) {
        console.warn(`Error setting volume on ${voiceName}:`, e.message);
      }
    });
    
    if (!atLeastOneSuccess) {
      console.warn(`Failed to set volume parameter on any voices`);
    }
    
    return;
  }
  
  // Handle special parameters for padsynth modulation effects
  if (synth.modulation) {
    try {
      // Filter parameters
      if (param === 'filterFreq' && synth.modulation.padFilter) {
        synth.modulation.padFilter.frequency.value = value;
        console.log(`Set filter frequency=${value} on padsynth modulation`);
        return;
      } else if (param === 'filterQ' && synth.modulation.padFilter) {
        synth.modulation.padFilter.Q.value = value;
        console.log(`Set filter Q=${value} on padsynth modulation`);
        return;
      }
      
      // Vibrato parameters  
      else if (param === 'vibratoDepth' && synth.modulation.vibrato) {
        synth.modulation.vibrato.depth.value = value;
        console.log(`Set vibrato depth=${value} on padsynth modulation`);
        return;
      } else if (param === 'vibratoRate' && synth.modulation.vibrato) {
        synth.modulation.vibrato.frequency.value = value;
        console.log(`Set vibrato rate=${value} on padsynth modulation`);
        return;
      }
      
      // Phaser parameters
      else if (param === 'phaserFreq' && synth.modulation.phaser) {
        synth.modulation.phaser.frequency.value = value;
        console.log(`Set phaser frequency=${value} on padsynth modulation`);
        return;
      } else if (param === 'phaserDepth' && synth.modulation.phaser) {
        synth.modulation.phaser.depth.value = value;
        console.log(`Set phaser depth=${value} on padsynth modulation`);
        return;
      } 
      
      // AutoPanner parameters
      else if (param === 'pannerRate' && synth.modulation.autoPanner) {
        synth.modulation.autoPanner.frequency.value = value;
        console.log(`Set panner rate=${value} on padsynth modulation`);
        return;
      } else if (param === 'pannerDepth' && synth.modulation.autoPanner) {
        synth.modulation.autoPanner.depth.value = value;
        console.log(`Set panner depth=${value} on padsynth modulation`);
        return;
      }
      
      // If we get here, the parameter wasn't recognized
      console.warn(`Unrecognized pad synth parameter: ${param}`);
    } catch (modulationError) {
      console.error(`Error setting modulation parameter ${param}:`, modulationError.message);
    }
    return;
  } else {
    console.warn('No modulation property found on pad synth');
  }
  
  // If we get here, the parameter wasn't handled
  console.warn(`Unhandled pad synth parameter: ${param}`);
};

/**
 * Map legacy parameter names to the new Tone.js parameter structure
 */
function mapLegacyParameter(param) {
  const paramMappings = {
    // PolySynth params
    polyVolume: { volume: null },
    polyDetune: { detune: null },
    polyAttack: { envelope: { attack: null } },
    polyDecay: { envelope: { decay: null } },
    polySustain: { envelope: { sustain: null } },
    polyRelease: { envelope: { release: null } },
    
    // FMSynth params
    fmVolume: { volume: null },
    fmModulationIndex: { modulationIndex: null },
    fmHarmonicity: { harmonicity: null },
    fmAttack: { envelope: { attack: null } },
    fmDecay: { envelope: { decay: null } },
    fmSustain: { envelope: { sustain: null } },
    fmRelease: { envelope: { release: null } },
    
    // PadSynth params
    padVolume: { volume: null },
    padDetune: { detune: null },
    padAttack: { envelope: { attack: null } },
    padDecay: { envelope: { decay: null } },
    padSustain: { envelope: { sustain: null } },
    padRelease: { envelope: { release: null } },
    padFilterFreq: { filterFrequency: null }
  };
  
  return paramMappings[param] || null;
}

/**
 * Safely set a deeply nested property by path
 */
function setPropByPath(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined) {
      throw new Error(`Property path does not exist: ${path} (stopped at ${parts[i]})`);
    }
    current = current[parts[i]];
  }
  
  const lastPart = parts[parts.length - 1];
  if (current[lastPart] !== undefined) {
    if (typeof current[lastPart] === 'object' && current[lastPart] !== null && 'value' in current[lastPart]) {
      // Handle Tone.js Signal objects which have a .value property
      current[lastPart].value = value;
    } else {
      current[lastPart] = value;
    }
  } else {
    throw new Error(`Property ${lastPart} does not exist in ${path}`);
  }
}

/**
 * Updates a parameter on an audio effect
 * @param {Object} effectsChain - The effects chain object
 * @param {string} effectType - The type of effect (e.g., 'reverb', 'delay')
 * @param {string} param - The parameter to update (e.g., 'Decay', 'Time')
 * @param {number} value - The new value for the parameter
 */
export const updateEffectParameter = (effectsChain, effectType, param, value) => {
  if (!effectsChain) {
    console.warn('No effects chain provided');
    return;
  }
  
  const parsedValue = typeof value === 'string' ? parseFloat(value) : value;
  
  try {
    // Special handling for masterVolume
    if (effectType === 'masterVolume') {
      if (effectsChain.masterVolume) {
        console.log(`Setting master volume to ${parsedValue}dB`);
        effectsChain.masterVolume.volume.value = parsedValue;
        return;
      } else {
        console.warn('Master volume not found in effects chain');
        return;
      }
    }
    
    // Handle regular effects
    const effect = effectsChain[effectType];
    if (!effect) {
      console.warn(`Effect ${effectType} not found in effects chain`);
      return;
    }
    
    // Handle special parameters
    if (param === 'wet' || param === 'dry') {
      if (effect[param] && typeof effect[param].value !== 'undefined') {
        effect[param].value = parsedValue;
      } else {
        effect.set({ [param]: parsedValue });
      }
    } else if (effect[param] && typeof effect[param].value !== 'undefined') {
      // Handle audio params
      effect[param].value = parsedValue;
    } else if (typeof effect[param] !== 'undefined') {
      // Handle direct properties
      effect[param] = parsedValue;
    } else if (effect.set) {
      // Try the set method as a fallback
      effect.set({ [param]: parsedValue });
    } else {
      console.warn(`Could not update parameter ${param} on effect ${effectType}`);
    }
  } catch (error) {
    console.error(`Error updating effect parameter ${effectType}.${param}:`, error);
  }
}; 