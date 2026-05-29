/**
 * @fileoverview FAQSection Component
 * @module components/sections/FAQSection
 *
 * Frequently Asked Questions section with expandable accordion-style items.
 * Each FAQ item can be expanded to show the answer. Features smooth animations
 * and icon indicators for each question.
 *
 * @example
 * // Basic usage
 * <FAQSection />
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import DOMPurify from "dompurify";
import {
  FaMusic,
  FaQuestion,
  FaPuzzlePiece,
  FaSlidersH,
  FaPlug,
  FaPalette,
  FaWaveSquare,
  FaLayerGroup,
  FaSyncAlt,
  FaUserGraduate,
  FaBook,
} from "react-icons/fa";

const FAQContainer = styled.section`
  padding: 100px 20px;
  background-color: var(--background);
  position: relative;
  overflow: hidden;
`;

const FAQContent = styled.div`
  max-width: 900px;
  margin: 0 auto;
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

const FAQItem = styled.div`
  background-color: var(--card-bg);
  border-radius: 10px;
  margin-bottom: 20px;
  overflow: hidden;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
`;

const FAQHeader = styled.div`
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background-color: var(--card-bg);
  transition: background-color 0.3s ease;

  &:hover {
    background-color: rgba(108, 99, 255, 0.05);
  }
`;

const Question = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: var(--text);
  flex: 1;
  display: flex;
  align-items: center;

  svg {
    margin-right: 12px;
    color: var(--primary);
    font-size: 1.4rem;
    min-width: 24px;
  }
`;

interface ToggleButtonProps {
  isOpen?: boolean;
}

const ToggleButton = styled(
  ({ isOpen, ...props }: ToggleButtonProps & React.HTMLAttributes<HTMLSpanElement>) => (
    <span {...props} />
  ),
)`
  color: var(--primary);
  font-size: 1.5rem;
  font-weight: bold;
  transition: transform 0.3s ease;
  transform: ${(props) => (props.isOpen ? "rotate(45deg)" : "rotate(0)")};
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
`;

const Answer = styled(motion.div)`
  padding: 0 25px;
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1rem;
`;

interface ExpandedFaqs {
  [key: number]: boolean;
}

interface FAQItemData {
  question: string;
  answer: string;
}

/** @brief English fallbacks when i18n bundle is stale or still loading. */
const DEFAULT_FAQ_QUESTIONS: FAQItemData[] = [
  {
    question: "What is Cymasphere?",
    answer:
      "Cymasphere is a complete song creation suite available both as a standalone application and as a plugin (AU & VST3) for your DAW. It provides integrated tools for composing both harmony and melody, featuring intelligent chord voicing, melody pattern construction, and interactive visualization that makes music theory accessible and intuitive for all skill levels. Every subscription and lifetime license also includes CymaSynth—our professional wavetable synthesizer (standalone app, VST3 & AU)—bundled at no extra cost.",
  },
  {
    question: "What is CymaSynth, and is it really included with Cymasphere?",
    answer:
      "CymaSynth is NNAudio’s professional wavetable synthesizer: multiple oscillators, deep modulation, dual filters, effects, and 32-voice polyphony—designed for serious sound design. It runs as a standalone app and as VST3 and AU plugins. Sold on its own it’s a $149 product; with Cymasphere it’s included at no extra cost on every subscription and lifetime license. You don’t buy it separately when you subscribe—you get both the composition suite and this flagship instrument in one.",
  },
];

/**
 * @brief Normalizes `faq.questions` from i18next (array or numeric-key object).
 * @param raw Value from `t('faq.questions', { returnObjects: true })`.
 * @returns FAQ entries with CymaSynth Q&A guaranteed when English fallbacks apply.
 */
