"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
  FaSearchPlus,
} from "react-icons/fa";
import DOMPurify from "dompurify";
import LoadingComponent from "@/components/common/LoadingComponent";
import { useTranslation } from "react-i18next";

// Interfaces for styled-component props
interface FeatureImageProps {
  imgSrc?: string | null;
}

interface InfoFeatureImageProps {
  imgSrc?: string | null;
}

interface ContentOverlayProps {
  $visible: boolean;
}

interface IndicatorDotProps {
  $active: boolean;
}

interface SwipeIndicatorProps {
  $visible: boolean;
}

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  backdrop-filter: blur(5px);
  will-change: opacity;
  padding: 0;
`;

const ModalContainer = styled(motion.div)`
  width: 95%;
  max-width: 1200px;
  height: 90vh;
  max-height: 900px;
  background: rgba(25, 23, 36, 0.85);
  border-radius: 24px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  margin-top: 60px;

  @media (max-width: 768px) {
    width: 100%;
    height: 100vh;
    max-height: none;
    border-radius: 0;
    margin-top: 0;
    padding-top: 70px; /* Match the TitleContainer height */
    overflow: hidden; /* Prevent outer container from scrolling */
  }

  @media (max-width: 480px) {
    padding-top: 60px; /* Match the TitleContainer height */
  }

  &:before {
    content: "";
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(
      135deg,
      rgba(108, 99, 255, 0.7) 0%,
      rgba(108, 99, 255, 0.2) 50%,
      rgba(78, 205, 196, 0.7) 100%
    );
    border-radius: 28px;
    z-index: -1;
    opacity: 0.7;
    filter: blur(8px);

    @media (max-width: 768px) {
      border-radius: 0;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
    }
  }

  /* Custom outline style for focus */
  &:focus {
    outline: none;
    border: 1px solid var(--primary);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--primary);

    @media (max-width: 768px) {
      border: none;
      box-shadow: none;
    }
  }
`;

const TitleContainer = styled.div`
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 60px;
  z-index: 9500 !important;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(25, 23, 36, 0.95);
  backdrop-filter: blur(15px);
  height: 80px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 15px 50px;
    height: 70px;
  }

  @media (max-width: 480px) {
    padding: 10px 40px;
    height: 60px;
  }

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(108, 99, 255, 0.4),
      rgba(78, 205, 196, 0.4),
      transparent
    );
  }
`;

const ModalTitle = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
  color: white;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1.5rem;
    padding-left: 0;
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(108, 99, 255, 0.7);
    transform: scale(1);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(108, 99, 255, 0);
    transform: scale(1.05);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(108, 99, 255, 0);
    transform: scale(1);
  }
`;

const InfoButton = styled.button`
  position: fixed !important;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 9600 !important;
  transition: all 0.3s ease;
  animation: ${pulse} 2s infinite;

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 18px;
    top: 16px;
    left: 16px;
    display: none; /* Hide on mobile */
  }

  &:hover {
    background: var(--primary);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(108, 99, 255, 0.5);
    animation: none;
  }
`;

const CloseButton = styled.button`
  position: fixed !important;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 9600 !important;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 18px;
    top: 16px;
    right: 16px;
  }

  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
    font-size: 18px;
  }

  &:hover {
    background: var(--primary);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(108, 99, 255, 0.5);
  }
`;

const CarouselContainer = styled.div`
  flex: 1;
  width: 100%;
  position: relative;
  overflow: hidden;
  margin-top: 80px; /* Same as TitleContainer height */
  margin-bottom: 80px; /* Same as CarouselControls height */
  height: calc(100% - 160px); /* Subtract both header and footer heights */
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 768px) {
    margin-top: 0; /* No top margin needed since we padded the container */
    margin-bottom: 70px; /* Account for fixed footer */
    height: calc(100% - 70px);
    padding-top: 30px; /* Add space between header and content */
  }

  @media (max-width: 480px) {
    margin-top: 0;
    margin-bottom: 60px; /* Account for fixed footer */
    height: calc(100% - 60px);
    padding-top: 25px; /* Add space between header and content */
  }
`;

