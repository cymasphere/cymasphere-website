"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  FaMusic,
  FaWaveSquare,
  FaPuzzlePiece,
  FaLayerGroup,
  FaVolumeUp,
  FaClock,
} from "react-icons/fa";
import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";

// Dynamically import modal to avoid SSR issues
const FeatureModal = dynamic(() => import("../modals/FeatureModal"), {
  ssr: false,
});

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
    content: "";
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
  transform: translateZ(0);
  will-change: transform;

  &:before {
    content: "";
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      var(--primary),
      var(--accent),
      var(--primary)
    );
    opacity: 0;
    transition: opacity 0.4s ease;
    z-index: -1;
  }

  svg {
    transition: transform 0.3s ease;
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

const FeatureCard = styled(motion.div)<{ $rotation?: number }>`
  background: linear-gradient(
    ${props => props.$rotation || 165}deg,
    rgba(15, 14, 23, 0.98) 0%,
    rgba(27, 25, 40, 0.98) 50%,
    rgba(35, 32, 52, 0.98) 100%
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
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
  transform: translateZ(0);
  will-change: transform, box-shadow;
  backface-visibility: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
        circle at 30% 50%,
        rgba(108, 99, 255, 0.1),
        transparent 50%
      ),
      radial-gradient(
        circle at 70% 30%,
        rgba(78, 205, 196, 0.1),
        transparent 50%
      );
    z-index: 0;
    pointer-events: none;
    border-radius: 16px;
  }

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at center,
      rgba(108, 99, 255, 0.2) 0%,
      transparent 70%
    );
    opacity: 0;
    transform: scale(0.5);
    z-index: -1;
    transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    will-change: opacity, transform;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &:hover {
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    transform: translateY(-10px) translateZ(0);

    &:after {
      opacity: 0.8;
      transform: scale(1.2);
    }

    ${FeatureIcon} {
      transform: translateY(-5px) scale(1.05);

      &:before {
        opacity: 0.8;
      }

      svg {
        transform: scale(1.1);
        filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.6));
      }
    }

    ${FeatureTitle} {
      color: var(--primary);
    }

    ${FeatureDescription} {
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
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: "easeOut",
    },
  }),
};

const FeaturesSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(0);
  const { t, i18n } = useTranslation();
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'en';

  // Force re-render when language changes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    // This effect will run whenever the language changes
    const handleLanguageChange = () => {
      forceUpdate({});
    };

    i18n.on('languageChanged', handleLanguageChange);
    
    // Cleanup
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const formatDetailedDescription = (feature: string) => {
    // Get the features array and ensure it's properly typed
    const featureItems = t(`features.${feature}.features`, { returnObjects: true }) as string[];

    const stopWords = [
      'to','for','with','in','on','from','into','across','over','under','and','or','of','that','which','when','where','while','as'
    ];

    // Create list items for each feature
    const featuresList = featureItems.map((item: string) => {
      // Define specific keywords that should be bold for each feature type
      const keywordPatterns = [
        // Song Builder features
        { pattern: /^(Professional Transport Controls)/i, bold: '$1' },
        { pattern: /^(Interactive Timeline)/i, bold: '$1' },
        { pattern: /^(Multi-Track Management)/i, bold: '$1' },
        { pattern: /^(Comprehensive Arrangement View)/i, bold: '$1' },
        { pattern: /^(Chord Progression Framework)/i, bold: '$1' },
        { pattern: /^(Informative Keyboard Display)/i, bold: '$1' },
        
        // Harmony Palettes features
        { pattern: /^(Customizable Bank Arrangement)/i, bold: '$1' },
        { pattern: /^(Drag and Drop Voicings)/i, bold: '$1' },
        { pattern: /^(Curated Collection Library)/i, bold: '$1' },
        { pattern: /^(One-Click Transposition)/i, bold: '$1' },
        { pattern: /^(Voicing Parameter Dashboard)/i, bold: '$1' },
        { pattern: /^(Custom Bank Creation)/i, bold: '$1' },
        
        // Pattern Editor features
        { pattern: /^(Intelligent Adaptation)/i, bold: '$1' },
        { pattern: /^(Advanced Piano Roll Interface)/i, bold: '$1' },
        { pattern: /^(Context-Aware Note Entry)/i, bold: '$1' },
        { pattern: /^(Dual Mode Operation)/i, bold: '$1' },
        { pattern: /^(Melodic Essence Extraction)/i, bold: '$1' },
        
        // Voicing Generator features
        { pattern: /^(Advanced Chord Editor)/i, bold: '$1' },
        { pattern: /^(Intelligent Voice Leading)/i, bold: '$1' },
        { pattern: /^(Texture Controls)/i, bold: '$1' },
        { pattern: /^(Harmonic Extensions)/i, bold: '$1' },
        { pattern: /^(Multi-Level Settings)/i, bold: '$1' },
        
        // Progression Timeline features
        { pattern: /^(Intuitive Timeline Interface)/i, bold: '$1' },
        { pattern: /^(Ghost Track Learning System)/i, bold: '$1' },
        { pattern: /^(Real-time Reharmonization)/i, bold: '$1' },
        { pattern: /^(Section-based Organization)/i, bold: '$1' },
        { pattern: /^(Drag and Drop Chord Arrangement)/i, bold: '$1' },
        { pattern: /^(Display Toggling)/i, bold: '$1' },
        { pattern: /^(Dynamic Pattern Updates)/i, bold: '$1' },
        
        // Voice Handling features
        { pattern: /^(Dynamic Voice Count)/i, bold: '$1' },
        { pattern: /^(Smooth Voice Leading)/i, bold: '$1' },
        { pattern: /^(Per-Voice MIDI Channel Routing)/i, bold: '$1' },
        { pattern: /^(Voice Range Constraints)/i, bold: '$1' },
        { pattern: /^(Designated Bass Channel)/i, bold: '$1' },
        { pattern: /^(Voice \/ Channel Matrix)/i, bold: '$1' }
      ];
      
      // Find matching pattern and apply bold formatting
      for (const { pattern, bold } of keywordPatterns) {
        if (pattern.test(item)) {
          const highlighted = item.replace(pattern, `<strong>${bold}</strong>`);
          return `<li>${highlighted}</li>`;
        }
      }
      
      // Fallback: bold first 2-3 words if no specific pattern matches
      const words = item.split(' ').filter(Boolean);
      const keywordLength = Math.min(3, Math.max(2, words.length));
      const keyword = words.slice(0, keywordLength).join(' ');
      const rest = words.slice(keywordLength).join(' ');
      
      return `<li><strong>${keyword}</strong>${rest ? ` ${rest}` : ''}</li>`;
    }).join('');

    return `
      <h3>${t(`features.${feature}.modalTitle`)}</h3>
      <p>${t(`features.${feature}.modalDescription`)}</p>
      
      <h3 style="margin-bottom: 0.5rem;">${t(`features.${feature}.keyFeatures`)}</h3>
      <ul style="margin-top: 0.5rem;">
        ${featuresList}
      </ul>
    `;
  };

  // Generate dramatically different rotations for each card
  const cardRotations = React.useMemo(() => {
    // Use much more varied rotations across the full 360 degree spectrum
    return [
      45,   // Top-left to bottom-right
      135,  // Top-right to bottom-left  
      225,  // Bottom-right to top-left
      315,  // Bottom-left to top-right
      90,   // Top to bottom
      270,  // Bottom to top
    ];
  }, []);

  const featuresData = React.useMemo(
    () => [
      {
        icon: <FaLayerGroup />,
        title: t("features.songBuilder.title"),
        description: t("features.songBuilder.description"),
        detailedDescription: formatDetailedDescription("songBuilder"),
        color: "#4A90E2",
        rotation: cardRotations[0],
      },
      {
        icon: <FaVolumeUp />,
        title: t("features.harmonyPalettes.title"),
        description: t("features.harmonyPalettes.description"),
        detailedDescription: formatDetailedDescription("harmonyPalettes"),
        color: "#50E3C2",
        rotation: cardRotations[1],
      },
      {
        icon: <FaWaveSquare />,
        title: t("features.patternEditor.title"),
        description: t("features.patternEditor.description"),
        detailedDescription: formatDetailedDescription("patternEditor"),
        color: "#F5A623",
        rotation: cardRotations[2],
      },
      {
        icon: <FaMusic />,
        title: t("features.voicingGenerator.title"),
        description: t("features.voicingGenerator.description"),
        detailedDescription: formatDetailedDescription("voicingGenerator"),
        color: "#D0021B",
        rotation: cardRotations[3],
      },
      {
        icon: <FaClock />,
        title: t("features.progressionTimeline.title"),
        description: t("features.progressionTimeline.description"),
        detailedDescription: formatDetailedDescription("progressionTimeline"),
        color: "#9013FE",
        rotation: cardRotations[4],
      },
      {
        icon: <FaPuzzlePiece />,
        title: t("features.voiceHandling.title"),
        description: t("features.voiceHandling.description"),
        detailedDescription: formatDetailedDescription("voiceHandling"),
        color: "#4CAF50",
        rotation: cardRotations[5],
      },
    ],
    [t, currentLocale, i18n.language, cardRotations]
  );

  return (
    <FeaturesContainer id="features">
      <FeaturesContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.2 }}
          style={{ willChange: "opacity, transform" }}
        >
          <SectionTitle>{t("features.sectionTitle")}</SectionTitle>
        </motion.div>

        <FeaturesGrid>
          {featuresData.map((feature, index) => (
            <FeatureCard
              key={index}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              $rotation={feature.rotation}
              onClick={() => {
                setSelectedFeature(index);
                setModalOpen(true);
              }}
            >
              <FeatureIcon>{feature.icon}</FeatureIcon>
              <FeatureTitle>{feature.title}</FeatureTitle>
              <FeatureDescription>{feature.description}</FeatureDescription>
            </FeatureCard>
          ))}
        </FeaturesGrid>
      </FeaturesContent>

      <FeatureModal
        features={featuresData}
        initialIndex={selectedFeature}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </FeaturesContainer>
  );
};

export default FeaturesSection;
