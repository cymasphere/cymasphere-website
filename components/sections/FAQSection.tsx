"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
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
  FaBook 
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

const ToggleButton = styled(({ isOpen, ...props }: ToggleButtonProps & React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props} />
))`
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
      icon: <FaMusic />,
      question: "What is Cymasphere?",
      answer:
        "Cymasphere is a complete song creation suite available both as a standalone application and as a plugin (AU & VST3) for your DAW. It provides integrated tools for composing both harmony and melody, featuring intelligent chord voicing, melody pattern construction, and interactive visualization that makes music theory accessible and intuitive for all skill levels.",
    },
    {
      icon: <FaQuestion />,
      question: "What problems does Cymasphere solve for musicians?",
      answer:
        "Cymasphere addresses common compositional challenges like creating compelling chord progressions, developing complementary melodies, crafting smooth voice leading, and finding musical inspiration. It bridges the gap between music theory knowledge and practical application, making the entire composition process more intuitive and accessible for producers at any skill level.",
    },
    {
      icon: <FaLayerGroup />,
      question: "How does the Song Builder help with composition?",
      answer:
        "The Song Builder is your central creative hub where all musical elements come together. You can arrange chord progressions, create melody patterns, and build complete song structures with multiple tracks. The system features professional transport controls, an interactive timeline, multi-track management with per-track settings, and a comprehensive arrangement view that gives you a holistic perspective of your composition as it develops.",
    },
    {
      icon: <FaPalette />,
      question: "How does the Interactive Harmony Palette work?",
      answer:
        "The Interactive Harmony Palette provides a visual, gestural interface for exploring chord relationships. Simply select a starting chord and the palette will show you harmonically related options, making it easy to craft compelling progressions. You can drag and drop voicings directly to your timeline, instantly transpose keys, and create custom chord banks to develop your personal harmonic vocabulary.",
    },
    {
      icon: <FaWaveSquare />,
      question: "What makes the Melody Pattern Constructor special?",
      answer:
        "The Melody Pattern Constructor helps you develop compelling melodies that complement your chord progressions. It suggests contextually appropriate melodic patterns based on your harmonic choices, allows you to experiment with different rhythmic variations, and provides intuitive tools for crafting memorable themes. The system intelligently adapts your melodic content when chord changes occur, maintaining musical coherence throughout your composition.",
    },
    {
      icon: <FaSyncAlt />,
      question: "How do patterns adapt to chord changes?",
      answer:
        "Cymasphere's Dynamic Pattern Editor uses intelligent algorithms to adapt melodic patterns to your chord progressions in real-time. When you change a chord, the system automatically adjusts the pattern to maintain harmonic coherence while preserving the musical intent of your melody. This works in both relative and absolute modes, giving you flexibility to create context-aware melodies or fixed melodic content as needed.",
    },
    {
      icon: <FaSlidersH />,
      question: "What makes the Voicing Generator special?",
      answer:
        "The Voicing Generator uses advanced algorithms to create rich, musically satisfying chord voicings that follow proper voice leading principles. It analyzes chord progressions to ensure smooth voice transitions between chords, with controls for voicing width, density, inversions, and harmonic extensions. Settings can be applied globally or adjusted for specific sections of your composition.",
    },
    {
      icon: <FaPuzzlePiece />,
      question:
        "What are the differences between the standalone app and the plugin?",
      answer:
        "The standalone app and plugin versions share the same core features and functionality. The standalone app works independently, making it great for focused composition and exploration, while the plugin integrates directly with your DAW for seamless production workflow. You can choose which version works best for your creative process, or use both depending on your needs.",
    },
    {
      icon: <FaPlug />,
      question: "Which DAWs are compatible with the Cymasphere plugin?",
      answer:
        "The Cymasphere plugin (available in AU & VST3 formats) is compatible with most major DAWs including Logic Pro, Ableton Live, FL Studio, Cubase, Studio One, Reaper, Bitwig, and Digital Performer. Both macOS and Windows platforms are supported.",
    },
    {
      icon: <FaUserGraduate />,
      question: "Is Cymasphere suitable for beginners?",
      answer:
        "Absolutely! While Cymasphere offers advanced functionality for experienced composers, its intuitive interface makes music theory accessible to beginners, helping them understand harmony and melody concepts visually. The interactive nature of the tools encourages experimentation and learning by doing, making it an excellent platform for developing composition skills regardless of your starting point.",
    },
    {
      icon: <FaBook />,
      question: "Do I need to know music theory to use Cymasphere?",
      answer:
        "No, that's one of Cymasphere's strengths! While music theory knowledge can enhance your experience, Cymasphere is designed to be intuitive even for those with limited theory background. The visual interfaces help you understand musical relationships as you compose, making it both a powerful creation tool and an excellent learning resource that grows with you as you develop your skills.",
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
                <Question>{faq.icon} {faq.question}</Question>
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
