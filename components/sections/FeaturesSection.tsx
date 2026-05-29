/**
 * @fileoverview FeaturesSection Component
 * @module components/sections/FeaturesSection
 * 
 * Main features section for the landing page. Displays a grid of feature cards
 * with icons, titles, descriptions, and background images. Each card opens a
 * detailed modal with comprehensive feature information. Supports click-to-expand
 * functionality and smooth animations.
 * 
 * @example
 * // Basic usage
 * <FeaturesSection />
 */

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
  FaPlug,
  FaList,
} from "react-icons/fa";
import { BsSoundwave } from "react-icons/bs";
import { GiBrain } from "react-icons/gi";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useParams } from "next/navigation";

/** @brief Supabase CDN base for CymaSynth marketing assets. */
const FEATURE_IMAGE_BASE =
  "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized";

/** @brief Official CymaSynth product page on NNAudio. */
const CYMASYNTH_LEARN_MORE_URL = "https://nnaud.io/product/cymasynth";

const CYMASYNTH_SHOWCASE_IMAGES = {
  hero: `${FEATURE_IMAGE_BASE}/cymasynth-feature-1.webp`,
  product: `${FEATURE_IMAGE_BASE}/cymasynth-product.webp`,
  thumb: `${FEATURE_IMAGE_BASE}/cymasynth-feature-1-thumb.webp`,
} as const;

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

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
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
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1),
    opacity 0.4s ease;
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

const CymaSynthLearnMore = styled.a`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  margin-top: 0.35rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(0, 229, 255, 0.95);
  padding: 0.55rem 1rem;
  border-radius: 10px;
  border: 1px solid rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.1);
  text-decoration: none;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease, border-color 0.3s ease;

  &:hover {
    color: #fff;
    background: rgba(0, 229, 255, 0.22);
    border-color: rgba(0, 229, 255, 0.55);
  }

  &:focus-visible {
    outline: 2px solid rgba(0, 229, 255, 0.8);
    outline-offset: 2px;
  }
`;

const CymaSynthShowcase = styled(motion.article)`
  width: 100%;
  margin-top: 36px;
  cursor: pointer;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  isolation: isolate;
  text-align: left;
  border: 1px solid rgba(0, 229, 255, 0.28);
  background: linear-gradient(
    128deg,
    rgba(6, 20, 28, 0.98) 0%,
    rgba(10, 16, 36, 0.98) 42%,
    rgba(8, 10, 24, 1) 100%
  );
  box-shadow:
    0 28px 90px rgba(0, 0, 0, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.04) inset,
    0 0 80px rgba(0, 229, 255, 0.1);
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.45s ease, border-color 0.45s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
        ellipse 70% 80% at 12% 50%,
        rgba(0, 229, 255, 0.14),
        transparent 55%
      ),
      radial-gradient(
        ellipse 50% 60% at 88% 20%,
        rgba(78, 205, 196, 0.12),
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  &:hover {
    transform: translateY(-6px);
    border-color: rgba(0, 229, 255, 0.5);
    box-shadow:
      0 36px 100px rgba(0, 0, 0, 0.5),
      0 0 100px rgba(0, 229, 255, 0.16);

    ${CymaSynthLearnMore} {
      color: #fff;
      background: rgba(0, 229, 255, 0.22);
      border-color: rgba(0, 229, 255, 0.55);
    }
  }
`;

const CymaSynthShowcaseInner = styled.div`
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  min-height: 0;

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
    min-height: 420px;
  }
`;

const CymaSynthVisual = styled.div`
  position: relative;
  overflow: hidden;
  min-height: 280px;
  background: linear-gradient(
    180deg,
    rgba(0, 229, 255, 0.06) 0%,
    rgba(0, 0, 0, 0.35) 100%
  );
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);

  @media (min-width: 900px) {
    min-height: 100%;
    border-bottom: none;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
  }
`;

