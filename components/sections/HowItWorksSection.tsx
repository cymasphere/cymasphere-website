"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import i18next from "i18next";

const SectionContainer = styled.section`
  width: 100%;
  padding: 80px 20px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
`;

const SectionTitle = styled(motion.h2)`
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const InfoBox = styled(motion.div)`
  background: rgba(30, 30, 46, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 30px;
  margin-bottom: 40px;
  max-width: 960px;
  width: 100%;
  border: 1px solid rgba(108, 99, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
`;

const Description = styled.p`
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  max-width: 800px;
  margin: 0 auto 40px;
  font-size: 1.1rem;
  line-height: 1.6;
  position: relative;
  z-index: 1;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 500px;
`;

interface TabProps {
  $active?: boolean;
}

const Tab = styled.button<TabProps>`
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : "rgba(30, 30, 46, 0.6)"};
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 25px;
  font-size: 1rem;
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  margin: 0 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.$active ? "0 5px 15px rgba(108, 99, 255, 0.3)" : "none"};

  &:hover {
    background: ${(props) =>
      props.$active
        ? "linear-gradient(135deg, var(--primary), var(--accent))"
        : "rgba(40, 40, 60, 0.8)"};
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
`;

interface WorkflowStepProps {
  reversed?: boolean;
}

const WorkflowStep = styled(motion.div)<WorkflowStepProps>`
  display: flex;
  flex-direction: ${(props) => (props.reversed ? "row-reverse" : "row")};
  align-items: center;
  margin-bottom: 40px;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const StepContent = styled.div`
  flex: 1;
  padding: 0 20px;
`;

interface StepImageProps {
  src?: string;
}

const StepImage = styled(motion.div)<StepImageProps>`
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  height: 240px;
  background-size: cover;
  background-position: center;
  background-image: url(${(props) => props.src});

  @media (max-width: 768px) {
    width: 100%;
    margin-top: 20px;
    height: 200px;
  }
`;

interface WorkflowTitleProps {
  number?: string | number;
}

const WorkflowTitle = styled.h3<WorkflowTitleProps>`
  font-size: 1.5rem;
  color: var(--primary);
  margin-bottom: 15px;
  display: flex;
  align-items: center;

  &:before {
    content: "${(props) => props.number}";
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    border-radius: 50%;
    margin-right: 15px;
    font-size: 1.1rem;
    color: white;
  }
`;

const WorkflowContent = styled.div`
  padding-left: 50px;
  border-left: 2px solid rgba(108, 99, 255, 0.3);
  padding-bottom: 10px;
`;

const WorkflowDescription = styled.p`
  margin-bottom: 15px;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.7;
`;

const BackgroundCircle = styled.div`
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(78, 205, 196, 0.1) 0%,
    rgba(108, 99, 255, 0.05) 50%,
    rgba(0, 0, 0, 0) 80%
  );
  top: -200px;
  right: -200px;
  z-index: 0;

  @media (max-width: 768px) {
    width: 400px;
    height: 400px;
    top: -150px;
    right: -150px;
  }
`;

const BackgroundCircle2 = styled.div`
  position: absolute;
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(108, 99, 255, 0.08) 0%,
    rgba(78, 205, 196, 0.03) 50%,
    rgba(0, 0, 0, 0) 80%
  );
  bottom: -200px;
  left: -200px;
  z-index: 0;

  @media (max-width: 768px) {
    width: 300px;
    height: 300px;
    bottom: -100px;
    left: -100px;
  }
`;

const workflowVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom * 0.2, duration: 0.5 },
  }),
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (custom: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: custom * 0.2 + 0.1, duration: 0.5 },
  }),
};

