import React from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

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
  max-width: 900px;
  height: 90vh;
  max-height: 800px;
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
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 60px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(25, 23, 36, 0.95);
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
  color: white;
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

const ContentContainer = styled.div`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(108, 99, 255, 0.5);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(108, 99, 255, 0.7);
  }
`;

const AboutUsContent = styled.div`
  color: var(--text);
  font-size: 1rem;
  line-height: 1.7;
  
  h3 {
    font-size: 1.6rem;
    margin-top: 30px;
    margin-bottom: 15px;
    color: var(--primary);
    background: linear-gradient(135deg, #6c63ff, #4ecdc4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }
  
  p {
    margin-bottom: 20px;
  }
  
  ul, ol {
    margin-bottom: 20px;
    padding-left: 25px;
  }
  
  li {
    margin-bottom: 12px;
  }
  
  a {
    color: var(--accent);
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: var(--primary);
      text-decoration: underline;
    }
  }
`;

const TeamSection = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 30px;
  margin: 40px 0;
`;

const TeamMember = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const TeamMemberImage = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-color: rgba(108, 99, 255, 0.2);
  margin-bottom: 15px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: var(--primary);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const TeamMemberName = styled.h4`
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 5px;
  color: white;
`;

const TeamMemberRole = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 8px;
`;

const CompanyHighlight = styled.div`
  background: rgba(108, 99, 255, 0.1);
  border-left: 4px solid var(--primary);
  padding: 20px;
  margin: 30px 0;
  border-radius: 0 8px 8px 0;
`;

const AboutUsModal = ({ isOpen, onClose }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <TitleContainer>
              <ModalTitle>About Us</ModalTitle>
            </TitleContainer>
            
            <CloseButton onClick={onClose} aria-label="Close modal">
              <FaTimes />
            </CloseButton>
            
            <ContentContainer>
              <AboutUsContent>
                <h3>Our Mission</h3>
                <p>
                  At NNAudio, we're on a mission to transform audio creation and production through innovative neural network technology. 
                  Our flagship product, Cymasphere, represents our commitment to providing cutting-edge tools that empower musicians, 
                  producers, and sound designers to push the boundaries of what's possible in audio production.
                </p>
                
                <CompanyHighlight>
                  <p>
                    "We believe that the future of audio production lies at the intersection of human creativity and artificial intelligence. 
                    Our goal is to build tools that enhance the creative process, not replace it."
                  </p>
                </CompanyHighlight>
                
                <h3>Our Story</h3>
                <p>
                  NNAudio was founded in 2020 by a team of audio engineers, AI researchers, and passionate musicians who 
                  saw the potential of applying neural networks to audio processing. What started as a research project quickly evolved 
                  into a mission to create accessible, powerful tools for the audio community.
                </p>
                <p>
                  After two years of intensive development and testing with professional producers, we launched Cymasphere, 
                  our revolutionary audio processing platform that combines the intuitive workflow musicians expect with the 
                  cutting-edge capabilities of neural network technology.
                </p>
                
                <h3>Our Technology</h3>
                <p>
                  Cymasphere is powered by our proprietary neural network architecture specifically designed for audio processing. 
                  Our technology allows for:
                </p>
                <ul>
                  <li>Real-time audio analysis with unprecedented accuracy</li>
                  <li>Intelligent harmony and chord suggestions based on musical context</li>
                  <li>Advanced pattern recognition for rhythmic and melodic elements</li>
                  <li>Voice separation and manipulation with minimal artifacts</li>
                  <li>AI-assisted mixing and mastering while maintaining creative control</li>
                </ul>
                
                <h3>Our Team</h3>
                <p>
                  We're a diverse team of audio engineers, machine learning specialists, designers, and musicians working 
                  together to create the future of audio production.
                </p>
                
                <TeamSection>
                  <TeamMember>
                    <TeamMemberImage>RJ</TeamMemberImage>
                    <TeamMemberName>Ryan Johnson</TeamMemberName>
                    <TeamMemberRole>Founder & CEO</TeamMemberRole>
                  </TeamMember>
                  
                  <TeamMember>
                    <TeamMemberImage>GF</TeamMemberImage>
                    <TeamMemberName>Garrett Fleischer</TeamMemberName>
                    <TeamMemberRole>Co-founder & CTO</TeamMemberRole>
                  </TeamMember>
                </TeamSection>
                
                <h3>Join Us</h3>
                <p>
                  We're always looking for talented individuals who are passionate about audio and AI. 
                  If you're interested in joining our team, check out our careers page or reach out to us at 
                  careers@nnaudio.com.
                </p>
                
                <h3>Contact</h3>
                <p>
                  Have questions or feedback? We'd love to hear from you. Reach out to us at info@nnaudio.com 
                  or follow us on social media to stay updated on our latest developments.
                </p>
              </AboutUsContent>
            </ContentContainer>
          </ModalContainer>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default AboutUsModal; 