const CymaSynthImageGlow = styled.div`
  position: absolute;
  inset: 10% 8% 12%;
  border-radius: 20px;
  background: radial-gradient(
    ellipse at center,
    rgba(0, 229, 255, 0.2),
    transparent 68%
  );
  filter: blur(24px);
  pointer-events: none;
`;

const CymaSynthCopy = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 2rem 1.75rem 2.25rem;
  gap: 1rem;

  @media (min-width: 900px) {
    padding: 2.75rem 2.5rem 2.75rem 2rem;
  }
`;

const CymaSynthEyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  gap: 0.45rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(0, 229, 255, 0.95);
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  border: 1px solid rgba(0, 229, 255, 0.35);
  background: rgba(0, 229, 255, 0.08);
`;

const CymaSynthTitle = styled.h3`
  font-size: clamp(1.85rem, 4vw, 2.75rem);
  font-weight: 800;
  line-height: 1.08;
  letter-spacing: -0.03em;
  color: var(--text);
  margin: 0;
`;

const CymaSynthDescription = styled.p`
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.65;
  color: var(--text-secondary);
  margin: 0;
  max-width: 36rem;
`;

const CymaSynthHighlights = styled.ul`
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;

  @media (min-width: 600px) {
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem 1.25rem;
  }
`;

