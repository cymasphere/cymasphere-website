"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaInfoCircle,
} from "react-icons/fa";
import DOMPurify from "dompurify";

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
    margin-bottom: 0; /* Footer is fixed now, so no margin needed */
    height: 100%;
  }

  @media (max-width: 480px) {
    margin-top: 0;
    margin-bottom: 0;
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
    height: 45vh;
    min-height: 250px;
    max-height: 450px;
    padding-top: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 480px) {
    height: 40vh;
    min-height: 220px;
    padding-top: 0;
  }
`;

const FeatureImage = styled.div`
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
    background-position: center;
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

const ContentOverlay = styled.div`
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
    padding: 10px 15px 70px; /* Add padding at the bottom to account for fixed footer */
    height: calc(100% - 0px); /* Take full height */
    overflow-y: auto; /* Make sure this container is scrollable on mobile */
  }

  @media (max-width: 480px) {
    padding: 10px 12px 60px; /* Add padding at the bottom to account for fixed footer */
    height: calc(100% - 0px); /* Take full height */
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
  top: 20px;
  align-self: flex-start;
  background: rgba(10, 10, 15, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    width: 100%;
    max-width: 100%;
    height: auto;
    aspect-ratio: 16/10;
    position: relative;
    top: 0;
    margin-bottom: 10px;
    flex-shrink: 0;
  }

  @media (max-width: 480px) {
    border-radius: 8px;
    margin-bottom: 10px;
    aspect-ratio: 16/9;
  }

  &:hover {
    z-index: 10;
  }
`;

const InfoFeatureImage = styled.div`
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
  }

  ul {
    padding-left: 20px;
    margin-top: 8px;
    margin-bottom: 10px;
  }

  li {
    margin-bottom: 8px;
    position: relative;

    @media (max-width: 480px) {
      margin-bottom: 12px;
    }
  }

  /* Attribution styling */
  p.attribution {
    font-style: italic;
    opacity: 0.7;
    font-size: 0.9em;
    margin-top: 12px;
    margin-bottom: 10px;
  }

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 0;
    padding-bottom: 0;
  }

  @media (max-width: 480px) {
    font-size: 1rem;
    margin-top: 0;
    padding-bottom: 0;

    h3 {
      font-size: 1.5rem;
      margin-bottom: 15px;
    }

    ul {
      padding-left: 15px;
    }
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

const IndicatorDot = styled.button`
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

// Helper function to safely parse HTML content
const parseHtml = (htmlContent) => {
  // If the content is already a React element, return it
  if (React.isValidElement(htmlContent)) {
    return htmlContent;
  }

  // If it's a string that might contain HTML
  if (typeof htmlContent === "string") {
    // Clean up HTML before sanitizing (fix common issues)
    let cleanHtml = htmlContent
      .replace(/&nbsp;/g, " ")
      .replace(/<br>/g, "<br />")
      .replace(/<p>\s*<\/p>/g, "");

    // Ensure headings are properly formatted
    if (!cleanHtml.includes("<h3>") && !cleanHtml.includes("<h2>")) {
      // Extract first sentence as title if no heading exists
      const firstPeriod = cleanHtml.indexOf(".");
      if (firstPeriod > 10 && firstPeriod < 100) {
        const title = cleanHtml.substring(0, firstPeriod + 1);
        const rest = cleanHtml.substring(firstPeriod + 1);
        cleanHtml = `<h3>${title}</h3>${rest}`;
      }
    }

    // Sanitize the HTML to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(cleanHtml, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "p",
        "br",
        "ul",
        "ol",
        "li",
        "strong",
        "em",
        "b",
        "i",
        "a",
      ],
      ALLOWED_ATTR: ["href", "target", "rel"],
    });

    return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  }

  return "";
};

// Helper function to extract key features
const extractKeyFeatures = (detailedDescription) => {
  if (!detailedDescription) return [];

  // If there's a ul element, extract its contents
  if (detailedDescription?.props?.children) {
    const ulElement = Array.isArray(detailedDescription.props.children)
      ? detailedDescription.props.children.find((child) => child.type === "ul")
      : null;

    if (ulElement && ulElement.props && ulElement.props.children) {
      return Array.isArray(ulElement.props.children)
        ? ulElement.props.children.map((li) =>
            typeof li.props.children === "string"
              ? li.props.children
              : Array.isArray(li.props.children)
              ? li.props.children
                  .map((child) => (typeof child === "string" ? child : ""))
                  .join("")
              : ""
          )
        : [ulElement.props.children];
    }
  }

  // If no ul element found, create some default features from the description
  if (typeof detailedDescription === "string") {
    const sentences = detailedDescription.split(".");
    return sentences
      .filter((s) => s.trim().length > 20 && s.trim().length < 100)
      .slice(0, 3);
  }

  return [];
};

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