const Slide = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;

  @media (max-width: 768px) {
    justify-content: flex-start;
    padding: 20px 15px;
    gap: 20px; /* Space between image and text */
    overflow-y: auto;
  }

  @media (max-width: 480px) {
    padding: 15px 10px;
    gap: 15px; /* Space between image and text */
  }
`;

const ImageContainer = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(10, 10, 15, 0.3);
  padding-top: 0;

  @media (max-width: 768px) {
    height: auto;
    min-height: 200px;
    max-height: 40vh;
    padding: 0;
    margin: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-shrink: 0;
    border-radius: 12px;
    overflow: hidden;
  }

  @media (max-width: 480px) {
    min-height: 180px;
    max-height: 35vh;
    border-radius: 8px;
  }
`;

const FeatureImage = styled.div<FeatureImageProps>`
  width: 100%;
  height: 100%;
  background-color: transparent;
  background-image: ${(props) =>
    props.imgSrc ? `url(${props.imgSrc})` : "none"};
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  position: relative;

  @media (max-width: 768px) {
    background-size: contain;
    background-position: top center; /* Position image at top of container */
    align-items: flex-start; /* Align content to top */
  }

  /* Show text only if no image is provided */
  ${(props) =>
    props.imgSrc &&
    `
    font-size: 0;
    &::after {
      content: none;
    }
  `}
`;

const ContentOverlay = styled.div<ContentOverlayProps>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 14, 22, 0.97);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  opacity: ${(props) => (props.$visible ? 1 : 0)};
  pointer-events: ${(props) => (props.$visible ? "auto" : "none")};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(20px);
  padding-top: 20px;
  padding-left: 40px;
  padding-right: 40px;
  padding-bottom: 20px;
  overflow-y: auto;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */

  @media (max-width: 768px) {
    position: relative;
    background: transparent;
    backdrop-filter: none;
    padding: 0;
    height: auto;
    overflow: visible;
    opacity: 1 !important;
    pointer-events: auto !important;
  }

  @media (max-width: 480px) {
    position: relative;
    padding: 0;
    height: auto;
  }

  /* Scrollbar styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(108, 99, 255, 0.3);
    border-radius: 4px;

    &:hover {
      background: rgba(108, 99, 255, 0.5);
    }
  }
`;

const ContentContainer = styled.div`
  max-width: 1000px;
  width: 100%;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 30px;
  padding-bottom: 10px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 0 0 10px 0; /* Reduce bottom padding */
  }

  @media (max-width: 480px) {
    padding: 0 0 10px 0; /* Reduce bottom padding */
  }
`;

const InfoImageContainer = styled.div`
  width: 40%;
  max-width: 400px;
  height: 260px;
  border-radius: 12px;
  overflow: visible;
  position: sticky;
  top: 50%;
  transform: translateY(-50%);
  align-self: center;
  background: rgba(10, 10, 15, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    display: none; /* Hide duplicate image on mobile */
  }

  @media (max-width: 480px) {
    display: none; /* Hide duplicate image on mobile */
  }

  &:hover {
    z-index: 10;
  }
`;

const InfoFeatureImage = styled.div<InfoFeatureImageProps>`
  width: 100%;
  height: 100%;
  background-color: transparent;
  background-image: ${(props) =>
    props.imgSrc ? `url(${props.imgSrc})` : "none"};
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 24px;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.3s ease;
  border-radius: 12px;
  overflow: hidden;

  @media (max-width: 768px) {
    font-size: 20px;
    background-size: contain;
    border-radius: 8px;
    transform: none !important;
    box-shadow: none !important;
  }

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);

    @media (max-width: 768px) {
      transform: none;
      box-shadow: none;
    }
  }

  /* Show text only if no image is provided */
  ${(props) =>
    props.imgSrc &&
    `
    font-size: 0;
    &::after {
      content: none;
    }
  `}
`;

const ContentTextContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: visible;
  padding-right: 10px;

  @media (max-width: 768px) {
    width: 100%;
    padding-right: 0;
    padding-top: 0;
    flex: 1;
    min-height: 0; /* Allow content to shrink */
    height: auto;
    padding-bottom: 0; /* Remove padding */
    overflow: visible;
  }

  @media (max-width: 480px) {
    padding-top: 0;
    padding-bottom: 0; /* Remove padding */
  }
`;

