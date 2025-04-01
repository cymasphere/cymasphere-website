import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

// Drag animation for finger gesture
const dragDown = keyframes`
  0% {
    transform: translateY(0);
    opacity: 0.6;
  }
  50% {
    transform: translateY(20px);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0.6;
  }
`;

// Subtle pulse animation
const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 10px 0;
  padding: 5px;
  width: 100%;
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

const FingerDrag = styled.div`
  font-size: 2rem;
  animation: ${dragDown} 1.8s infinite ease-in-out;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 5px;
`;

const Text = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  font-weight: 500;
  text-align: center;
  animation: ${pulse} 3s infinite ease-in-out;
`;

const DragIndicator = ({ visible = true }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Only show after a delay to avoid distracting initially
    const timer = setTimeout(() => {
      setIsVisible(visible);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [visible]);
  
  return (
    <Container visible={isVisible}>
      <FingerDrag>👆</FingerDrag>
      <Text>Drag chords down to create your progression</Text>
    </Container>
  );
};

export default DragIndicator; 