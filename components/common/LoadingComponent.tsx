/**
 * @fileoverview LoadingComponent
 * @module components/common/LoadingComponent
 * 
 * A full-featured loading indicator component that displays an animated energy ball
 * with optional text. Supports both inline and full-screen display modes.
 * 
 * @example
 * // Inline loading
 * <LoadingComponent text="Loading data..." />
 * 
 * @example
 * // Full-screen loading overlay
 * <LoadingComponent 
 *   size="80px" 
 *   text="Please wait..." 
 *   fullScreen={true} 
 * />
 */

import React from "react";
import styled from "styled-components";
import EnergyBall from "@/components/common/EnergyBall";

interface LoadingContainerProps {
  $fullScreen?: boolean;
}

const LoadingContainer = styled.div<LoadingContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: ${(props) => (props.$fullScreen ? "100vh" : "100%")};
  position: ${(props) => (props.$fullScreen ? "fixed" : "relative")};
  top: ${(props) => (props.$fullScreen ? "0" : "auto")};
  left: ${(props) => (props.$fullScreen ? "0" : "auto")};
  z-index: ${(props) => (props.$fullScreen ? "9999" : "1")};
  background: "transparent";
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  font-size: 1rem;
  color: white;
  text-align: center;
`;

/**
 * @brief Props for the LoadingComponent
 */
interface LoadingComponentProps {
  /** @param {string} [size="60px"] - Size of the energy ball icon */
  size?: string;
  /** @param {string} [text] - Optional loading message to display */
  text?: string;
  /** @param {boolean} [fullScreen=false] - If true, displays as full-screen overlay */
  fullScreen?: boolean;
}

/**
 * @brief LoadingComponent
 * 
 * Displays a loading indicator with an animated energy ball and optional text.
 * Can be used inline within a container or as a full-screen overlay.
 * 
 * @param {LoadingComponentProps} props - Component props
 * @returns {JSX.Element} The rendered loading component
 * 
 * @note Full-screen mode uses fixed positioning and high z-index
 * @note Text is optional and only displays if provided
 */
const LoadingComponent: React.FC<LoadingComponentProps> = ({
  size = "60px",
  text,
  fullScreen = false,
}) => {
  return (
    <LoadingContainer $fullScreen={fullScreen}>
      <EnergyBall size={size} marginRight="0" />
      {text && <LoadingText>{text}</LoadingText>}
    </LoadingContainer>
  );
};

export default LoadingComponent;