const FeatureDescription = styled.div`
  font-size: clamp(0.9rem, 1.5vw, 1.1rem);
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.95);
  flex: 1;
  min-height: 0;
  font-weight: 400; /* ensure default regular weight */

  h3 {
    font-size: clamp(1.4rem, 2vw, 1.7rem);
    font-weight: 700;
    margin-top: 0;
    margin-bottom: 10px;
    background: linear-gradient(135deg, #6c63ff, #4ecdc4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
    display: inline-block;
  }

  p {
    margin-bottom: 10px;
    font-weight: 400;
  }

  ul {
    list-style: disc;
    list-style-position: outside;
    padding-left: 22px;
    margin-top: 8px;
    margin-bottom: 10px;
  }

  li {
    margin-bottom: 8px;
    position: relative;

    /* Ensure default bullet markers are visible even if globals reset them */
    list-style: inherit;

    @media (max-width: 480px) {
      margin-bottom: 12px;
    }
  }

  /* Only bold the keyword wrappers; everything else stays regular */
  b,
  strong {
    font-weight: 700;
  }

  /* Gradient-highlight the keyword inside list items */
  li strong {
    font-weight: 800;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: transparent;
  }
`;

const CarouselControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  height: 80px;
  box-sizing: border-box;
  background: rgba(25, 23, 36, 0.9);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9400;

  @media (max-width: 768px) {
    height: 70px;
    padding: 15px;
    position: fixed;
    bottom: 0;
  }

  @media (max-width: 480px) {
    height: 60px;
    padding: 10px;
  }

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(108, 99, 255, 0.3),
      rgba(78, 205, 196, 0.3),
      transparent
    );
  }
`;

const ControlButton = styled.button`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(20, 18, 30, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: 44px;
    height: 44px;
    font-size: 18px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }

  &:hover {
    background: var(--primary);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(108, 99, 255, 0.5);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;

    &:hover {
      background: rgba(20, 18, 30, 0.5);
      transform: none;
      box-shadow: none;
    }
  }
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex: 1;
  margin: 0 20px;

  @media (max-width: 768px) {
    gap: 10px;
    margin: 0 15px;
  }

  @media (max-width: 480px) {
    gap: 8px;
    margin: 0 10px;
  }
`;

const IndicatorDot = styled.button<IndicatorDotProps>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${(props) =>
    props.$active ? "var(--primary)" : "rgba(255, 255, 255, 0.2)"};
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.$active ? "0 0 8px rgba(108, 99, 255, 0.6)" : "none"};
  transform: ${(props) => (props.$active ? "scale(1.2)" : "scale(1)")};

  @media (max-width: 480px) {
    width: 10px;
    height: 10px;
  }

  &:hover {
    background: ${(props) =>
      props.$active ? "var(--primary)" : "rgba(255, 255, 255, 0.4)"};
  }
`;

// Memoized HTML parser to prevent re-parsing on every render
const ParseHtml = React.memo(({ htmlContent }: { htmlContent: string | React.ReactElement }): React.ReactNode => {
  // If the content is already a React element, return it
  if (React.isValidElement(htmlContent)) {
    return htmlContent;
  }

  // Otherwise sanitize the HTML string
  if (typeof htmlContent === "string") {
    return (
      <div
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(htmlContent),
        }}
      />
    );
  }

  return null;
});

// Add this new component for better image debugging
const ImageDebug = styled.div`
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 100;
  opacity: 0.7;
`;

