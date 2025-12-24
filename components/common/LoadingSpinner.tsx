/**
 * @fileoverview LoadingSpinner Component
 * @module components/common/LoadingSpinner
 * 
 * A loading spinner component that displays the Cymasphere logo with optional text.
 * Supports three size variants (small, medium, large) and full-screen overlay mode.
 * 
 * @example
 * // Basic usage
 * <LoadingSpinner />
 * 
 * @example
 * // Full-screen with custom text
 * <LoadingSpinner 
 *   size="large" 
 *   fullScreen={true} 
 *   text="Loading your content..." 
 * />
 */

import React from "react";
import styled from "styled-components";
import CymasphereLogo from "./CymasphereLogo";

// Define interfaces for styled-components props
interface ContainerProps {
  $fullScreen?: boolean;
}

interface LoadingTextProps {
  $size?: string;
}

const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: ${(props) => (props.$fullScreen ? "100vh" : "200px")};
  width: ${(props) => (props.$fullScreen ? "100vw" : "100%")};
  background-color: ${(props) => (props.$fullScreen ? "var(--bg)" : "transparent")};
  position: ${(props) => (props.$fullScreen ? "fixed" : "relative")};
  top: ${(props) => (props.$fullScreen ? 0 : "auto")};
  left: ${(props) => (props.$fullScreen ? 0 : "auto")};
  right: ${(props) => (props.$fullScreen ? 0 : "auto")};
  bottom: ${(props) => (props.$fullScreen ? 0 : "auto")};
  z-index: ${(props) => (props.$fullScreen ? 4000 : "auto")};
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

// Removed separate EnergyBall to avoid double or stacked animated orbs

const LoadingText = styled.div<LoadingTextProps>`
  margin-top: 20px;
  color: var(--text-secondary);
  font-size: ${(props) =>
    props.$size === "large"
      ? "1.4rem"
      : props.$size === "small"
      ? "1rem"
      : "1.2rem"};
`;

/**
 * @brief Props for the LoadingSpinner component
 */
interface LoadingSpinnerProps {
  /** @param {"small"|"medium"|"large"} [size="medium"] - Size variant of the spinner */
  size?: "small" | "medium" | "large";
  /** @param {boolean} [fullScreen=false] - If true, displays as full-screen overlay */
  fullScreen?: boolean;
  /** @param {string} [text="Loading..."] - Loading message text */
  text?: string;
}

/**
 * @brief LoadingSpinner component
 * 
 * Displays a loading spinner using the Cymasphere logo with optional text.
 * The logo size adapts based on the size prop, and can be displayed inline
 * or as a full-screen overlay.
 * 
 * @param {LoadingSpinnerProps} props - Component props
 * @returns {JSX.Element} The rendered loading spinner component
 * 
 * @note Size mapping: small=80px, medium=120px, large=140px
 * @note Full-screen mode uses fixed positioning with z-index 4000
 * @note Text is always displayed (defaults to "Loading...")
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  fullScreen = false,
  text = "Loading...",
}) => {
  const energyBallSize = size === "large" ? "140px" : size === "small" ? "80px" : "120px";

  return (
    <Container $fullScreen={fullScreen}>
      <LoadingWrapper>
        <CymasphereLogo size={energyBallSize} showText={false} />
        {text && <LoadingText $size={size}>{text}</LoadingText>}
      </LoadingWrapper>
    </Container>
  );
};

export default LoadingSpinner;