function resolveFaqQuestions(raw: unknown): FAQItemData[] {
  let list: FAQItemData[] = [];

  if (Array.isArray(raw)) {
    list = raw.filter(
      (item): item is FAQItemData =>
        !!item &&
        typeof item === "object" &&
        typeof (item as FAQItemData).question === "string" &&
        typeof (item as FAQItemData).answer === "string",
    );
  } else if (raw && typeof raw === "object") {
    list = Object.keys(raw as Record<string, unknown>)
      .filter((k) => /^\d+$/.test(k))
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => (raw as Record<string, FAQItemData>)[k])
      .filter(
        (item): item is FAQItemData =>
          !!item &&
          typeof item.question === "string" &&
          typeof item.answer === "string",
      );
  }

  const hasCymaSynthFaq = list.some(
    (q) =>
      /cymaSynth/i.test(q.question) &&
      /included|inclus|enthalten|inclu|dahil|含|同梱|包含/i.test(q.question),
  );

  if (!hasCymaSynthFaq) {
    const merged = [...list];
    const cymaEntry = DEFAULT_FAQ_QUESTIONS[1];
    if (merged.length >= 1) {
      merged.splice(1, 0, cymaEntry);
    } else {
      merged.push(...DEFAULT_FAQ_QUESTIONS);
    }
    return merged.length > 0 ? merged : DEFAULT_FAQ_QUESTIONS;
  }

  return list.length > 0 ? list : DEFAULT_FAQ_QUESTIONS;
}

/**
 * @brief FAQSection component
 *
 * Displays frequently asked questions in an accordion format. Questions are
 * loaded from translation files and can be expanded to reveal answers. Each
 * question has an associated icon for visual identification.
 *
 * @returns {JSX.Element} The rendered FAQ section component
 *
 * @note Questions and answers are loaded from translation files
 * @note Multiple questions can be expanded simultaneously
 * @note Answers support HTML content via dangerouslySetInnerHTML
 * @note Icons cycle through a predefined set
 * @note Cards animate in sequence on scroll into view
 * @note Supports internationalization through react-i18next
 */
const FAQSection = () => {
  const [expandedFaqs, setExpandedFaqs] = useState<ExpandedFaqs>({});
  const { t, i18n } = useTranslation();

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

  const toggleFaq = (index: number) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const faqIcons = [
    <FaMusic key="music" />,
    <FaWaveSquare key="cyma" />,
    <FaQuestion key="question" />,
    <FaLayerGroup key="layer" />,
    <FaPalette key="palette" />,
    <FaWaveSquare key="wave" />,
    <FaSyncAlt key="sync" />,
    <FaSlidersH key="sliders" />,
    <FaPuzzlePiece key="puzzle" />,
    <FaPlug key="plug" />,
    <FaUserGraduate key="graduate" />,
    <FaBook key="book" />,
  ];

  const faqItems = useMemo(() => {
    const raw = t("faq.questions", { returnObjects: true });
    const questionsData = resolveFaqQuestions(raw);

    return questionsData.map((question: FAQItemData, index: number) => ({
      icon: faqIcons[index % faqIcons.length],
      question: question.question,
      answer: question.answer,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revision busts stale i18n cache
  }, [t, translationsRevision]);

  const sectionTitle = t("faq.title", "Frequently Asked Questions");

  return (
    <FAQContainer id="faq">
      <FAQContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle>{sectionTitle}</SectionTitle>
        </motion.div>

        {faqItems.map((faq, index) => (
          <motion.div
            key={`${faq.question.slice(0, 48)}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <FAQItem>
              <FAQHeader onClick={() => toggleFaq(index)}>
                <Question>
                  {faq.icon} {faq.question}
                </Question>
                <ToggleButton isOpen={expandedFaqs[index]}>+</ToggleButton>
              </FAQHeader>

              <Answer
                initial={false}
                animate={{
                  height: expandedFaqs[index] ? "auto" : 0,
                  opacity: expandedFaqs[index] ? 1 : 0,
                  marginBottom: expandedFaqs[index] ? "20px" : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <p
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof window !== "undefined"
                        ? DOMPurify.sanitize(faq.answer)
                        : faq.answer,
                  }}
                />
              </Answer>
            </FAQItem>
          </motion.div>
        ))}
      </FAQContent>
    </FAQContainer>
  );
};

export default FAQSection;