// Feature descriptions object for detailed content
const featureDescriptions = {
  "Advanced Voice Handling": `<h3>Advanced Voice Handling</h3>
    <p>Take complete control over your chord voicings with our sophisticated voice leading system, designed to give you both precise control and intelligent automation.</p>
    <ul>
      <li><strong>Intelligent Voice Leading</strong> - Automatically generate smooth transitions between chords that follow proper voice leading principles.</li>
      <li><strong>Custom Voice Assignments</strong> - Manually assign specific notes to each voice for complete control over your harmonic expression.</li>
      <li><strong>Voice Range Controls</strong> - Define upper and lower limits for each voice to ensure playability and optimal sound for your target instruments.</li>
      <li><strong>Voice Motion Rules</strong> - Apply classical voice leading rules like avoiding parallel fifths or controlling voice crossing between parts.</li>
      <li><strong>Multi-Instrument Voicing</strong> - Distribute voices across different instrument groups with intelligent orchestration suggestions.</li>
      <li><strong>Style-Based Voicing Templates</strong> - Apply genre-specific voicing patterns like jazz, classical, or pop with a single click.</li>
    </ul>
    <p>Perfect for composers and songwriters looking for both intuitive control and professional results without requiring extensive music theory knowledge.</p>`,
};

// Function to get image path based on feature title
const getImagePath = (title) => {
  if (!title) return null;

  // Explicitly use absolute paths with the public URL
  const publicUrl = process.env.PUBLIC_URL || "";

  // Make Progression Timeline use the same image as Song Builder
  if (title === "Progression Timeline") {
    return `${publicUrl}/images/song_view.png`;
  }

  const titleToImage = {
    "Song Builder": `${publicUrl}/images/song_view.png`,
    "Harmony Palettes": `${publicUrl}/images/palette_view.png`,
    "Advanced Voice Handling": `${publicUrl}/images/advanced_voicing.png`,
    "Dynamic Pattern Editor": `${publicUrl}/images/pattern_view.png`,
    "Voicing Generator": `${publicUrl}/images/voicing_view.png`,
  };

  // Fallback images for any feature without a specific image
  const fallbackImages = [
    `${publicUrl}/images/song_view.png`,
    `${publicUrl}/images/palette_view.png`,
    `${publicUrl}/images/pattern_view.png`,
    `${publicUrl}/images/voicing_view.png`,
  ];

  let imagePath = titleToImage[title];

  // If no specific image is found, use a fallback based on the title's hash
  if (!imagePath) {
    const hash = title
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    imagePath = fallbackImages[hash % fallbackImages.length];
    console.log(
      `No specific image for "${title}", using fallback: ${imagePath}`
    );
  } else {
    console.log(`For title "${title}", using image path: ${imagePath}`);
  }

  return imagePath;
};

// Add a Loading indicator component with proper styling
const LoadingIndicator = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;

  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const LoadingText = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;

  @media (max-width: 480px) {
    font-size: 14px;
  }
`;

// Improved spinner for better mobile visibility
const loadingSpinAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: ${loadingSpinAnimation} 1s linear infinite;

  @media (max-width: 480px) {
    width: 30px;
    height: 30px;
    border-width: 2px;
  }
`;

