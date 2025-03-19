import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaMusic, FaWaveSquare, FaPuzzlePiece, FaLayerGroup, FaRobot, FaVolumeUp } from 'react-icons/fa';
import FeatureModal from '../modals/FeatureModal';

const FeaturesContainer = styled.section`
  padding: 100px 20px;
  background-color: var(--background-alt);
  position: relative;
  overflow: hidden;
`;

const FeaturesContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
`;

const SectionTitle = styled.h2`
  font-size: 2.5rem;
  text-align: center;
  margin-bottom: 2.5rem;
  position: relative;
  
  &:after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    border-radius: 2px;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 60px;
`;

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 25px;
  color: white;
  font-size: 32px;
  box-shadow: 0 10px 20px rgba(108, 99, 255, 0.3);
  position: relative;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  &:before {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: conic-gradient(from 0deg, var(--primary), var(--accent), var(--primary));
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: -1;
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.5rem;
  margin-bottom: 15px;
  text-align: center;
  transition: all 0.3s ease;
`;

const FeatureDescription = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  text-align: center;
  transition: all 0.3s ease;
`;

const FeatureCard = styled(motion.div)`
  background-color: var(--card-bg);
  padding: 40px 30px;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  isolation: isolate;
  
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, rgba(108, 99, 255, 0.2) 0%, transparent 70%);
    opacity: 0;
    transform: scale(0.5);
    z-index: -1;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }
  
  &:hover {
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    transform: translateY(-10px);
    
    &:after {
      opacity: 1;
      transform: scale(1.5);
    }
    
    ${FeatureIcon} {
      transform: translateY(-10px) scale(1.1);
      
      &:before {
        opacity: 0.8;
        animation: spin 4s linear infinite;
      }
      
      svg {
        transform: scale(1.2);
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
      }
    }
    
    ${FeatureTitle} {
      color: var(--primary);
      transform: translateY(-5px);
    }
    
    ${FeatureDescription} {
      transform: translateY(-3px);
      color: var(--text-primary);
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
`;

const cardVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: "easeOut"
    }
  })
};

const FeaturesSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(0);
  
  const featuresData = [
    {
      icon: <FaLayerGroup />,
      title: "Song Builder",
      description: "Create complete songs with intelligent melody and chord progression generation based on your musical preferences.",
      detailedDescription: `
        <h3>Build Better Songs, Faster</h3>
        <p>Our Song Builder streamlines the creative process by handling the technical details while you focus on making musical decisions. It's designed for both beginners and experienced musicians looking to accelerate their workflow.</p>
        
        <h3>Key Features:</h3>
        <ul>
          <li><strong>Intelligent Chord Suggestions</strong> that respond to your musical choices</li>
          <li><strong>Melodic Pattern Generation</strong> based on chord progressions</li>
          <li><strong>Structure Templates</strong> for different musical styles and genres</li>
          <li><strong>Real-time Feedback</strong> on your composition's musicality</li>
          <li><strong>Export Options</strong> for DAW integration</li>
        </ul>
      `,
      color: "#4A90E2"
    },
    {
      icon: <FaPuzzlePiece />,
      title: "Interactive Harmony Palette",
      description: "Explore chord relationships visually to quickly find the perfect progressions for your compositions.",
      detailedDescription: `
        <h3>Visualize Music Theory</h3>
        <p>Our interactive harmony palette transforms complex music theory concepts into intuitive visual relationships. See how chords connect and interact to create emotionally powerful progressions.</p>
        
        <h3>Key Features:</h3>
        <ul>
          <li><strong>Circle of Fifths Integration</strong> with interactive elements</li>
          <li><strong>Common Chord Progressions</strong> highlighted based on genre</li>
          <li><strong>Tension and Resolution Visualization</strong> for emotional impact</li>
          <li><strong>Chord Substitution Suggestions</strong> for creative alternatives</li>
          <li><strong>Favorite Combination Storage</strong> for your personal library</li>
        </ul>
      `,
      color: "#50E3C2"
    },
    {
      icon: <FaWaveSquare />,
      title: "Dynamic Pattern Editor",
      description: "Design complex musical patterns with an intuitive grid editor that visualizes rhythmic and harmonic relationships.",
      detailedDescription: `
        <h3>Pattern-Based Music Creation</h3>
        <p>The Pattern Editor makes it easy to create complex, evolving musical patterns that serve as the foundation for interesting compositions. Create once, then modify and reuse elements to build cohesive but varied tracks.</p>
        
        <h3>Key Features:</h3>
        <ul>
          <li><strong>Grid-Based Interface</strong> for intuitive pattern creation</li>
          <li><strong>Rhythmic Probability Controls</strong> for human-like variation</li>
          <li><strong>Pattern Transformation Tools</strong> (inversion, retrograde, etc.)</li>
          <li><strong>Layer System</strong> for combining multiple patterns</li>
          <li><strong>Pattern Library</strong> with genre-specific templates</li>
        </ul>
      `,
      color: "#F5A623"
    },
    {
      icon: <FaMusic />,
      title: "Voicing Generator",
      description: "Transform simple chord progressions into rich, nuanced voicings with the touch of a button.",
      detailedDescription: `
        <h3>Rich, Professional Chord Voicings</h3>
        <p>Our Voicing Generator transforms basic chord progressions into sophisticated arrangements with proper voice leading. Create lush, professional-sounding harmonies without deep music theory knowledge.</p>
        
        <h3>Key Features:</h3>
        <ul>
          <li><strong>Multiple Voicing Styles</strong> from jazz to classical to pop</li>
          <li><strong>Voice Leading Optimization</strong> for smooth chord transitions</li>
          <li><strong>Tension Note Additions</strong> (9ths, 11ths, 13ths)</li>
          <li><strong>Register Control</strong> for different instrument ranges</li>
          <li><strong>MIDI Export</strong> for DAW integration</li>
        </ul>
      `,
      color: "#D0021B"
    },
    {
      icon: <FaRobot />,
      title: "Progression Timeline",
      description: "Visualize and edit your chord progressions in a timeline view for perfect arrangement and song structure.",
      detailedDescription: `
        <h3>Perfect Your Song Structure</h3>
        <p>The Progression Timeline gives you a bird's-eye view of your entire composition, making it easy to build effective song structures and ensure your arrangement maintains interest throughout.</p>
        
        <h3>Key Features:</h3>
        <ul>
          <li><strong>Visual Song Section Editing</strong> (verse, chorus, bridge, etc.)</li>
          <li><strong>Harmonic Intensity Mapping</strong> across the composition</li>
          <li><strong>Chord Duration Controls</strong> for rhythm and pacing</li>
          <li><strong>Section Copying and Variation Tools</strong> for efficient workflow</li>
          <li><strong>Tension/Release Visualization</strong> for emotional arcs</li>
        </ul>
      `,
      color: "#9013FE"
    },
    {
      icon: <FaVolumeUp />,
      title: "Advanced Voice Handling",
      description: "Fine-tune individual voices within your chords for complete creative control over your harmonic texture.",
      detailedDescription: `
        <h3>Master the Details of Your Harmony</h3>
        <p>Advanced Voice Handling gives you precise control over each note in your chords, allowing for expressive voice leading, contrary motion, and complex harmonic textures that bring your music to life.</p>
        
        <h3>Key Features:</h3>
        <ul>
          <li><strong>Individual Voice Editing</strong> for complete control</li>
          <li><strong>Voice Leading Visualization</strong> across chord changes</li>
          <li><strong>Motion Type Controls</strong> (parallel, contrary, oblique)</li>
          <li><strong>Voice Range Limiting</strong> for instrument-appropriate writing</li>
          <li><strong>Voice Muting/Soloing</strong> for focused editing</li>
        </ul>
      `,
      color: "#7ED321"
    }
  ];
  
  const openModal = (index) => {
    setSelectedFeature(index);
    setModalOpen(true);
  };
  
  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <FeaturesContainer id="features">
      <FeaturesContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle>Powerful Features</SectionTitle>
        </motion.div>

        <FeaturesGrid>
          {featuresData.map((feature, index) => (
            <FeatureCard
              key={index}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={cardVariants}
              onClick={() => openModal(index)}
            >
              <FeatureIcon>{feature.icon}</FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </FeaturesContent>
      
      <FeatureModal 
        isOpen={modalOpen}
        onClose={closeModal}
        initialFeature={selectedFeature}
        features={featuresData}
      />
    </FeaturesContainer>
  );
};

export default FeaturesSection; 