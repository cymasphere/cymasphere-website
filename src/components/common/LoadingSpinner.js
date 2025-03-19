import React from 'react';
import styled, { keyframes } from 'styled-components';
import EnergyBall from './EnergyBall';

// Pulse animation for the text
const textPulse = keyframes`
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: ${props => props.$fullScreen ? '100vh' : '200px'};
  width: 100%;
  background-color: var(--background);
`;

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
`;

const LogoContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
`;

const EnergyBallContainer = styled.div`
  margin-bottom: 30px;
`;

const LogoText = styled.div`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  font-weight: 700;
  font-size: ${props => props.$size === 'large' ? '3rem' : props.$size === 'small' ? '1.8rem' : '2.5rem'};
  
  span {
    font-family: 'Montserrat', sans-serif;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${textPulse} 2s infinite ease-in-out;
  }
`;

const LoadingText = styled.div`
  margin-top: 20px;
  color: var(--text-secondary);
  font-size: ${props => props.$size === 'large' ? '1.4rem' : props.$size === 'small' ? '1rem' : '1.2rem'};
`;

/**
 * Simplified loading spinner for the Cymasphere app
 * @param {Object} props - Component props
 * @param {string} props.size - Size of the spinner ('small', 'medium', 'large')
 * @param {boolean} props.fullScreen - Whether the spinner should take the full screen height
 * @param {string} props.text - Optional text to display below the spinner
 */
const LoadingSpinner = ({ size = 'medium', fullScreen = false, text = 'Loading...' }) => {
  const energyBallSize = size === 'large' ? '140px' : size === 'small' ? '80px' : '120px';
  
  return (
    <Container $fullScreen={fullScreen}>
      <LoadingWrapper>
        <LogoContainer>
          <EnergyBallContainer>
            <EnergyBall size={energyBallSize} />
          </EnergyBallContainer>
          <LogoText $size={size}>
            <span>CYMA</span>SPHERE
          </LogoText>
        </LogoContainer>
        {text && <LoadingText $size={size}>{text}</LoadingText>}
      </LoadingWrapper>
    </Container>
  );
};

export default LoadingSpinner; 