// Add a visual feedback indicator for swipe actions on mobile
const SwipeIndicator = styled.div`
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

const FeatureModal = ({ features, initialIndex = 0, isOpen, onClose }) => {
  // Find the Advanced Voice Handling feature and update its description before rendering
  const updatedFeatures = features.map((feature) => {
    if (feature.title === "Advanced Voice Handling") {
      return {
        ...feature,
        detailedDescription: `
          <h3>Complete Control Over Every Voice</h3>
          <p>Advanced Voice Handling provides granular control over each individual voice in your composition. Manage voice count, behavior, interaction, and routing to create complex arrangements with complete creative freedom.</p>
          
          <h3 style="margin-bottom: 0.5rem;">Key Features:</h3>
          <ul style="margin-top: 0.5rem;">
            <li><strong>Dynamic Voice Count</strong> for arrangement flexibility - Add or remove voices for different textures</li>
            <li><strong>Smooth Voice Leading</strong> to control how voices move together - Options for parallel, contrary, or independent motion</li>
            <li><strong>Per-Voice MIDI Channel Routing</strong> for multi-instrument setups - Send voices to different instruments</li>
            <li><strong>Voice Range Constraints</strong> for instrument-appropriate writing - Set upper and lower limits for each voice</li>
            <li><strong>Designated Bass Channel</strong> for foundation control - Discrete controls for pedal tones and voice leading</li>
            <li><strong>Voice / Channel Matrix</strong> for effortless MIDI routing - Visually map voices to MIDI channels and instruments</li>
          </ul>
        `,
      };
    }
    return feature;
  });

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [infoVisible, setInfoVisible] = useState(true);
  const [direction, setDirection] = useState(0);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [debugMode, setDebugMode] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const modalRef = useRef(null);
  const containerRef = useRef(null);

  // Update currentIndex when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Enhanced touch handlers with visual feedback
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setSwipeDirection(null);
  };

  const handleTouchMove = (e) => {
    const currentTouch = e.targetTouches[0].clientX;
    setTouchEnd(currentTouch);

    if (touchStart && currentTouch) {
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

  const handleTouchEnd = useCallback(() => {
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
  }, [touchStart, touchEnd, features.length]);

  // Preload images for better mobile experience
  const preloadNextImages = useCallback(() => {
    const currentIdx = currentIndex;
    const nextIdx = (currentIdx + 1) % features.length;
    const prevIdx = (currentIdx - 1 + features.length) % features.length;

    // Preload current, next and previous images
    [currentIdx, nextIdx, prevIdx].forEach((idx) => {
      const feature = features[idx];
      if (!feature) return;

      const { title, image: featureImage } = feature;
      const imagePath = featureImage || getImagePath(title);

      if (imagePath && !imagesLoaded[title] && !imageErrors[title]) {
        const img = new Image();
        img.onload = () => {
          setImagesLoaded((prev) => ({ ...prev, [title]: true }));
        };
        img.onerror = () => {
          setImageErrors((prev) => ({ ...prev, [title]: true }));
        };
        img.src = imagePath;
      }
    });
  }, [features, currentIndex, imagesLoaded, imageErrors]);

  // Call the preload function when currentIndex changes
  useEffect(() => {
    if (isOpen) {
      preloadNextImages();
    }
  }, [currentIndex, isOpen, preloadNextImages]);

  // Toggle debug mode with Shift + D
  useEffect(() => {
    const handleDebugToggle = (e) => {
      if (e.shiftKey && e.key === "D") {
        setDebugMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleDebugToggle);
    return () => window.removeEventListener("keydown", handleDebugToggle);
  }, []);

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
    (e) => {
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

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, handleKeyDown]);

  const handleDotClick = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const toggleInfo = () => {
    setInfoVisible(!infoVisible);
  };

  const currentFeature = updatedFeatures[currentIndex] || {};
  const { title, detailedDescription, image: featureImage } = currentFeature;
  const keyFeatures = extractKeyFeatures(detailedDescription || "");

  // Use the provided image or get one based on title
  const imagePath = featureImage || getImagePath(title);
  const isImageLoaded = imagesLoaded[title] || false;
  const hasImageError = imageErrors[title] || false;

  // We'll keep this function but won't use it for the FeatureImage background

  const getFeatureColor = (index) => {
    const colors = [
      "#4A90E2", // Song Builder - Blue
      "#50E3C2", // Harmony Palette - Teal
      "#F5A623", // Pattern Editor - Orange
      "#D0021B", // Voicing Generator - Red
      "#9013FE", // Progression Timeline - Purple
      "#7ED321", // Voice Handling - Green
    ];
    return colors[index % colors.length];
  };

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

            <InfoButton onClick={toggleInfo} aria-label="Show feature details">
              <FaInfoCircle />
            </InfoButton>

            <CloseButton onClick={onClose} aria-label="Close modal">
              <FaTimes />
            </CloseButton>

            <CarouselContainer
              ref={containerRef}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
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
                        Path: {imagePath || "None"}
                        <br />
                        Loaded: {isImageLoaded ? "Yes" : "No"}
                        <br />
                        Error: {hasImageError ? "Yes" : "No"}
                      </ImageDebug>
                    )}
                    {imagePath && !isImageLoaded && !hasImageError && (
                      <LoadingIndicator>
                        <LoadingSpinner />
                        <LoadingText>Loading image...</LoadingText>
                      </LoadingIndicator>
                    )}
                    {hasImageError && (
                      <LoadingIndicator>
                        <LoadingText>Failed to load image</LoadingText>
                      </LoadingIndicator>
                    )}
                    <FeatureImage
                      imgSrc={isImageLoaded ? imagePath : null}
                      onClick={toggleInfo}
                      style={{ cursor: "pointer" }}
                    >
                      {(!imagePath || hasImageError) &&
                        features[currentIndex].title}
                    </FeatureImage>
                  </ImageContainer>

                  <ContentOverlay $visible={infoVisible}>
                    <ContentContainer>
                      <InfoImageContainer>
                        <InfoFeatureImage
                          imgSrc={isImageLoaded ? imagePath : null}
                          onClick={toggleInfo}
                        >
                          {(!imagePath || hasImageError) &&
                            features[currentIndex].title}
                        </InfoFeatureImage>
                      </InfoImageContainer>

                      <ContentTextContainer>
                        {detailedDescription && (
                          <FeatureDescription>
                            {parseHtml(detailedDescription)}
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
                {features.map((_, index) => (
                  <IndicatorDot
                    key={index}
                    $active={index === currentIndex}
                    onClick={() => handleDotClick(index)}
                    aria-label={`Go to feature ${index + 1}`}
                  />
                ))}
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
};

export default FeatureModal;
