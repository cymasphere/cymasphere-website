/**
 * @fileoverview WaveDivider Component
 * @module components/common/WaveDivider
 * 
 * A decorative wave divider component that creates smooth transitions between
 * sections with different background colors. Generates SVG wave patterns with
 * customizable complexity and orientation.
 * 
 * @example
 * // Basic usage
 * <WaveDivider topColor="#1A1A2E" bottomColor="#ffffff" />
 * 
 * @example
 * // Complex wave with inversion
 * <WaveDivider 
 *   topColor="#000000" 
 *   bottomColor="#ffffff" 
 *   complexity={3} 
 *   invert={true} 
 * />
 */

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
 * @brief Props for WaveDivider component
 */
interface WaveDividerProps {
  /** @param {string} [topColor="#1A1A2E"] - Color of the section above the divider */
  topColor?: string;
  /** @param {string} [bottomColor="#ffffff"] - Color of the section below the divider */
  bottomColor?: string;
  /** @param {React.CSSProperties} [style] - Additional inline styles */
  style?: React.CSSProperties;
  /** @param {1|2|3} [complexity=2] - Wave complexity level (1=simple, 2=medium, 3=complex) */
  complexity?: 1 | 2 | 3;
  /** @param {boolean} [invert=false] - If true, inverts the wave pattern */
  invert?: boolean;
}

/**
 * @brief WaveDivider component
 * 
 * Creates a seamless audio waveform-like transition between sections with
 * different background colors. Uses SVG paths to generate smooth wave patterns
 * that can be customized for complexity and orientation.
 * 
 * @param {WaveDividerProps} props - Component props
 * @returns {JSX.Element} The rendered wave divider component
 * 
 * @note Uses negative margins to overlap with adjacent sections for seamless transition
 * @note SVG viewBox is 1600x100 for responsive scaling
 * @note Complexity levels affect the number of wave peaks and valleys
 * @note Invert option flips the wave pattern vertically
 */
const WaveDivider = ({ 
  topColor = "#1A1A2E", 
  bottomColor = "#ffffff",
  style = {},
  complexity = 2,
  invert = false
}: WaveDividerProps) => {
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