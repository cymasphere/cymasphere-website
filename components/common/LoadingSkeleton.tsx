import React from "react";
import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

interface SkeletonWrapperProps {
  $width?: string;
  $height?: string;
  $borderRadius?: string;
  $margin?: string;
}

const SkeletonWrapper = styled.div<SkeletonWrapperProps>`
  width: ${(props) => props.$width || "100%"};
  height: ${(props) => props.$height || "20px"};
  border-radius: ${(props) => props.$borderRadius || "4px"};
  margin: ${(props) => props.$margin || "0"};
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.05) 25%,
    rgba(255, 255, 255, 0.1) 37%,
    rgba(255, 255, 255, 0.05) 63%
  );
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s infinite linear;
`;

interface ContainerProps {
  $direction?: string;
  $gap?: string;
  $width?: string;
  $padding?: string;
}

const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: ${(props) => props.$direction || "column"};
  gap: ${(props) => props.$gap || "10px"};
  width: ${(props) => props.$width || "100%"};
  padding: ${(props) => props.$padding || "0"};
`;

interface TextSkeletonProps {
  lines?: number;
  width?: string | string[];
  className?: string;
  style?: React.CSSProperties;
}

// Basic skeleton for text lines
export const TextSkeleton = ({
  lines = 1,
  width,
  ...props
}: TextSkeletonProps) => (
  <Container {...props}>
    {Array(lines)
      .fill(0)
      .map((_, i) => (
        <SkeletonWrapper
          key={i}
          $width={
            typeof width === "object"
              ? width[i] || "100%"
              : width || `${100 - i * 10}%`
          }
          $height="16px"
        />
      ))}
  </Container>
);

interface GenericSkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Skeleton for cards
export const CardSkeleton = ({
  width = "100%",
  height = "200px",
  ...props
}: GenericSkeletonProps) => (
  <SkeletonWrapper $width={width} $height={height} {...props} />
);

interface AvatarSkeletonProps {
  size?: string;
  className?: string;
  style?: React.CSSProperties;
}

// Avatar circle skeleton
export const AvatarSkeleton = ({
  size = "40px",
  ...props
}: AvatarSkeletonProps) => (
  <SkeletonWrapper
    $width={size}
    $height={size}
    $borderRadius="50%"
    {...props}
  />
);

// Button skeleton
export const ButtonSkeleton = ({
  width = "120px",
  height = "40px",
  ...props
}: GenericSkeletonProps) => (
  <SkeletonWrapper $width={width} $height={height} {...props} />
);

interface SectionSkeletonProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

// Page section skeleton
export const SectionSkeleton = ({
  children,
  ...props
}: SectionSkeletonProps) => (
  <Container $padding="40px 20px" {...props}>
    {children}
  </Container>
);

// Header skeleton
export const HeaderSkeleton = () => (
  <Container
    $direction="row"
    $padding="20px"
    $gap="20px"
    style={{ alignItems: "center", justifyContent: "space-between" }}
  >
    <SkeletonWrapper $width="150px" $height="30px" />
    <Container
      $direction="row"
      $gap="20px"
      style={{ width: "auto", alignItems: "center" }}
    >
      <SkeletonWrapper $width="80px" $height="20px" />
      <SkeletonWrapper $width="80px" $height="20px" />
      <SkeletonWrapper $width="80px" $height="20px" />
      <SkeletonWrapper $width="100px" $height="36px" $borderRadius="18px" />
    </Container>
  </Container>
);

const skeletonComponents = {
  TextSkeleton,
  CardSkeleton,
  AvatarSkeleton,
  ButtonSkeleton,
  SectionSkeleton,
  HeaderSkeleton,
};

export default skeletonComponents;
