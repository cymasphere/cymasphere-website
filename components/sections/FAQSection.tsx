"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";

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
`;

interface ToggleButtonProps {
  isOpen?: boolean;
}

const ToggleButton = styled.span<ToggleButtonProps>`
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

const FAQSection = () => {
  const [expandedFaqs, setExpandedFaqs] = useState<ExpandedFaqs>({});

  const toggleFaq = (index: number) => {
    setExpandedFaqs((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const faqItems = [
    {
      question: "What is Cymasphere?",
      answer:
        "Cymasphere is an advanced music theory and composition tool available both as a standalone application and as a plugin (AU & VST3) for your DAW. It helps musicians create better chord progressions with intelligent voice leading and harmony visualization.",
    },
    {
      question: "What problems does Cymasphere solve for musicians?",
      answer:
        "Cymasphere solves common compositional challenges like creating interesting chord progressions, developing smooth voice leading, and finding harmonic inspiration. It helps bridge the gap between music theory knowledge and practical application, making composition more intuitive and accessible.",
    },
    {
      question:
        "What are the differences between the standalone app and the plugin?",
      answer:
        "The standalone app and plugin versions share the same core features and functionality. The standalone app works independently, making it great for composition and exploration, while the plugin integrates directly with your DAW for seamless production workflow. You can choose which version works best for your creative process, or use both depending on your needs.",
    },
    {
      question: "Which DAWs are compatible with the Cymasphere plugin?",
      answer:
        "The Cymasphere plugin (available in AU & VST3 formats) is compatible with most major DAWs including Logic Pro, Ableton Live, FL Studio, Cubase, Studio One, Reaper, Bitwig, and Digital Performer. Both macOS and Windows platforms are supported.",
    },
    {
      question: "How does the Interactive Harmony Palette work?",
      answer:
        "The Interactive Harmony Palette provides a visual interface for exploring chord relationships. Simply select a starting chord and the palette will show you harmonically related options, making it easy to craft compelling progressions in both the standalone app and plugin versions.",
    },
    {
      question: "What makes the Voicing Generator special?",
      answer:
        "Our Voicing Generator uses advanced algorithms to create rich, musically satisfying chord voicings that follow proper voice leading principles. It analyzes your chord progression to ensure smooth voice transitions between chords, whether you're using the standalone app or plugin version.",
    },
    {
      question: "How does the Song Builder help with composition?",
      answer:
        "The Song Builder allows you to arrange chord progressions into complete song structures. You can experiment with different sections, try various arrangements, and build a cohesive composition from your chord ideas. This feature works seamlessly in both the standalone app and DAW plugin versions of Cymasphere.",
    },
    {
      question: "Is Cymasphere suitable for beginners?",
      answer:
        "Absolutely! While Cymasphere offers advanced functionality for experienced composers, its intuitive interface makes music theory accessible to beginners, helping them understand harmony concepts visually. Both the standalone app and DAW plugin versions are designed to be user-friendly for all skill levels.",
    },
    {
      question: "Do I need to know music theory to use Cymasphere?",
      answer:
        "No, that's one of Cymasphere's strengths! While music theory knowledge can enhance your experience, Cymasphere is designed to be intuitive even for those with limited theory background. The visual interface helps you understand musical relationships as you compose, making it an excellent learning tool.",
    },
  ];

  return (
    <FAQContainer id="faq">
      <FAQContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <SectionTitle>Frequently Asked Questions</SectionTitle>
        </motion.div>

        {faqItems.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.6 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <FAQItem>
              <FAQHeader onClick={() => toggleFaq(index)}>
                <Question>{faq.question}</Question>
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
                <p>{faq.answer}</p>
              </Answer>
            </FAQItem>
          </motion.div>
        ))}
      </FAQContent>
    </FAQContainer>
  );
};

export default FAQSection;
