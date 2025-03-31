import React from 'react';
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const SkeletonWrapper = styled.div`
  width: ${props => props.$width || '100%'};
  height: ${props => props.$height || '20px'};
  border-radius: ${props => props.$borderRadius || '4px'};
  margin: ${props => props.$margin || '0'};
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 37%,
    rgba(255, 255, 255, 0.05) 63%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite linear;
`;

const Container = styled.div`
  display: flex;
  flex-direction: ${props => props.$direction || 'column'};
  gap: ${props => props.$gap || '10px'};
  width: ${props => props.$width || '100%'};
  padding: ${props => props.$padding || '0'};
`;

// Basic skeleton for text lines
export const TextSkeleton = ({ lines = 1, width, ...props }) => (
  <Container {...props}>
    {Array(lines).fill(0).map((_, i) => (
      <SkeletonWrapper 
        key={i} 
        $width={typeof width === 'object' ? width[i] || '100%' : width || `${100 - (i * 10)}%`} 
        $height="16px"
      />
    ))}
  </Container>
);

// Skeleton for cards
export const CardSkeleton = ({ width = '100%', height = '200px', ...props }) => (
  <SkeletonWrapper $width={width} $height={height} {...props} />
);

// Avatar circle skeleton
export const AvatarSkeleton = ({ size = '40px', ...props }) => (
  <SkeletonWrapper $width={size} $height={size} $borderRadius="50%" {...props} />
);

// Button skeleton
export const ButtonSkeleton = ({ width = '120px', height = '40px', ...props }) => (
  <SkeletonWrapper $width={width} $height={height} {...props} />
);

// Page section skeleton
export const SectionSkeleton = ({ children, ...props }) => (
  <Container $padding="40px 20px" {...props}>
    {children}
  </Container>
);

// Header skeleton
export const HeaderSkeleton = () => (
  <Container $direction="row" $padding="20px" $gap="20px" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
    <SkeletonWrapper $width="150px" $height="30px" />
    <Container $direction="row" $gap="20px" style={{ width: 'auto', alignItems: 'center' }}>
      <SkeletonWrapper $width="80px" $height="20px" />
      <SkeletonWrapper $width="80px" $height="20px" />
      <SkeletonWrapper $width="80px" $height="20px" />
      <SkeletonWrapper $width="100px" $height="36px" $borderRadius="18px" />
    </Container>
  </Container>
);

export default {
  TextSkeleton,
  CardSkeleton,
  AvatarSkeleton,
  ButtonSkeleton,
  SectionSkeleton,
  HeaderSkeleton
}; 