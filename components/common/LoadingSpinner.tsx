import React from "react";
import styled from "styled-components";
import EnergyBall from "./EnergyBall";
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
  width: 100%;
  background-color: var(--background);
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const EnergyBallContainer = styled.div`
  margin-bottom: 30px;
`;

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

// Define interface for component props
interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large";
  fullScreen?: boolean;
  text?: string;
}

/**
 * Simplified loading spinner for the Cymasphere app
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "medium",
  fullScreen = false,
  text = "Loading...",
}) => {
  const energyBallSize =
    size === "large" ? "140px" : size === "small" ? "80px" : "120px";

  return (
    <Container $fullScreen={fullScreen}>
      <LoadingWrapper>
        <EnergyBallContainer>
          <EnergyBall size={energyBallSize} />
        </EnergyBallContainer>
        <CymasphereLogo size="60px" showText={false} />
        {text && <LoadingText $size={size}>{text}</LoadingText>}
      </LoadingWrapper>
    </Container>
  );
};

export default LoadingSpinner;
