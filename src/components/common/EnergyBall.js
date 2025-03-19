import React from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(108, 99, 255, 0.7);
  }
  
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px rgba(108, 99, 255, 0);
  }
  
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(108, 99, 255, 0);
  }
`;

const rotate = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const Container = styled.div`
  position: relative;
  width: ${props => props.$size || '40px'};
  height: ${props => props.$size || '40px'};
  margin-right: ${props => props.$marginRight || '10px'};
`;

const Ball = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #6c63ff, #4ecdc4);
  animation: ${pulse} 2s infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  
  &::before {
    content: "";
    position: absolute;
    top: -5%;
    left: -5%;
    right: -5%;
    bottom: -5%;
    background: linear-gradient(45deg, rgba(108, 99, 255, 0.8), rgba(78, 205, 196, 0.8), rgba(108, 99, 255, 0.8));
    background-size: 200% 200%;
    animation: ${shimmer} 3s linear infinite;
    border-radius: 50%;
    z-index: -1;
    opacity: 0.7;
  }
`;

const Ring = styled.div`
  position: absolute;
  top: -15%;
  left: -15%;
  right: -15%;
  bottom: -15%;
  border-radius: 50%;
  border: 2px solid rgba(108, 99, 255, 0.5);
  border-top: 2px solid rgba(78, 205, 196, 0.8);
  animation: ${rotate} 3s linear infinite;
`;

const Core = styled.div`
  width: 60%;
  height: 60%;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #fff, #6c63ff);
  opacity: 0.9;
  box-shadow: 0 0 10px 2px rgba(255, 255, 255, 0.7);
`;

const EnergyBall = ({ size, marginRight }) => {
  return (
    <Container $size={size} $marginRight={marginRight}>
      <Ball>
        <Core />
      </Ball>
      <Ring />
    </Container>
  );
};

export default EnergyBall; 