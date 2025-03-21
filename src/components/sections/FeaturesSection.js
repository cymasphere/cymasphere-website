import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaMusic, FaWaveSquare, FaPuzzlePiece, FaLayerGroup, FaRobot, FaVolumeUp, FaClock } from 'react-icons/fa';
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
      description: "Combine tracks, progressions, and harmony palettes in one intuitive workspace for seamless composition.",
      detailedDescription: `
        <h3>Central Music Creation Hub</h3>
        <p>The Song Builder is your central creative hub where all musical elements come together. Create, arrange, and refine your music with an intuitive interface designed for both beginners and professionals.</p>
        
        <h3 style="margin-bottom: 0.5rem;">Key Features:</h3>
        <ul style="margin-top: 0.5rem;">
          <li><strong>Integrated Workspace</strong> that combines all musical elements in one view</li>
          <li><strong>Voicing and Pattern Tracks</strong> that work together seamlessly</li>
          <li><strong>Chord Progression Integration</strong> that serves as the harmonic foundation</li>
          <li><strong>Harmony Palette Access</strong> for quick chord selection and customization</li>
          <li><strong>Multi-Track Organization</strong> for complete arrangement control</li>
          <li><strong>Real-time Preview</strong> of your entire composition as you build</li>
        </ul>
      `,
      color: "#4A90E2"
    },
    {
      icon: <FaPuzzlePiece />,
      title: "Harmony Palettes",
      description: "Visualize and organize chord voicings to create effortless, intuitive progressions.",
      detailedDescription: `
        <h3>Visualize Chord Relationships</h3>
        <p>Interactive Harmony Palettes transform abstract music theory into a visual, tactile experience. Organize, customize, and discover chord voicings that bring your progressions to life with nuance and character.</p>
        
        <h3 style="margin-bottom: 0.5rem;">Key Features:</h3>
        <ul style="margin-top: 0.5rem;">
          <li><strong>Visual Chord Organization</strong> that makes music theory accessible</li>
          <li><strong>Custom Voicing Libraries</strong> for your personal chord vocabulary</li>
          <li><strong>Chord Relationship Mapping</strong> to find complementary harmonies</li>
          <li><strong>Color-Coded Harmony Groups</strong> for intuitive progression building</li>
          <li><strong>Favorites System</strong> for quick access to your go-to voicings</li>
          <li><strong>Drag and Drop Interface</strong> for seamless workflow integration</li>
        </ul>
      `,
      color: "#50E3C2"
    },
    {
      icon: <FaWaveSquare />,
      title: "Dynamic Pattern Editor",
      description: "Create intelligent musical patterns that adapt to chord changes in real-time.",
      detailedDescription: `
        <h3>Adaptive Musical Patterns</h3>
        <p>The Dynamic Pattern Editor enables you to create complex musical motifs that respond intelligently to changes in your chord progressions. Build melodies and rhythmic sequences that maintain musical coherence even as the harmony shifts.</p>
        
        <h3 style="margin-bottom: 0.5rem;">Key Features:</h3>
        <ul style="margin-top: 0.5rem;">
          <li><strong>Intelligent Adaptation</strong> to chord progression changes in real-time</li>
          <li><strong>Advanced Piano Roll Interface</strong> with powerful editing tools</li>
          <li><strong>Scale-Aware Note Entry</strong> that prevents harmonic clashes</li>
          <li><strong>Rhythmic Pattern Templates</strong> for different musical styles</li>
          <li><strong>Velocity and Articulation Controls</strong> for expressive performances</li>
          <li><strong>Pattern Variations</strong> that generate coherent musical ideas</li>
        </ul>
      `,
      color: "#F5A623"
    },
    {
      icon: <FaMusic />,
      title: "Voicing Generator",
      description: "Craft sophisticated chord voicings with smooth transitions and professional voice leading.",
      detailedDescription: `
        <h3>Master the Art of Chord Voicing</h3>
        <p>The Voicing Generator gives you unprecedented control over how your chords are constructed and how they transition. Create professional-quality voice leading and chord textures that elevate your compositions with musical sophistication.</p>
        
        <h3 style="margin-bottom: 0.5rem;">Key Features:</h3>
        <ul style="margin-top: 0.5rem;">
          <li><strong>Voice Leading Optimization</strong> for smooth, natural chord transitions</li>
          <li><strong>Texture Controls</strong> for open, closed, and custom voicing styles</li>
          <li><strong>Register Management</strong> to place voices in their ideal ranges</li>
          <li><strong>Tension Note Integration</strong> for sophisticated harmonic color</li>
          <li><strong>Style Templates</strong> from jazz to classical to contemporary pop</li>
          <li><strong>Custom Voicing Rules</strong> for your personal compositional style</li>
        </ul>
      `,
      color: "#D0021B"
    },
    {
      icon: <FaClock />,
      title: "Progression Timeline",
      description: "Learn from ghost tracks and transform existing songs with powerful reharmonization tools.",
      detailedDescription: `
        <h3>Master Chord Progression Creation</h3>
        <p>The Progression Timeline streamlines the process of building, refining, and transforming chord progressions. With educational ghost tracks and powerful reharmonization tools, you can both learn from and reinvent your favorite music.</p>
        
        <h3 style="margin-bottom: 0.5rem;">Key Features:</h3>
        <ul style="margin-top: 0.5rem;">
          <li><strong>Intuitive Timeline Interface</strong> for visual progression building</li>
          <li><strong>Ghost Track Learning System</strong> that teaches progression structure</li>
          <li><strong>Real-time Reharmonization</strong> to transform existing progressions</li>
          <li><strong>Section-based Organization</strong> for structured composition</li>
          <li><strong>Chord Substitution Suggestions</strong> based on music theory</li>
          <li><strong>Harmonic Analysis</strong> that reveals the theory behind progressions</li>
        </ul>
      `,
      color: "#9013FE"
    },
    {
      icon: <FaVolumeUp />,
      title: "Advanced Voice Handling",
      description: "Control voice count, interactions, and MIDI routing for complete arrangement flexibility.",
      detailedDescription: `
        <h3>Complete Control Over Every Voice</h3>
        <p>Advanced Voice Handling provides granular control over each individual voice in your composition. Manage voice count, behavior, interaction, and routing to create complex arrangements with complete creative freedom.</p>
        
        <h3 style="margin-bottom: 0.5rem;">Key Features:</h3>
        <ul style="margin-top: 0.5rem;">
          <li><strong>Dynamic Voice Count</strong> for arrangement flexibility</li>
          <li><strong>Voice Interaction Rules</strong> to control how voices move together</li>
          <li><strong>Per-Voice MIDI Channel Routing</strong> for multi-instrument setups</li>
          <li><strong>Voice Range Constraints</strong> for instrument-appropriate writing</li>
          <li><strong>Voice Activity Patterns</strong> for creating rhythmic interplay</li>
          <li><strong>Custom Voice Behaviors</strong> for unique compositional techniques</li>
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
        initialIndex={selectedFeature}
        features={featuresData}
      />
    </FeaturesContainer>
  );
};

export default FeaturesSection; 