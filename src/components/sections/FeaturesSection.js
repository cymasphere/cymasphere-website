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
          <li><strong>Professional Transport Controls</strong> with play, stop, record, loop functionality, BPM, meter, metronome and DAW sync</li>
          <li><strong>Interactive Timeline</strong> with grid snapping, zoom controls, and countoff capabilities</li>
          <li><strong>Multi-Track Management</strong> with per-track mute/solo, volume controls, and routing options</li>
          <li><strong>Comprehensive Arrangement View</strong> providing a holistic perspective of all voicings and patterns</li>
          <li><strong>Chord Progression Framework</strong> serving as the harmonic foundation for your compositions</li>
          <li><strong>Informative Keyboard Display</strong> showing chord voicings and voice leading</li>
        </ul>
      `,
      color: "#4A90E2"
    },
    {
      icon: <FaVolumeUp />,
      title: "Harmony Palettes",
      description: "Shape melodies and chords through a tactile, gestural interface designed for fluid musical expression.",
      detailedDescription: `
        <h3>Visualize Chord Relationships</h3>
        <p>Control harmony like a physical instrument with our intuitive gestural interface. Manipulate, arrange, and explore chord relationships through a tactile experience that makes complex music theory accessible and expressive.</p>
        
        <h3 style="margin-bottom: 0.5rem;">Key Features:</h3>
        <ul style="margin-top: 0.5rem;">
          <li><strong>Customizable Bank Arrangement</strong> to organize your chord collections through drag and drop</li>
          <li><strong>Drag and Drop Voicings</strong> directly from palettes to your progression timeline</li>
          <li><strong>Curated Collection Library</strong> with pre-selected scales and chord relationships</li>
          <li><strong>One-Click Transposition</strong> for instantly shifting keys across your entire composition</li>
          <li><strong>Voicing Parameter Dashboard</strong> for quick adjustments to chord characteristics</li>
          <li><strong>Custom Bank Creation</strong> for building your personal chord vocabulary</li>
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
          <li><strong>Context-Aware Note Entry</strong> with scale, chord, and voicing intelligence to prevent harmonic clashes</li>
          <li><strong>Intuitive Note Manipulation</strong> with easy selection, dragging, copying, and transformation tools</li>
          <li><strong>Dual Mode Operation</strong> with relative and absolute patterns for both contextual and fixed melodic content</li>
          <li><strong>Melodic Essence Extraction</strong> that captures the intent of any melody for reuse in different harmonic contexts</li>
        </ul>
      `,
      color: "#F5A623"
    },
    {
      icon: <FaMusic />,
      title: "Voicing Generator",
      description: "Transform chord progressions into rich, expressive voicings with professional-grade voice leading and harmonic control.",
      detailedDescription: `
        <h3>Limitless Harmonic Possibilities</h3>
        <p>The Voicing Generator transforms simple chord symbols into complex, expressive harmonic structures. Fine-tune every aspect of your chord voicings from global styles to individual note placement, creating professional arrangements that breathe life into your music.</p>
        
        <h3 style="margin-bottom: 0.5rem;">Key Features:</h3>
        <ul style="margin-top: 0.5rem;">
          <li><strong>Advanced Chord Editor</strong> with comprehensive scale and chord configuration tools for complete harmonic customization</li>
          <li><strong>Intelligent Voice Leading</strong> with automatic smooth transitions between chord changes based on proximity, common tones, and voice direction</li>
          <li><strong>Texture Controls</strong> including voicing width, density, inversions, octave distribution, and register placement</li>
          <li><strong>Harmonic Extensions</strong> with configurable 7ths, 9ths, 11ths and 13ths to add richness and color to your progressions</li>
          <li><strong>Multi-Level Settings</strong> allowing global changes to entire songs or focused edits to specific chord voicings with a single adjustment</li>
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
          <li><strong>Drag and Drop Chord Arrangement</strong> for easily rearranging chords and adjusting their length by dragging boundaries</li>
          <li><strong>Display Toggling</strong> to show chord names as letters, Roman numerals, or solfege based on preference</li>
          <li><strong>Dynamic Pattern Updates</strong> where patterns and voicings automatically adapt when changes are made to the progression</li>
        </ul>
      `,
      color: "#9013FE"
    },
    {
      icon: <FaPuzzlePiece />,
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