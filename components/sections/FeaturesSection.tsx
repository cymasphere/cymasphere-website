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
  transform: translateZ(0);
  will-change: transform, box-shadow;
  backface-visibility: hidden;

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

  // Force re-render when language changes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    // This effect will run whenever the language changes
    const handleLanguageChange = () => {
      forceUpdate({});
    };

    i18n.on("languageChanged", handleLanguageChange);

    // Cleanup
    return () => {
      i18n.off("languageChanged", handleLanguageChange);
    };
  }, [i18n]);

  const featuresData = React.useMemo(() => {
    const formatDetailedDescription = (feature: string) => {
      // Get the features array and ensure it's properly typed
      const featureItems = t(`features.${feature}.features`, {
        returnObjects: true,
      }) as string[];

      // Create list items for each feature
      const featuresList = featureItems
        .map((item: string) => {
          const hasDash = item.includes(" - ");
          const [title, description] = hasDash
            ? item.split(" - ", 2)
            : [item, ""];
          return `<li><strong>${title}</strong>${
            hasDash ? ` - ${description}` : ""
          }</li>`;
        })
        .join("");

      return `
          <h3>${t(`features.${feature}.modalTitle`)}</h3>
          <p>${t(`features.${feature}.modalDescription`)}</p>
          
          <h3 style="margin-bottom: 0.5rem;">${t(
            `features.${feature}.keyFeatures`
          )}</h3>
          <ul style="margin-top: 0.5rem;">
            ${featuresList}
          </ul>
        `;
    };

    return [
      {
        icon: <FaLayerGroup />,
        title: t("features.songBuilder.title"),
        description: t("features.songBuilder.description"),
        detailedDescription: formatDetailedDescription("songBuilder"),
        color: "#4A90E2",
      },
      {
        icon: <FaVolumeUp />,
        title: t("features.harmonyPalettes.title"),
        description: t("features.harmonyPalettes.description"),
        detailedDescription: formatDetailedDescription("harmonyPalettes"),
        color: "#50E3C2",
      },
      {
        icon: <FaWaveSquare />,
        title: t("features.patternEditor.title"),
        description: t("features.patternEditor.description"),
        detailedDescription: formatDetailedDescription("patternEditor"),
        color: "#F5A623",
      },
      {
        icon: <FaMusic />,
        title: t("features.voicingGenerator.title"),
        description: t("features.voicingGenerator.description"),
        detailedDescription: formatDetailedDescription("voicingGenerator"),
        color: "#D0021B",
      },
      {
        icon: <FaClock />,
        title: t("features.progressionTimeline.title"),
        description: t("features.progressionTimeline.description"),
        detailedDescription: formatDetailedDescription("progressionTimeline"),
        color: "#9013FE",
      },
      {
        icon: <FaPuzzlePiece />,
        title: t("features.voiceHandling.title"),
        description: t("features.voiceHandling.description"),
        detailedDescription: formatDetailedDescription("voiceHandling"),
        color: "#4CAF50",
      },
    ];
  }, [t]);

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