const CymaSynthHighlight = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--text-secondary);

  &::before {
    content: "";
    flex-shrink: 0;
    width: 7px;
    height: 7px;
    margin-top: 0.45rem;
    border-radius: 50%;
    background: linear-gradient(135deg, #00e5ff, #4ecdc4);
    box-shadow: 0 0 10px rgba(0, 229, 255, 0.65);
  }
`;

const CymaSynthFormats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.15rem;
`;

const CymaSynthFormatBadge = styled.span`
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  padding: 0.35rem 0.7rem;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
`;

const FeatureCard = styled(motion.div)<{
  $rotation?: number;
  $imageUrl?: string;
}>`
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
  will-change: transform;
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  backface-visibility: hidden;

  /* Background image layer - static, no hover effects */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: ${props => props.$imageUrl ? `url("${props.$imageUrl}")` : 'none'};
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    opacity: 0.15;
    z-index: 0;
    pointer-events: none;
    border-radius: 16px;
    transition: none; /* No transition on hover */
  }

  /* Gradient overlay layer - static, no hover effects */
  &::after {
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
    z-index: 1;
    pointer-events: none;
    border-radius: 16px;
    transition: none; /* No transition on hover */
  }

  > * {
    position: relative;
    z-index: 2;
  }

  &:hover {
    transform: translateY(-10px) translateZ(0);

    ${FeatureIcon} {
      transform: translateY(-5px) scale(1.05);

      &:before {
        opacity: 0.8;
      }

      svg {
        transform: scale(1.1);
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
    },
  }),
};

interface FeatureItem {
  icon: React.ReactNode;
  title: string;
  description: string;
  detailedDescription: string;
  color: string;
  rotation: number;
  image?: { webp: string; png: string };
}

/** @brief Default CymaSynth modal bullets when i18n array is unavailable. */
const CYMASYNTH_DEFAULT_BULLETS = [
  "$149 value when purchased alone—included free with every Cymasphere plan (subscriptions and lifetime); no separate CymaSynth purchase",
  "Triple oscillator architecture with wavetable morphing (256 frames) plus classic waveforms",
  "64-route modulation matrix with 5 LFOs and 4 ADSR+Hold envelopes for evolving, expressive patches",
  "Dual filters, up to 32-voice polyphony, unison, and a full built-in effects chain",
  "Standalone app plus VST3 and AU—use on its own, with Cymasphere, or in your DAW",
  "Designed to pair with Cymasphere's harmony and pattern tools: write the progression here, design the timbre in CymaSynth",
] as const;

/**
 * @brief Resolves a feature bullet list from i18n.
 * @param t - i18next translate function.
 * @param featureId - Feature slug (e.g. `songBuilder`, `cymaSynth`).
 * @returns Localized bullet strings for the modal list.
 * @note Reads `features` from the feature bundle object to avoid i18next path ambiguity on `features.cymaSynth.features`.
 */
function resolveFeatureBullets(
  t: (key: string, options?: Record<string, unknown>) => string | object,
  featureId: string,
): string[] {
  const bundle = t(`features.${featureId}`, { returnObjects: true });

  if (bundle && typeof bundle === "object" && bundle !== null && "features" in bundle) {
    const nested = (bundle as { features: unknown }).features;
    if (Array.isArray(nested)) {
      return nested.filter((item): item is string => typeof item === "string");
    }
    if (nested && typeof nested === "object") {
      return Object.values(nested as Record<string, string>).filter(
        (item) => typeof item === "string",
      );
    }
  }

  const direct = t(`features.${featureId}.features`, { returnObjects: true });
  if (Array.isArray(direct)) {
    return direct.filter((item): item is string => typeof item === "string");
  }
  if (direct && typeof direct === "object") {
    return Object.values(direct as Record<string, string>).filter(
      (item) => typeof item === "string",
    );
  }

  return [];
}

/**
 * @brief FeaturesSection component
 * 
 * Displays a grid of feature cards showcasing Cymasphere's capabilities:
 * - Song Builder
 * - Harmony Palettes
 * - Pattern Editor
 * - Voicing Generator
 * - Intelligent Generation
 * - Voice Handling
 * - DAW Integration
 * - Specialized Track Types
 * - Progression Timeline
 * - CymaSynth (bundled wavetable synth)
 * 
 * @returns {JSX.Element} The rendered features section component
 * 
 * @note Each card opens FeatureModal with detailed information
 * @note Cards have unique gradient rotations for visual variety
 * @note Background images are loaded from Supabase storage
 * @note Supports internationalization through react-i18next
 * @note Feature descriptions are formatted with keyword highlighting
 * @note Cards animate in sequence on scroll into view
 */
const FeaturesSection = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(0);
  const { t, i18n } = useTranslation();
  const params = useParams();
  const currentLocale = (params?.locale as string) || 'en';

  // Re-render when language changes or when translation bundles are loaded/updated
  const [translationsRevision, setTranslationsRevision] = useState(0);
  useEffect(() => {
    const bumpRevision = () => {
      setTranslationsRevision((revision) => revision + 1);
    };

    i18n.on("languageChanged", bumpRevision);
    i18n.on("loaded", bumpRevision);
    i18n.on("added", bumpRevision);

    return () => {
      i18n.off("languageChanged", bumpRevision);
      i18n.off("loaded", bumpRevision);
      i18n.off("added", bumpRevision);
    };
  }, [i18n]);

  const formatDetailedDescription = React.useCallback((feature: string) => {
    let featureItems = resolveFeatureBullets(t, feature);

    if (featureItems.length === 0 && feature === "cymaSynth") {
      featureItems = [...CYMASYNTH_DEFAULT_BULLETS];
    }

    if (featureItems.length === 0) {
      const modalTitle = t(`features.${feature}.modalTitle`, "");
      const modalDescription = t(`features.${feature}.modalDescription`, "");
      if (
        modalTitle &&
        modalTitle !== `features.${feature}.modalTitle` &&
        modalDescription &&
        modalDescription !== `features.${feature}.modalDescription`
      ) {
        return `<h3>${modalTitle}</h3><p>${modalDescription}</p>`;
      }
      return "";
    }

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
        { pattern: /^(Voice \/ Channel Matrix)/i, bold: '$1' },
        
        // DAW Integration features
        { pattern: /^(VST3 Plugin Support)/i, bold: '$1' },
        { pattern: /^(AU Plugin Support)/i, bold: '$1' },
        { pattern: /^(Standalone Application Mode)/i, bold: '$1' },
        { pattern: /^(MIDI Output Routing)/i, bold: '$1' },
        { pattern: /^(Real-time Synchronization)/i, bold: '$1' },
        { pattern: /^(Seamless Workflow Integration)/i, bold: '$1' },
        
        // Specialized Track Types features
        { pattern: /^(Voicing Tracks)/i, bold: '$1' },
        { pattern: /^(Pattern Tracks)/i, bold: '$1' },
        { pattern: /^(Sequencer Tracks)/i, bold: '$1' },
        { pattern: /^(Groove Tracks)/i, bold: '$1' },
        { pattern: /^(Independent Track Controls)/i, bold: '$1' },
        { pattern: /^(Track Regions)/i, bold: '$1' },
        
        // Intelligent Generation features
        { pattern: /^(Dynamic Pattern Generation)/i, bold: '$1' },
        { pattern: /^(Intelligent Progression Creation)/i, bold: '$1' },
        { pattern: /^(Adaptive Drum Groove Generation)/i, bold: '$1' },
        { pattern: /^(Context-Aware Generation)/i, bold: '$1' },
        { pattern: /^(Style-Based Generation)/i, bold: '$1' },
        { pattern: /^(Real-Time Adaptation)/i, bold: '$1' },

        // CymaSynth features
        { pattern: /^(Triple oscillator)/i, bold: '$1' },
        { pattern: /^(64-route modulation matrix)/i, bold: '$1' },
        { pattern: /^(Dual filters)/i, bold: '$1' },
        { pattern: /^(VST3 and AU)/i, bold: '$1' },
        { pattern: /^(Designed to pair)/i, bold: '$1' },
        { pattern: /(\$149 value)/i, bold: '$1' },
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

    const modalTitle = t(
      `features.${feature}.modalTitle`,
      feature === "cymaSynth" ? "Your Built-In Flagship Instrument" : "",
    );
    const modalDescription = t(
      `features.${feature}.modalDescription`,
      feature === "cymaSynth"
        ? "Sold separately, CymaSynth is a $149 instrument. With Cymasphere it is included at no extra cost on every subscription and lifetime license—so you go from harmonic sketch to finished sound without a second purchase."
        : "",
    );
    const keyFeaturesLabel = t(
      `features.${feature}.keyFeatures`,
      "Key Features:",
    );

    return `
      <h3>${modalTitle}</h3>
      <p>${modalDescription}</p>
      
      <h3 style="margin-bottom: 0.5rem;">${keyFeaturesLabel}</h3>
      <ul style="margin-top: 0.5rem;">
        ${featuresList}
      </ul>
    `;
  }, [t, translationsRevision]);

  // Generate dramatically different rotations for each card
  const cardRotations = React.useMemo(() => {
    // Use much more varied rotations across the full 360 degree spectrum
    return [
      45,   // songBuilder
      135,  // harmonyPalettes
      225,  // patternEditor
      315,  // voicingGenerator
      90,   // intelligentGeneration
      270,  // voiceHandling
      60,   // dawIntegration
      150,  // specializedTrackTypes
      240,  // progressionTimeline
      30,   // cymaSynth (bundled instrument — listed last)
    ];
  }, []);

  /** @brief Modal index for the CymaSynth showcase (always last in the combined list). */
  const CYMASYNTH_MODAL_INDEX = 9;

  const { allFeatures, gridFeatures, cymaSynthFeature } = React.useMemo(() => {
    const empty = {
      allFeatures: [] as FeatureItem[],
      gridFeatures: [] as FeatureItem[],
      cymaSynthFeature: null as FeatureItem | null,
    };

    const cymaSynthTitle = t("features.cymaSynth.title", "CymaSynth Included");
    const isReady =
      t("features.songBuilder.title") !== "features.songBuilder.title" &&
      cymaSynthTitle !== "features.cymaSynth.title";

    if (!isReady) {
      return empty;
    }

    const gridItems: FeatureItem[] = [
      {
        icon: <FaLayerGroup />,
        title: t("features.songBuilder.title"),
        description: t("features.songBuilder.description"),
        detailedDescription: formatDetailedDescription("songBuilder"),
        color: "#4A90E2",
        rotation: cardRotations[0],
        image: {
          webp: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/song_view.webp",
          png: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/song_view-thumb.webp"
        },
      },
      {
        icon: <FaVolumeUp />,
        title: t("features.harmonyPalettes.title"),
        description: t("features.harmonyPalettes.description"),
        detailedDescription: formatDetailedDescription("harmonyPalettes"),
        color: "#50E3C2",
        rotation: cardRotations[1],
        image: {
          webp: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/palette_view.webp",
          png: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/palette_view-thumb.webp"
        },
      },
      {
        icon: <FaWaveSquare />,
        title: t("features.patternEditor.title"),
        description: t("features.patternEditor.description"),
        detailedDescription: formatDetailedDescription("patternEditor"),
        color: "#F5A623",
        rotation: cardRotations[2],
        image: {
          webp: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/pattern_view.webp",
          png: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/pattern_view-thumb.webp"
        },
      },
      {
        icon: <FaMusic />,
        title: t("features.voicingGenerator.title"),
        description: t("features.voicingGenerator.description"),
        detailedDescription: formatDetailedDescription("voicingGenerator"),
        color: "#D0021B",
        rotation: cardRotations[3],
        image: {
          webp: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/voicing_view.webp",
          png: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/voicing_view-thumb.webp"
        },
      },
      {
        icon: <GiBrain />,
        title: t("features.intelligentGeneration.title"),
        description: t("features.intelligentGeneration.description"),
        detailedDescription: formatDetailedDescription("intelligentGeneration"),
        color: "#00BCD4",
        rotation: cardRotations[4],
        image: {
          webp: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/groove-generator.webp",
          png: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/groove-generator-thumb.webp"
        },
      },
      {
        icon: <FaPuzzlePiece />,
        title: t("features.voiceHandling.title"),
        description: t("features.voiceHandling.description"),
        detailedDescription: formatDetailedDescription("voiceHandling"),
        color: "#4CAF50",
        rotation: cardRotations[5],
        image: {
          webp: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/voice-channel-matrix.webp",
          png: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/voice-channel-matrix-thumb.webp"
        },
      },
      {
        icon: <FaPlug />,
        title: t("features.dawIntegration.title"),
        description: t("features.dawIntegration.description"),
        detailedDescription: formatDetailedDescription("dawIntegration"),
        color: "#FF6B35",
        rotation: cardRotations[6],
        image: {
          webp: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/DAW.webp",
          png: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/DAW-thumb.webp"
        },
      },
      {
        icon: <FaList />,
        title: t("features.specializedTrackTypes.title"),
        description: t("features.specializedTrackTypes.description"),
        detailedDescription: formatDetailedDescription("specializedTrackTypes"),
        color: "#9C27B0",
        rotation: cardRotations[7],
        image: {
          webp: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/track-types.webp",
          png: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/track-types-thumb.webp"
        },
      },
      {
        icon: <FaClock />,
        title: t("features.progressionTimeline.title"),
        description: t("features.progressionTimeline.description"),
        detailedDescription: formatDetailedDescription("progressionTimeline"),
        color: "#9013FE",
        rotation: cardRotations[8],
        image: {
          webp: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/voicing-track-view.webp",
          png: "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/feature-images/optimized/voicing-track-view-thumb.webp"
        },
      },
    ];

    const cymaSynth: FeatureItem = {
      icon: <BsSoundwave />,
      title: cymaSynthTitle,
      description: t(
        "features.cymaSynth.description",
        "A $149-value professional wavetable synth—triple oscillators, deep modulation, studio effects—yours free with Cymasphere.",
      ),
      detailedDescription: formatDetailedDescription("cymaSynth"),
      color: "#00E5FF",
      rotation: cardRotations[9],
      image: {
        webp: CYMASYNTH_SHOWCASE_IMAGES.hero,
        png: CYMASYNTH_SHOWCASE_IMAGES.thumb,
      },
    };

    return {
      allFeatures: [...gridItems, cymaSynth],
      gridFeatures: gridItems,
      cymaSynthFeature: cymaSynth,
    };
  }, [
    t,
    currentLocale,
    i18n.language,
    cardRotations,
    translationsRevision,
    formatDetailedDescription,
  ]);

  const cymaSynthHighlights = React.useMemo(() => {
    const items = t("features.cymaSynth.features", {
      returnObjects: true,
    }) as string[] | string;

    if (Array.isArray(items) && items.length > 0) {
      return items.slice(1, 5);
    }

    return [
      "Triple oscillator architecture with wavetable morphing (256 frames)",
      "64-route modulation matrix with 5 LFOs and 4 ADSR+Hold envelopes",
      "Dual filters, up to 32-voice polyphony, unison, and built-in effects",
      "VST3 and AU—standalone or alongside Cymasphere in your DAW",
    ];
  }, [t, translationsRevision]);

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
          {gridFeatures.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={cardVariants}
              $rotation={feature.rotation}
              $imageUrl={feature.image?.png || feature.image?.webp}
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

        {cymaSynthFeature && (
          <CymaSynthShowcase
            role="button"
            tabIndex={0}
            aria-label={cymaSynthFeature.title}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            viewport={{ once: true, margin: "-40px" }}
            onClick={() => {
              setSelectedFeature(CYMASYNTH_MODAL_INDEX);
              setModalOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setSelectedFeature(CYMASYNTH_MODAL_INDEX);
                setModalOpen(true);
              }
            }}
          >
            <CymaSynthShowcaseInner>
              <CymaSynthVisual>
                <CymaSynthImageGlow aria-hidden />
                <Image
                  src={CYMASYNTH_SHOWCASE_IMAGES.hero}
                  alt={t(
                    "hero.bundleCymaSynthImageAlt",
                    "CymaSynth wavetable synthesizer product interface",
                  )}
                  fill
                  sizes="(max-width: 900px) 100vw, 55vw"
                  quality={90}
                  priority={false}
                  style={{
                    objectFit: "contain",
                    objectPosition: "center center",
                    padding: "clamp(1rem, 3vw, 2rem)",
                  }}
                />
              </CymaSynthVisual>
              <CymaSynthCopy>
                <CymaSynthEyebrow>
                  {t(
                    "hero.bundleCymaSynthDesc",
                    "Wavetable synth · $149 value included",
                  )}
                </CymaSynthEyebrow>
                <CymaSynthTitle>{cymaSynthFeature.title}</CymaSynthTitle>
                <CymaSynthDescription>
                  {cymaSynthFeature.description}
                </CymaSynthDescription>
                <CymaSynthHighlights>
                  {cymaSynthHighlights.map((item) => (
                    <CymaSynthHighlight key={item.slice(0, 48)}>
                      {item}
                    </CymaSynthHighlight>
                  ))}
                </CymaSynthHighlights>
                <CymaSynthFormats>
                  <CymaSynthFormatBadge>Standalone app</CymaSynthFormatBadge>
                  <CymaSynthFormatBadge>VST3</CymaSynthFormatBadge>
                  <CymaSynthFormatBadge>AU</CymaSynthFormatBadge>
                  <CymaSynthFormatBadge>
                    {t("hero.platforms.macos", "macOS")} ·{" "}
                    {t("hero.platforms.windows", "Windows")}
                  </CymaSynthFormatBadge>
                </CymaSynthFormats>
                <CymaSynthLearnMore
                  href={CYMASYNTH_LEARN_MORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  {t("features.cymaSynth.learnMore", {
                    defaultValue: t("common.learnMore", "Learn More"),
                  })}{" "}
                  →
                </CymaSynthLearnMore>
              </CymaSynthCopy>
            </CymaSynthShowcaseInner>
          </CymaSynthShowcase>
        )}
      </FeaturesContent>

      <FeatureModal
        features={allFeatures}
        initialIndex={selectedFeature}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </FeaturesContainer>
  );
};

export default FeaturesSection;
