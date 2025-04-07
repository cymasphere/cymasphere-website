import React from "react";
import styled from "styled-components";
import EnergyBall from "@/components/common/EnergyBall";

interface LoadingContainerProps {
  fullScreen?: boolean;
}

const LoadingContainer = styled.div<LoadingContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: ${(props) => (props.fullScreen ? "100vh" : "100%")};
  position: ${(props) => (props.fullScreen ? "fixed" : "relative")};
  top: ${(props) => (props.fullScreen ? "0" : "auto")};
  left: ${(props) => (props.fullScreen ? "0" : "auto")};
  z-index: ${(props) => (props.fullScreen ? "9999" : "1")};
  background: "transparent";
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  font-size: 1rem;
  color: #6c63ff;
  text-align: center;
`;

interface LoadingComponentProps {
  size?: string;
  text?: string;
  fullScreen?: boolean;
}

const LoadingComponent: React.FC<LoadingComponentProps> = ({
  size = "60px",
  text,
  fullScreen = false,
}) => {
  return (
    <LoadingContainer fullScreen={fullScreen}>
      <EnergyBall size={size} marginRight="0" />
      {text && <LoadingText>{text}</LoadingText>}
    </LoadingContainer>
  );
};

export default LoadingComponent;
