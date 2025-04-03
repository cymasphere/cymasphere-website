import React from 'react';
import styled from 'styled-components';

// Styles for the divider container
const DividerContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100px;
  overflow: hidden;
  margin-top: -50px; // Overlap with previous section
  margin-bottom: -50px; // Overlap with next section
  z-index: 1;
`;

// The actual SVG wave
const WaveSVG = styled.svg`
  position: absolute;
  width: 100%;
  height: 100%;
  display: block;
`;

/**
 * WaveDivider component
 * Creates a subtle, seamless audio waveform-like transition between sections
 * 
 * @param {Object} props
 * @param {string} props.topColor - The color of the section above
 * @param {string} props.bottomColor - The color of the section below
 * @param {number} props.complexity - Controls the complexity of the wave (1-3)
 * @param {boolean} props.invert - If true, inverts the wave pattern
 */
const WaveDivider = ({ 
  topColor = "#1A1A2E", 
  bottomColor = "#ffffff",
  style = {},
  complexity = 2,
  invert = false
}) => {
  // Generate path based on complexity
  const getWavePath = () => {
    if (complexity === 1) {
      // Subtle simple wave
      return invert 
        ? "M0,0 L0,20 Q400,5 800,20 T1600,20 L1600,0 Z" 
        : "M0,100 L0,80 Q400,95 800,80 T1600,80 L1600,100 Z";
    } else if (complexity === 3) {
      // Subtle complex wave
      return invert
        ? "M0,0 L0,25 Q200,15 400,25 T800,35 T1200,25 T1600,15 L1600,0 Z"
        : "M0,100 L0,75 Q200,85 400,75 T800,65 T1200,75 T1600,85 L1600,100 Z";
    } else {
      // Default subtle medium complexity
      return invert
        ? "M0,0 L0,20 Q400,10 800,25 T1600,15 L1600,0 Z"
        : "M0,100 L0,80 Q400,90 800,75 T1600,85 L1600,100 Z";
    }
  };

  return (
    <DividerContainer style={style}>
      <WaveSVG 
        viewBox="0 0 1600 100" 
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d={getWavePath()}
          fill={invert ? bottomColor : topColor}
        />
      </WaveSVG>
    </DividerContainer>
  );
};

export default WaveDivider; 