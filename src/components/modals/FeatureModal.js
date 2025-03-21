import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaChevronLeft, FaChevronRight, FaCheck, FaInfoCircle } from 'react-icons/fa';
import DOMPurify from 'dompurify';

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
  z-index: 1000;
  backdrop-filter: blur(5px);
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  
  &:before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(135deg, 
      rgba(108, 99, 255, 0.7) 0%, 
      rgba(108, 99, 255, 0.2) 50%, 
      rgba(78, 205, 196, 0.7) 100%);
    border-radius: 28px;
    z-index: -1;
    opacity: 0.6;
    filter: blur(8px);
  }
  
  /* Custom outline style for focus */
  &:focus {
    outline: none;
    border: 1px solid var(--primary);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--primary);
  }
`;

const TitleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 60px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(25, 23, 36, 0.9);
  backdrop-filter: blur(10px);
  height: 80px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, 
      transparent, 
      rgba(108, 99, 255, 0.3), 
      rgba(78, 205, 196, 0.3), 
      transparent);
  }
`;

const ModalTitle = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  padding-left: 30px;
  color: white;
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
  position: absolute;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  animation: ${pulse} 2s infinite;
  
  &:hover {
    background: var(--primary);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(108, 99, 255, 0.5);
    animation: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  
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
`;

const Slide = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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
`;

const FeatureImage = styled.div`
  width: 100%;
  height: 100%;
  background-color: transparent;
  background-image: ${props => props.imgSrc ? `url(${props.imgSrc})` : 'none'};
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 32px;
  font-weight: bold;
  
  /* Show text only if no image is provided */
  ${props => props.imgSrc && `
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
  justify-content: center;
  align-items: center;
  opacity: ${props => props.$visible ? 1 : 0};
  pointer-events: ${props => props.$visible ? 'auto' : 'none'};
  transition: opacity 0.3s ease;
  backdrop-filter: blur(20px);
  padding: 100px 40px 100px;
`;

const ContentContainer = styled.div`
  max-width: 1000px;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 40px;
`;

const InfoImageContainer = styled.div`
  width: 40%;
  max-width: 400px;
  height: 280px;
  border-radius: 12px;
  overflow: visible;
  position: relative;
  background: rgba(10, 10, 15, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  
  &:hover {
    z-index: 10;
  }
`;

const InfoFeatureImage = styled.div`
  width: 100%;
  height: 100%;
  background-color: transparent;
  background-image: ${props => props.imgSrc ? `url(${props.imgSrc})` : 'none'};
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
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.25);
  }
  
  /* Show text only if no image is provided */
  ${props => props.imgSrc && `
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
  gap: 30px;
`;

const FeatureDescription = styled.div`
  font-size: 1.1rem;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.95);
  
  h3 {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 24px;
    background: linear-gradient(135deg, #6c63ff, #4ecdc4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    letter-spacing: -0.5px;
    display: inline-block;
  }
  
  p {
    margin-bottom: 16px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 1.05rem;
    line-height: 1.6;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  ul {
    padding-left: 24px;
    margin: 16px 0;
  }
  
  li {
    margin-bottom: 12px;
    position: relative;
    padding-left: 4px;
  }
  
  .company-attribution {
    font-size: 0.9rem;
    color: var(--text-secondary);
    font-style: italic;
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
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
  z-index: 6;
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, 
      transparent, 
      rgba(108, 99, 255, 0.3), 
      rgba(78, 205, 196, 0.3), 
      transparent);
  }
`;

const ControlButton = styled.button`
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--primary);
    color: white;
    box-shadow: 0 0 15px rgba(108, 99, 255, 0.4);
  }
  
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    background: rgba(255, 255, 255, 0.05);
    color: var(--text);
    box-shadow: none;
  }
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  margin: 0 20px;
`;

const IndicatorDot = styled.button`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin: 0 5px;
  background-color: ${props => props.$active 
    ? 'var(--primary)' 
    : 'rgba(255, 255, 255, 0.2)'};
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.$active 
      ? 'var(--primary)' 
      : 'rgba(255, 255, 255, 0.4)'};
    transform: scale(1.2);
  }
`;

// Helper function to safely parse HTML content
const parseHtml = (htmlContent) => {
  // If the content is already a React element, return it
  if (React.isValidElement(htmlContent)) {
    return htmlContent;
  }
  
  // If it's a string that might contain HTML
  if (typeof htmlContent === 'string') {
    // Clean up HTML before sanitizing (fix common issues)
    let cleanHtml = htmlContent
      .replace(/&nbsp;/g, ' ')
      .replace(/<br>/g, '<br />')
      .replace(/<p>\s*<\/p>/g, '');
      
    // Ensure headings are properly formatted
    if (!cleanHtml.includes('<h3>') && !cleanHtml.includes('<h2>')) {
      // Extract first sentence as title if no heading exists
      const firstPeriod = cleanHtml.indexOf('.');
      if (firstPeriod > 10 && firstPeriod < 100) {
        const title = cleanHtml.substring(0, firstPeriod + 1);
        const rest = cleanHtml.substring(firstPeriod + 1);
        cleanHtml = `<h3>${title}</h3>${rest}`;
      }
    }
    
    // Sanitize the HTML to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(cleanHtml, {
      USE_PROFILES: { html: true },
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
    
    return <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  }
  
  return '';
};

// Helper function to extract key features
const extractKeyFeatures = (detailedDescription) => {
  if (!detailedDescription) return [];
  
  // If there's a ul element, extract its contents
  if (detailedDescription?.props?.children) {
    const ulElement = Array.isArray(detailedDescription.props.children) 
      ? detailedDescription.props.children.find(child => child.type === 'ul')
      : null;
      
    if (ulElement && ulElement.props && ulElement.props.children) {
      return Array.isArray(ulElement.props.children)
        ? ulElement.props.children.map(li => 
            typeof li.props.children === 'string' 
              ? li.props.children 
              : Array.isArray(li.props.children) 
                ? li.props.children.map(child => 
                    typeof child === 'string' ? child : ''
                  ).join('') 
                : ''
          )
        : [ulElement.props.children];
    }
  }
  
  // If no ul element found, create some default features from the description
  if (typeof detailedDescription === 'string') {
    const sentences = detailedDescription.split('.');
    return sentences.filter(s => s.trim().length > 20 && s.trim().length < 100).slice(0, 3);
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

// Function to get image path based on feature title
const getImagePath = (title) => {
  if (!title) return null;
  
  // Explicitly use absolute paths with the public URL
  const publicUrl = process.env.PUBLIC_URL || '';
  
  // Make Progression Timeline use the same image as Song Builder
  if (title === "Progression Timeline") {
    return `${publicUrl}/images/song_view.png`;
  }
  
  const titleToImage = {
    'Song Builder': `${publicUrl}/images/song_view.png`,
    'Harmony Palettes': `${publicUrl}/images/palette_view.png`,
    'Advanced Voice Handling': `${publicUrl}/images/advanced_voicing.png`,
    'Dynamic Pattern Editor': `${publicUrl}/images/pattern_view.png`,
    'Voicing Generator': `${publicUrl}/images/voicing_view.png`,
  };
  
  // Fallback images for any feature without a specific image
  const fallbackImages = [
    `${publicUrl}/images/song_view.png`,
    `${publicUrl}/images/palette_view.png`,
    `${publicUrl}/images/pattern_view.png`,
    `${publicUrl}/images/voicing_view.png`
  ];
  
  let imagePath = titleToImage[title];
  
  // If no specific image is found, use a fallback based on the title's hash
  if (!imagePath) {
    const hash = title.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    imagePath = fallbackImages[hash % fallbackImages.length];
    console.log(`No specific image for "${title}", using fallback: ${imagePath}`);
  } else {
    console.log(`For title "${title}", using image path: ${imagePath}`);
  }
  
  return imagePath;
};

// Add a Loading indicator component with proper styling
const LoadingIndicator = styled.div`
  position: absolute;
  z-index: 2;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: rgba(25, 23, 36, 0.5);
  backdrop-filter: blur(5px);
`;

const LoadingText = styled.div`
  margin-top: 20px;
  font-size: 16px;
  color: var(--text);
  opacity: 0.8;
  font-weight: 500;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const spinner = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary);
  border-left: 4px solid var(--accent);
  animation: ${spinner} 1s linear infinite;
`;

const FeatureModal = ({ features, initialIndex = 0, isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [infoVisible, setInfoVisible] = useState(true);
  const [direction, setDirection] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [debugMode, setDebugMode] = useState(false);
  const modalRef = useRef(null);
  
  // Update currentIndex when initialIndex changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [initialIndex, isOpen]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Preload images when modal opens
  useEffect(() => {
    if (isOpen && features) {
      const newImagesLoaded = { ...imagesLoaded };
      const newImageErrors = { ...imageErrors };
      
      features.forEach((feature) => {
        if (feature.title) {
          const imagePath = feature.image || getImagePath(feature.title);
          
          // Skip if already loaded or has error
          if (newImagesLoaded[feature.title] || newImageErrors[feature.title]) {
            return;
          }
          
          if (imagePath) {
            console.log(`Preloading image for "${feature.title}": ${imagePath}`);
            const img = new Image();
            
            img.onload = () => {
              console.log(`Successfully loaded image for "${feature.title}"`);
              setImagesLoaded(prev => ({
                ...prev,
                [feature.title]: true
              }));
            };
            
            img.onerror = (err) => {
              console.error(`Failed to load image for "${feature.title}":`, err);
              setImageErrors(prev => ({
                ...prev,
                [feature.title]: true
              }));
            };
            
            // Add cache-busting parameter to avoid browser caching issues
            img.src = `${imagePath}?t=${new Date().getTime()}`;
          }
        }
      });
    }
  }, [isOpen, features]);
  
  // Toggle debug mode with Shift + D
  useEffect(() => {
    const handleDebugToggle = (e) => {
      if (e.shiftKey && e.key === 'D') {
        setDebugMode(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleDebugToggle);
    return () => window.removeEventListener('keydown', handleDebugToggle);
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
  
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleNext, handlePrevious, onClose]);
  
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
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

  const currentFeature = features[currentIndex] || {};
  const { title, detailedDescription, image: featureImage } = currentFeature;
  const keyFeatures = extractKeyFeatures(detailedDescription || '');
  
  // Use the provided image or get one based on title
  const imagePath = featureImage || getImagePath(title);
  const isImageLoaded = imagesLoaded[title] || false;
  const hasImageError = imageErrors[title] || false;

  // We'll keep this function but won't use it for the FeatureImage background
  // eslint-disable-next-line no-unused-vars
  const getFeatureColor = (index) => {
    const colors = [
      '#4A90E2', // Song Builder - Blue
      '#50E3C2', // Harmony Palette - Teal
      '#F5A623', // Pattern Editor - Orange
      '#D0021B', // Voicing Generator - Red
      '#9013FE', // Progression Timeline - Purple
      '#7ED321'  // Voice Handling - Green
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
            initial={{ scale: 0.9, opacity: 0 }}
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
            
            <CarouselContainer>
              <AnimatePresence initial={false} custom={direction}>
                <Slide
                  key={currentIndex}
                  custom={direction}
                  initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: direction < 0 ? '100%' : '-100%', opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <ImageContainer>
                    {debugMode && (
                      <ImageDebug>
                        Path: {imagePath || 'None'}<br />
                        Loaded: {isImageLoaded ? 'Yes' : 'No'}<br />
                        Error: {hasImageError ? 'Yes' : 'No'}
                      </ImageDebug>
                    )}
                    {imagePath && !isImageLoaded && !hasImageError && (
                      <LoadingIndicator>
                        <LoadingSpinner />
                        <LoadingText>Loading feature image...</LoadingText>
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
                      style={{ cursor: 'pointer' }}
                    >
                      {(!imagePath || hasImageError) && features[currentIndex].title}
                    </FeatureImage>
                  </ImageContainer>

                  <ContentOverlay $visible={infoVisible}>
                    <ContentContainer>
                      <InfoImageContainer>
                        <InfoFeatureImage 
                          imgSrc={isImageLoaded ? imagePath : null}
                          onClick={toggleInfo}
                        >
                          {(!imagePath || hasImageError) && features[currentIndex].title}
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