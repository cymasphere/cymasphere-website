"use client";

import React, { useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

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

const Tab = styled.button`
  background: ${(props) =>
    props.active
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : "rgba(30, 30, 46, 0.6)"};
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 25px;
  font-size: 1rem;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  margin: 0 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: ${(props) =>
    props.active ? "0 5px 15px rgba(108, 99, 255, 0.3)" : "none"};

  &:hover {
    background: ${(props) =>
      props.active
        ? "linear-gradient(135deg, var(--primary), var(--accent))"
        : "rgba(40, 40, 60, 0.8)"};
  }

  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 0.9rem;
  }
`;

const WorkflowStep = styled(motion.div)`
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

const StepImage = styled(motion.div)`
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

const WorkflowTitle = styled.h3`
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
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: { delay: custom * 0.2, duration: 0.5 },
  }),
};

const imageVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (custom) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: custom * 0.2 + 0.1, duration: 0.5 },
  }),
};

// Create song workflow data
const createSongWorkflow = [
  {
    title: "Start with Chord Progressions",
    description:
      "Begin with our pre-created song template and build your chord progressions by dragging voicings from the Harmony palette. The app automatically analyzes scales and modes, ensuring your music follows proper theory principles.",
    image:
      "https://images.unsplash.com/photo-1513883049090-d0b7439799bf?q=80&w=1000",
  },
  {
    title: "Layer Multiple Tracks",
    description:
      "Create rich compositions with multiple tracks that intelligently work together. Add harmony, melodies, and rhythms—all synchronized and harmonically compatible with your chord progression.",
    image:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1000",
  },
  {
    title: "Customize with Precision",
    description:
      "Fine-tune your sound with detailed customization. Adjust inversions, voicing density, tension notes, and harmonic extensions to craft everything from simple triads to complex jazz harmonies.",
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1000",
  },
  {
    title: "Intelligent Musicality",
    description:
      "Our advanced algorithms provide professional-level musicality with intelligent voice leading that ensures smooth chord transitions. Experience composition tools previously available only to trained musicians.",
    image:
      "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=1000",
  },
];

// Learn song workflow data
const learnSongWorkflow = [
  {
    title: "Import Your Favorite Songs",
    description:
      "Upload your music or connect to streaming services to import songs you want to learn. Our AI analyzes the track, identifying chords, progressions, and key elements.",
    image:
      "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000",
  },
  {
    title: "Visual Chord Breakdowns",
    description:
      "See chord progressions visualized in real-time as the song plays. Our interactive interface highlights each chord and shows proper finger positions for your instrument.",
    image:
      "https://images.unsplash.com/photo-1558968406-1598644958132?q=80&w=1000",
  },
  {
    title: "Practice at Your Pace",
    description:
      "Slow down complex sections without changing pitch, loop difficult passages, and use our step-by-step tutorials to master challenging parts of the song.",
    image:
      "https://images.unsplash.com/photo-1514119412350-e174d90d280e?q=80&w=1000",
  },
  {
    title: "Track Your Progress",
    description:
      "Our smart learning system tracks your improvement and suggests personalized practice exercises. Earn achievements as you master different songs and techniques.",
    image:
      "https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=1000",
  },
];

// Integrate workflow data
const integrateWorkflow = [
  {
    title: "Connect with DAWs",
    description:
      "Seamlessly bridge Cymasphere with your favorite digital audio workstations. Export your compositions as MIDI or audio files for further production.",
    image:
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=1000",
  },
  {
    title: "Collaborate in Real-Time",
    description:
      "Share your projects with collaborators and work together synchronously. Changes are instantly visible to all participants, making remote collaboration effortless.",
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000",
  },
  {
    title: "Hardware Compatibility",
    description:
      "Connect MIDI controllers, keyboards, and other hardware to enhance your workflow. Cymasphere automatically detects connected devices for plug-and-play functionality.",
    image:
      "https://images.unsplash.com/photo-1598653222000-6b7b7a552625?q=80&w=1000",
  },
  {
    title: "Third-Party Plugins",
    description:
      "Expand Cymasphere's capabilities with our growing ecosystem of plugins. Access additional instruments, effects, and workflow tools from our marketplace.",
    image:
      "https://images.unsplash.com/photo-1563330232-57114bb0823c?q=80&w=1000",
  },
];

const HowItWorksSection = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("create"); // 'create', 'learn', or 'integrate'

  const sectionTitle = t("sections.howItWorks.title", "How It Works");

  // Get subtitle based on the selected tab
  const getSubtitle = () => {
    switch (activeTab) {
      case "create":
        return t(
          "sections.howItWorks.createSubtitle",
          "Compose music with powerful tools"
        );
      case "learn":
        return t(
          "sections.howItWorks.learnSubtitle",
          "Master your favorite songs effortlessly"
        );
      case "integrate":
        return t(
          "sections.howItWorks.integrateSubtitle",
          "Connect with your existing workflow"
        );
      default:
        return t("sections.howItWorks.subtitle", "Music creation made simple");
    }
  };

  const sectionDescription = getSubtitle();

  // Select the workflow data based on active tab
  const getWorkflow = () => {
    switch (activeTab) {
      case "create":
        return createSongWorkflow;
      case "learn":
        return learnSongWorkflow;
      case "integrate":
        return integrateWorkflow;
      default:
        return createSongWorkflow;
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
          active={activeTab === "create"}
          onClick={() => setActiveTab("create")}
        >
          CREATE
        </Tab>
        <Tab
          active={activeTab === "learn"}
          onClick={() => setActiveTab("learn")}
        >
          LEARN
        </Tab>
        <Tab
          active={activeTab === "integrate"}
          onClick={() => setActiveTab("integrate")}
        >
          INTEGRATE
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