// Function to get image path based on feature title
const getImagePath = (title: string): { webp: string; png: string } | null => {
  if (!title) return null;

  // Explicitly use absolute paths with the public URL
  const publicUrl = process.env.PUBLIC_URL || "";

  // Make Progression Timeline use the harmony analysis image
  if (title === "Progression Timeline") {
    return {
      webp: `${publicUrl}/images/harmony_analysis.webp`,
      png: `${publicUrl}/images/harmony_analysis.png`
    };
  }

  const titleToImage = {
    "Song Builder": {
      webp: `${publicUrl}/images/song_view.webp`,
      png: `${publicUrl}/images/song_view.png`
    },
    "Harmony Palettes": {
      webp: `${publicUrl}/images/palette_view.webp`,
      png: `${publicUrl}/images/palette_view.png`
    },
    "Advanced Voice Handling": {
      webp: `${publicUrl}/images/advanced_voicing.webp`,
      png: `${publicUrl}/images/advanced_voicing.png`
    },
    "Dynamic Pattern Editor": {
      webp: `${publicUrl}/images/pattern_view.webp`,
      png: `${publicUrl}/images/pattern_view.png`
    },
    "Voicing Generator": {
      webp: `${publicUrl}/images/voicing_view.webp`,
      png: `${publicUrl}/images/voicing_view.png`
    },
    "DAW Integration": {
      webp: `${publicUrl}/images/DAW.webp`,
      png: `${publicUrl}/images/DAW.png`
    },
  };

  // Fallback images for any feature without a specific image
  const fallbackImages = [
    {
      webp: `${publicUrl}/images/song_view.webp`,
      png: `${publicUrl}/images/song_view.png`
    },
    {
      webp: `${publicUrl}/images/palette_view.webp`,
      png: `${publicUrl}/images/palette_view.png`
    },
    {
      webp: `${publicUrl}/images/pattern_view.webp`,
      png: `${publicUrl}/images/pattern_view.png`
    },
    {
      webp: `${publicUrl}/images/voicing_view.webp`,
      png: `${publicUrl}/images/voicing_view.png`
    },
  ];

  let imagePaths = titleToImage[title as keyof typeof titleToImage]; // Add type assertion

  // If no specific image is found, use a fallback based on the title's hash
  if (!imagePaths) {
    const hash = title
      .split("")
      .reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0); // Add types for reduce
    imagePaths = fallbackImages[hash % fallbackImages.length];
    console.log(
      `No specific image for "${title}", using fallback: ${imagePaths.png}`
    );
  } else {
    // console.log(`For title "${title}", using image paths: WebP: ${imagePaths.webp}, PNG: ${imagePaths.png}`);
  }

  return imagePaths;
};


// Add a visual feedback indicator for swipe actions on mobile
const SwipeIndicator = styled.div<SwipeIndicatorProps>`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: ${(props) => (props.$visible ? "flex" : "none")};
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 24px;
  z-index: 20;
  pointer-events: none;
  opacity: 0.8;

  &.left {
    left: 20px;
  }

  &.right {
    right: 20px;
  }

  @media (max-width: 480px) {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
`;

// Add this styled component to properly position the LoadingComponent
const LoadingWrapper = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

// Define Feature interface
interface Feature {
  title: string;
  detailedDescription?: string | React.ReactElement;
  image?: { webp: string; png: string } | string; // Support both new object format and legacy string format
  // Add any other properties a feature might have
}

// Define props for FeatureModal
interface FeatureModalProps {
  features: Feature[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

const FeatureModal: React.FC<FeatureModalProps> = React.memo(({
  features,
  initialIndex = 0,
  isOpen,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [infoVisible, setInfoVisible] = useState(true);
  const [direction, setDirection] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [debugMode, setDebugMode] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(
    null
  );
  const [prevIndex, setPrevIndex] = useState(initialIndex);
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, i18n } = useTranslation();

  // Update currentIndex when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Focus the modal container to enable keyboard navigation
      setTimeout(() => {
        if (modalRef.current) {
          modalRef.current.focus();
        }
      }, 100);
    }
  }, [initialIndex, isOpen]);

