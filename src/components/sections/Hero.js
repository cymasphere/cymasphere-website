import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Particles from 'react-tsparticles';
import { loadFull } from 'tsparticles';
import { useTranslation } from 'react-i18next';
import { FaLaptop, FaPlug } from 'react-icons/fa';

const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: 100px 20px;
  user-select: none;
  
  @media (max-width: 768px) {
    padding: 150px 20px 100px;
  }
`;

const HeroOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(15, 14, 23, 0.7) 0%, rgba(15, 14, 23, 0.9) 100%);
  z-index: 2;
`;

const HeroContent = styled.div`
  max-width: 1200px;
  width: 100%;
  z-index: 3;
  text-align: center;
`;

const HeroTitle = styled.h1`
  font-size: 4rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: white;
  line-height: 1.2;
  
  span {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const HeroText = styled.p`
  font-size: 1.5rem;
  color: var(--text-secondary);
  max-width: 700px;
  margin: 0 auto 2.5rem;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const CyclingText = styled.span`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-top: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
    gap: 15px;
  }
`;

const MainButton = styled.a`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  padding: 15px 30px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1.1rem;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
  box-shadow: 0 10px 20px rgba(108, 99, 255, 0.2);
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(108, 99, 255, 0.3);
    color: white;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    text-align: center;
    padding: 12px 20px;
    font-size: 1rem;
  }
`;

const SecondaryButton = styled.a`
  background: transparent;
  color: white;
  padding: 15px 30px;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1.1rem;
  text-decoration: none;
  transition: all 0.3s ease;
  display: inline-block;
  border: 2px solid rgba(255, 255, 255, 0.2);
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    color: white;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    text-align: center;
    padding: 12px 20px;
    font-size: 1rem;
  }
`;

const FormatBadge = styled.div`
  position: absolute;
  bottom: 20px;
  right: 30px;
  background: rgba(30, 30, 46, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  padding: 10px 20px;
  z-index: 10;
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  border: 1px solid rgba(108, 99, 255, 0.3);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  
  @media (max-width: 768px) {
    bottom: 10px;
    right: 10px;
    font-size: 0.8rem;
    padding: 8px 15px;
  }
`;

const FormatText = styled.span`
  color: rgba(255, 255, 255, 0.8);
  margin-right: 5px;
`;

const FormatIcon = styled.span`
  color: var(--primary);
  display: inline-flex;
  align-items: center;
  margin: 0 5px;
  font-size: 1.1em;
`;

const PluginBadge = styled.span`
  background: linear-gradient(90deg, rgba(108, 99, 255, 0.15), rgba(78, 205, 196, 0.15));
  border-radius: 15px;
  padding: 3px 10px;
  margin-left: 5px;
  display: inline-flex;
  align-items: center;
`;

function Hero() {
  const { t } = useTranslation();
  const [cycleIndex, setCycleIndex] = useState(0);
  
  const words = ["Music", "Harmony", "Song", "Pattern"];
  
  useEffect(() => {
    // THIS IS THE SIMPLEST POSSIBLE IMPLEMENTATION
    function cycleWords() {
      setCycleIndex(prev => (prev + 1) % words.length);
    }
    
    // Start immediately
    const id = setInterval(cycleWords, 2000);
    
    // Clean up
    return () => clearInterval(id);
  }, []);
  
  // Initialize tsParticles
  const particlesInit = async (main) => {
    await loadFull(main);
  };
  
  return (
    <HeroSection id="home">
      <Particles
        id="tsparticles"
        init={particlesInit}
        options={{
          fullScreen: {
            enable: false,
            zIndex: 1
          },
          particles: {
            number: {
              value: 80,
              density: {
                enable: true,
                value_area: 800
              }
            },
            color: {
              value: "#6c63ff"
            },
            shape: {
              type: "circle"
            },
            opacity: {
              value: 0.5,
              random: true
            },
            size: {
              value: 3,
              random: true
            },
            line_linked: {
              enable: true,
              distance: 150,
              color: "#6c63ff",
              opacity: 0.2,
              width: 1
            },
            move: {
              enable: true,
              speed: 2,
              direction: "none",
              random: true,
              straight: false,
              out_mode: "out",
              bounce: false
            }
          },
          interactivity: {
            detectsOn: "canvas",
            events: {
              onHover: {
                enable: true,
                mode: "grab"
              },
              resize: true
            },
            modes: {
              grab: {
                distance: 140,
                line_linked: {
                  opacity: 0.5
                }
              }
            }
          },
          retina_detect: true
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      />
      <HeroOverlay />
      <HeroContent>
        <HeroTitle>
          {t('hero.title1', 'Intelligent Music Creation')} <br />
          {t('hero.title2', 'For')} <span>{t('hero.title3', 'CYMASPHERE')}</span>
        </HeroTitle>
        
        <HeroText>
          {t('hero.subtitle', 'Neural network-based intelligent music creation platform for')}
          {' '}
          <CyclingText>
            {words[cycleIndex]}
          </CyclingText>
        </HeroText>
        
        <ButtonContainer>
          <MainButton href="#features">{t('hero.primaryCta', 'Explore Features')}</MainButton>
          <SecondaryButton href="#how-it-works">{t('hero.secondaryCta', 'How It Works')}</SecondaryButton>
        </ButtonContainer>
      </HeroContent>
      
      <FormatBadge>
        <FormatText>Available as:</FormatText>
        <FormatIcon><FaLaptop /></FormatIcon>
        <FormatText>Standalone</FormatText>
        <PluginBadge>
          <FormatIcon><FaPlug /></FormatIcon>
          <FormatText>AU & VST3</FormatText>
        </PluginBadge>
      </FormatBadge>
    </HeroSection>
  );
}

export default Hero; 