const HowItWorksSection = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("create"); // 'create', 'learn', or 'integrate'

  // Force re-render when language changes
  const [, forceUpdate] = useState({});
  useEffect(() => {
    const handleLanguageChanged = () => {
      forceUpdate({});
    };

    i18next.on("languageChanged", handleLanguageChanged);
    return () => {
      i18next.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  const sectionTitle = t("howItWorks.title", "How It Works");

  // Get subtitle based on the selected tab
  const getSubtitle = () => {
    switch (activeTab) {
      case "create":
        return t(
          "howItWorks.createSubtitle",
          "Compose music with powerful tools"
        );
      case "learn":
        return t(
          "howItWorks.learnSubtitle",
          "Master your favorite songs effortlessly"
        );
      case "integrate":
        return t(
          "howItWorks.integrateSubtitle",
          "Connect with your existing workflow"
        );
      default:
        return t("howItWorks.subtitle", "Music creation made simple");
    }
  };

  const sectionDescription = getSubtitle();

  // Get create workflow with translations
  const getCreateWorkflow = () => [
    {
      title: t(
        "howItWorks.createWorkflow.step1.title",
        "Start with Chord Progressions"
      ),
      description: t(
        "howItWorks.createWorkflow.step1.description",
        "Begin with pre-crafted templates or effortlessly build your own chord progressions by dragging voicings from the Harmony palette. The app automatically analyzes scales and modes, ensuring your music follows proper theory principles."
      ),
      image:
        "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?q=80&w=1000",
    },
    {
      title: t(
        "howItWorks.createWorkflow.step2.title",
        "Layer Multiple Tracks"
      ),
      description: t(
        "howItWorks.createWorkflow.step2.description",
        "Create rich compositions with multiple tracks that intelligently work together. Add harmony, melodies, and rhythms—all synchronized and harmonically compatible with your chord progression."
      ),
      image:
        "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000",
    },
    {
      title: t(
        "howItWorks.createWorkflow.step3.title",
        "Customize with Precision"
      ),
      description: t(
        "howItWorks.createWorkflow.step3.description",
        "Fine-tune your sound with detailed customization. Adjust inversions, voicing density, tension notes, and harmonic extensions to craft everything from simple triads to complex jazz harmonies."
      ),
      image:
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1000",
    },
    {
      title: t(
        "howItWorks.createWorkflow.step4.title",
        "Intelligent Musicality"
      ),
      description: t(
        "howItWorks.createWorkflow.step4.description",
        "Experience professional-level musicality with intelligent voice leading that ensures smooth chord transitions. Access composition tools previously available only to trained musicians, empowering you to create sophisticated harmonies with confidence."
      ),
      image:
        "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=1000",
    },
  ];

  // Get learn workflow with translations
  const getLearnWorkflow = () => [
    {
      title: t("howItWorks.learnWorkflow.step1.title", "Ghost Track Learning"),
      description: t(
        "howItWorks.learnWorkflow.step1.description",
        "Master chord progressions through interactive ghost tracks that guide your playing. Experiment with reharmonization in real-time, watching as the app adapts to your creative choices while maintaining musical coherence."
      ),
      image:
        "https://images.unsplash.com/photo-1558968406-1598644958132?q=80&w=1000",
    },
    {
      title: t(
        "howItWorks.learnWorkflow.step2.title",
        "Interactive Harmonic Analysis"
      ),
      description: t(
        "howItWorks.learnWorkflow.step2.description",
        "Explore comprehensive harmonic displays that reveal the theory behind your music. Visualize voicings, patterns, scales, and chords in real-time, gaining deep insights into the musical structure of your creations."
      ),
      image:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000",
    },
    {
      title: t(
        "howItWorks.learnWorkflow.step3.title",
        "Pattern-Based Learning"
      ),
      description: t(
        "howItWorks.learnWorkflow.step3.description",
        "Start with a simple pattern and watch it evolve as you explore different scales and chord qualities. The app's visual feedback helps you understand how each note contributes to the overall harmony, while the pattern editor lets you experiment with variations and build your musical intuition."
      ),
      image:
        "https://images.unsplash.com/photo-1514119412350-e174d90d280e?q=80&w=1000",
    },
    {
      title: t("howItWorks.learnWorkflow.step4.title", "Refine Your Skills"),
      description: t(
        "howItWorks.learnWorkflow.step4.description",
        "Improve your musical ear by experimenting with different chord substitutions and modal interchange. As you refine your harmonic choices, you'll develop a deeper understanding of chord qualities and progressions, naturally building both your technical skills and creative voice."
      ),
      image:
        "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=1000",
    },
  ];

  // Get integrate workflow with translations
  const getIntegrateWorkflow = () => [
    {
      title: t("howItWorks.integrateWorkflow.step1.title", "DAW Compatibility"),
      description: t(
        "howItWorks.integrateWorkflow.step1.description",
        "Use Cymasphere as a standalone application or as a VST/AU plugin within your DAW. Whether you're sketching ideas independently or integrating directly into your production, the app adapts to your preferred workflow."
      ),
      image:
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000",
    },
    {
      title: t(
        "howItWorks.integrateWorkflow.step2.title",
        "Multi-Track Control"
      ),
      description: t(
        "howItWorks.integrateWorkflow.step2.description",
        "Manage multiple tracks simultaneously, each with its own independent voice settings and patterns. Create rich, layered arrangements by assigning different musical elements to separate tracks within your DAW."
      ),
      image:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000",
    },
    {
      title: t(
        "howItWorks.integrateWorkflow.step3.title",
        "Voice Channel Matrix"
      ),
      description: t(
        "howItWorks.integrateWorkflow.step3.description",
        "Precisely control where each voice is sent using the channel matrix. Route individual voices to specific MIDI channels in your DAW, giving you complete control over instrument assignment and voice distribution."
      ),
      image:
        "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=1000",
    },
    {
      title: t("howItWorks.integrateWorkflow.step4.title", "Seamless Workflow"),
      description: t(
        "howItWorks.integrateWorkflow.step4.description",
        "Integrate Cymasphere into your production process as a powerful harmony and pattern generator. Use it to quickly sketch ideas, develop complex progressions, and create musical patterns that feed directly into your DAW's instruments."
      ),
      image:
        "https://images.unsplash.com/photo-1563330232-57114bb0823c?q=80&w=1000",
    },
  ];

  // Select the workflow data based on active tab
  const getWorkflow = () => {
    switch (activeTab) {
      case "create":
        return getCreateWorkflow();
      case "learn":
        return getLearnWorkflow();
      case "integrate":
        return getIntegrateWorkflow();
      default:
        return getCreateWorkflow();
    }
  };

  const currentWorkflow = getWorkflow();

  return (
    <SectionContainer id="how-it-works">
      <BackgroundCircle />
      <BackgroundCircle2 />

      <SectionTitle
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {sectionTitle}
      </SectionTitle>

      <Description>{sectionDescription}</Description>

      <TabsContainer>
        <Tab
          $active={activeTab === "create"}
          onClick={() => setActiveTab("create")}
        >
          {t("howItWorks.tabs.create", "CREATE")}
        </Tab>
        <Tab
          $active={activeTab === "learn"}
          onClick={() => setActiveTab("learn")}
        >
          {t("howItWorks.tabs.learn", "LEARN")}
        </Tab>
        <Tab
          $active={activeTab === "integrate"}
          onClick={() => setActiveTab("integrate")}
        >
          {t("howItWorks.tabs.integrate", "INTEGRATE")}
        </Tab>
      </TabsContainer>

      <InfoBox
        key={activeTab}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
      >
        {currentWorkflow.map((step, index) => (
          <WorkflowStep
            key={index}
            variants={workflowVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={index}
            reversed={index % 2 !== 0}
          >
            <StepContent>
              <WorkflowTitle number={index + 1}>{step.title}</WorkflowTitle>
              <WorkflowContent>
                <WorkflowDescription>{step.description}</WorkflowDescription>
              </WorkflowContent>
            </StepContent>
            <StepImage
              src={step.image}
              variants={imageVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={index}
            />
          </WorkflowStep>
        ))}
      </InfoBox>

      {/* Interactive demo removed 
      <PreviewNote>
        The interactive demo below gives you just a small taste of Cymasphere's capabilities. The full application offers greatly expanded functionality, deeper customization options, and a comprehensive suite of tools for creating professional-quality music.
      </PreviewNote>
      
      <SynthesizerContainer 
        isWizardMode={true} 
        sectionTitle=""
        sectionDescription=""
      />
      */}
    </SectionContainer>
  );
};

export default HowItWorksSection;