  // Improved body overflow management to prevent memory leaks
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalStyle;
    }

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Update when language changes (optimized)
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.scrollTop = 0;
    }
  }, [i18n.language]);

  // Reset current index when initial index changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setPrevIndex(initialIndex);
  }, [initialIndex]);

  // Enhanced touch handlers with visual feedback
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    // Typed event
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeDirection(null);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    // Typed event
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    if (touchStart !== null && currentTouch !== null) {
      // Check for null
      const diff = touchStart - currentTouch;
      if (diff > 30) {
        setSwipeDirection("left");
      } else if (diff < -30) {
        setSwipeDirection("right");
      } else {
        setSwipeDirection(null);
      }
    }
  };

  // Define these functions with useCallback before using them in useEffect
  const handleNext = useCallback(() => {
    // Prevent rapid multiple clicks
    if (direction !== 0) return;

    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % features.length);
  }, [features.length, direction]);

  const handlePrevious = useCallback(() => {
    // Prevent rapid multiple clicks
    if (direction !== 0) return;

    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
  }, [features.length, direction]);

  const handleSwipe = useCallback(() => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && features.length > 1) {
      handleNext();
    } else if (isRightSwipe && features.length > 1) {
      handlePrevious();
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd, features.length, handleNext, handlePrevious]);

  // Lazy load images only when needed (optimized)
  const loadImage = useCallback((title: string, featureImage?: { webp: string; png: string } | string) => {
    if (imagesLoaded[title] || imageErrors[title]) return; // Already loaded or failed
    
    // Handle new image object format or legacy string format
    let imagePaths: { webp: string; png: string } | null = null;
    if (featureImage) {
      if (typeof featureImage === 'string') {
        // Legacy format: single string
        imagePaths = { webp: featureImage, png: featureImage };
      } else {
        // New format: object with webp and png
        imagePaths = featureImage;
      }
    } else {
      // Fallback to title-based lookup
      imagePaths = getImagePath(title);
    }
    
    if (!imagePaths) {
      return;
    }

    // Load WebP first, fallback to PNG
    const img = new Image();
    img.onload = () => {
      setImagesLoaded((prev) => ({ ...prev, [title]: true }));
    };
    img.onerror = () => {
      // Try PNG fallback
      const pngImg = new Image();
      pngImg.onload = () => {
        setImagesLoaded((prev) => ({ ...prev, [title]: true }));
      };
      pngImg.onerror = () => {
        setImageErrors((prev) => ({ ...prev, [title]: true }));
      };
      pngImg.src = imagePaths.png;
    };
    img.src = imagePaths.webp;
  }, [imagesLoaded, imageErrors]);

  // Load current image when modal opens or index changes
  useEffect(() => {
    if (isOpen && features[currentIndex]) {
      const { title, image: featureImage } = features[currentIndex];
      loadImage(title, featureImage);
    }
  }, [isOpen, currentIndex, features, loadImage]);

  // Global keyboard event listener for modal navigation
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Handle debug mode toggle
      if (e.shiftKey && e.key === "D") {
        setDebugMode((prev) => !prev);
        return;
      }

      // Handle navigation keys
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [isOpen, handleNext, handlePrevious, onClose]);

  // Reset direction after animation completes
  useEffect(() => {
    if (direction !== 0) {
      const timer = setTimeout(() => {
        setDirection(0);
      }, 500); // Match this with your animation duration
      return () => clearTimeout(timer);
    }
  }, [direction, currentIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [handleNext, handlePrevious, onClose]
  );

  const handleDotClick = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Typed event
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleInfo = () => {
    setInfoVisible(!infoVisible);
  };

  // Memoize current feature data to prevent unnecessary re-renders
  const currentFeature = useMemo(() => features[currentIndex] || {}, [features, currentIndex]);
  const { title, detailedDescription, image: featureImage } = currentFeature;

  // Memoize image paths - prefer feature image property, fallback to title lookup
  const imagePaths = useMemo(() => {
    if (featureImage) {
      // Handle new object format or legacy string format
      if (typeof featureImage === 'string') {
        return { webp: featureImage, png: featureImage };
      }
      return featureImage; // Already has webp and png
    }
    // Fallback to title-based lookup for backwards compatibility
    return getImagePath(title);
  }, [featureImage, title]);
  const isImageLoaded = imagesLoaded[title] || false;
  const hasImageError = imageErrors[title] || false;

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <ModalContainer
            ref={modalRef}
            initial={{
              scale: 0.9,
              opacity: 0,
              willChange: "transform, opacity",
            }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
            onKeyDown={handleKeyDown}
          >
            <TitleContainer>
              <ModalTitle>{title}</ModalTitle>
            </TitleContainer>

            <InfoButton onClick={toggleInfo} aria-label={infoVisible ? "Show image only" : "Show feature details"}>
              {infoVisible ? <FaSearchPlus /> : <FaInfoCircle />}
            </InfoButton>

            <CloseButton onClick={onClose} aria-label="Close modal">
              <FaTimes />
            </CloseButton>

            <CarouselContainer
              ref={containerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleSwipe}
            >
              {/* Add these swipe indicators */}
              <SwipeIndicator
                className="left"
                $visible={swipeDirection === "right"}
              >
                <FaChevronLeft />
              </SwipeIndicator>

              <SwipeIndicator
                className="right"
                $visible={swipeDirection === "left"}
              >
                <FaChevronRight />
              </SwipeIndicator>

              <AnimatePresence initial={false} custom={direction}>
                <Slide
                  key={currentIndex}
                  custom={direction}
                  initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction < 0 ? "100%" : "-100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <ImageContainer>
                    {debugMode && (
                      <ImageDebug>
                        Path: {imagePaths?.png || "None"}
                        <br />
                        Loaded: {isImageLoaded ? "Yes" : "No"}
                        <br />
                        Error: {hasImageError ? "Yes" : "No"}
                      </ImageDebug>
                    )}
                    {imagePaths && !isImageLoaded && !hasImageError && (
                      <LoadingWrapper>
                        <LoadingComponent size="40px" text="Loading image..." />
                      </LoadingWrapper>
                    )}
                    {hasImageError && (
                      <LoadingWrapper>
                        <LoadingComponent
                          size="40px"
                          text="Failed to load image"
                        />
                      </LoadingWrapper>
                    )}
                    <FeatureImage
                      onClick={toggleInfo}
                      style={{ cursor: "pointer" }}
                    >
                      {imagePaths && isImageLoaded && !hasImageError ? (
                        <picture style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <source srcSet={imagePaths.webp} type="image/webp" />
                          <img 
                            src={imagePaths.png} 
                            alt={features[currentIndex]?.title || "Feature image"}
                            style={{ 
                              maxWidth: "100%", 
                              maxHeight: "100%", 
                              objectFit: "contain",
                              objectPosition: "center"
                            }}
                          />
                        </picture>
                      ) : (
                        (!imagePaths || hasImageError) &&
                          features[currentIndex]
                            ?.title /* Add optional chaining */
                      )}
                    </FeatureImage>
                  </ImageContainer>

                  <ContentOverlay $visible={infoVisible}>
                    <ContentContainer>
                      <InfoImageContainer>
                        <InfoFeatureImage
                          onClick={toggleInfo}
                        >
                          {imagePaths && isImageLoaded && !hasImageError ? (
                            <picture style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <source srcSet={imagePaths.webp} type="image/webp" />
                              <img 
                                src={imagePaths.png} 
                                alt={features[currentIndex]?.title || "Feature image"}
                                style={{ 
                                  maxWidth: "100%", 
                                  maxHeight: "100%", 
                                  objectFit: "contain",
                                  objectPosition: "center"
                                }}
                              />
                            </picture>
                          ) : (
                            (!imagePaths || hasImageError) &&
                              features[currentIndex]
                                ?.title /* Add optional chaining */
                          )}
                        </InfoFeatureImage>
                      </InfoImageContainer>

                      <ContentTextContainer>
                        {detailedDescription && (
                          <FeatureDescription>
                            <ParseHtml htmlContent={detailedDescription} />
                          </FeatureDescription>
                        )}
                      </ContentTextContainer>
                    </ContentContainer>
                  </ContentOverlay>
                </Slide>
              </AnimatePresence>
            </CarouselContainer>

            <CarouselControls>
              <ControlButton
                onClick={handlePrevious}
                disabled={features.length <= 1}
                aria-label="Previous feature"
              >
                <FaChevronLeft />
              </ControlButton>

              <ProgressIndicator>
                {features.map(
                  (
                    _,
                    index: number // Typed index
                  ) => (
                    <IndicatorDot
                      key={index}
                      $active={index === currentIndex}
                      onClick={() => handleDotClick(index)}
                      aria-label={`Go to feature ${index + 1}`}
                    />
                  )
                )}
              </ProgressIndicator>

              <ControlButton
                onClick={handleNext}
                disabled={features.length <= 1}
                aria-label="Next feature"
              >
                <FaChevronRight />
              </ControlButton>
            </CarouselControls>
          </ModalContainer>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
});

export default FeatureModal;
