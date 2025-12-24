/**
 * @fileoverview LoadingSkeleton Components
 * @module components/common/LoadingSkeleton
 * 
 * A collection of skeleton loading components for displaying placeholder content
 * while data is being loaded. Includes specialized skeletons for text, cards,
 * avatars, buttons, sections, and headers.
 * 
 * @example
 * // Text skeleton with multiple lines
 * <TextSkeleton lines={3} width={["100%", "80%", "60%"]} />
 * 
 * @example
 * // Card skeleton
 * <CardSkeleton width="300px" height="200px" />
 * 
 * @example
 * // Avatar skeleton
 * <AvatarSkeleton size="50px" />
 */

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

/**
 * @brief Props for TextSkeleton component
 */
interface TextSkeletonProps {
  /** @param {number} [lines=1] - Number of text lines to display */
  lines?: number;
  /** @param {string|string[]} [width] - Width(s) for each line. Array for different widths per line */
  width?: string | string[];
  /** @param {string} [className] - Additional CSS class names */
  className?: string;
  /** @param {React.CSSProperties} [style] - Inline styles */
  style?: React.CSSProperties;
}

/**
 * @brief TextSkeleton component
 * 
 * Displays animated skeleton placeholders for text content.
 * Supports multiple lines with customizable widths.
 * 
 * @param {TextSkeletonProps} props - Component props
 * @returns {JSX.Element} The rendered text skeleton component
 * 
 * @note If width is an array, each line uses the corresponding width value
 * @note If width is a string, all lines use that width
 * @note If width is not provided, lines progressively get narrower
 */
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

/**
 * @brief Props for generic skeleton components
 */
interface GenericSkeletonProps {
  /** @param {string} [width] - Width of the skeleton element */
  width?: string;
  /** @param {string} [height] - Height of the skeleton element */
  height?: string;
  /** @param {string} [className] - Additional CSS class names */
  className?: string;
  /** @param {React.CSSProperties} [style] - Inline styles */
  style?: React.CSSProperties;
}

/**
 * @brief CardSkeleton component
 * 
 * Displays an animated skeleton placeholder for card content.
 * 
 * @param {GenericSkeletonProps} props - Component props
 * @returns {JSX.Element} The rendered card skeleton component
 * 
 * @note Default size is 100% width and 200px height
 */
export const CardSkeleton = ({
  width = "100%",
  height = "200px",
  ...props
}: GenericSkeletonProps) => (
  <SkeletonWrapper $width={width} $height={height} {...props} />
);

/**
 * @brief Props for AvatarSkeleton component
 */
interface AvatarSkeletonProps {
  /** @param {string} [size="40px"] - Size of the circular avatar */
  size?: string;
  /** @param {string} [className] - Additional CSS class names */
  className?: string;
  /** @param {React.CSSProperties} [style] - Inline styles */
  style?: React.CSSProperties;
}

/**
 * @brief AvatarSkeleton component
 * 
 * Displays an animated circular skeleton placeholder for avatar images.
 * 
 * @param {AvatarSkeletonProps} props - Component props
 * @returns {JSX.Element} The rendered avatar skeleton component
 * 
 * @note Always renders as a perfect circle (border-radius: 50%)
 */
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

/**
 * @brief ButtonSkeleton component
 * 
 * Displays an animated skeleton placeholder for button elements.
 * 
 * @param {GenericSkeletonProps} props - Component props
 * @returns {JSX.Element} The rendered button skeleton component
 * 
 * @note Default size is 120px width and 40px height
 */
export const ButtonSkeleton = ({
  width = "120px",
  height = "40px",
  ...props
}: GenericSkeletonProps) => (
  <SkeletonWrapper $width={width} $height={height} {...props} />
);

/**
 * @brief Props for SectionSkeleton component
 */
interface SectionSkeletonProps {
  /** @param {React.ReactNode} children - Child skeleton components to render */
  children: React.ReactNode;
  /** @param {string} [className] - Additional CSS class names */
  className?: string;
  /** @param {React.CSSProperties} [style] - Inline styles */
  style?: React.CSSProperties;
}

/**
 * @brief SectionSkeleton component
 * 
 * Container component for grouping multiple skeleton elements into a page section.
 * Provides consistent padding and layout for skeleton content.
 * 
 * @param {SectionSkeletonProps} props - Component props
 * @returns {JSX.Element} The rendered section skeleton component
 * 
 * @note Default padding is 40px 20px
 */
export const SectionSkeleton = ({
  children,
  ...props
}: SectionSkeletonProps) => (
  <Container $padding="40px 20px" {...props}>
    {children}
  </Container>
);

/**
 * @brief HeaderSkeleton component
 * 
 * Pre-configured skeleton layout for page headers with logo and navigation items.
 * 
 * @returns {JSX.Element} The rendered header skeleton component
 * 
 * @note Includes logo placeholder and multiple navigation item placeholders
 * @note Uses horizontal flex layout with space-between alignment
 */
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
