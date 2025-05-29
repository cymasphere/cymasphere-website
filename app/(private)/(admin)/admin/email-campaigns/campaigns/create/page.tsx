"use client";
import React, { useState } from "react";
import Image from "next/image";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import {
  FaEnvelopeOpen,
  FaArrowLeft,
  FaArrowRight,
  FaUsers,
  FaPalette,
  FaEdit,
  FaPaperPlane,
  FaClock,
} from "react-icons/fa";
import styled from "styled-components";
import { AnimatePresence } from "framer-motion";

interface EmailElement {
  id: string;
  type: string;
  content: string;
  style?: Record<string, string>;
  src?: string;
  height?: string;
}

interface ElementUpdate {
  content?: string;
  style?: Record<string, string>;
}

// Styled components
const Container = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  svg {
    color: var(--primary);
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const Step = styled.div<{ active: boolean; completed: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  ${(props) => {
    if (props.completed) {
      return `
        background-color: rgba(40, 167, 69, 0.2);
        color: #28a745;
        border: 2px solid #28a745;
      `;
    } else if (props.active) {
      return `
        background-color: rgba(108, 99, 255, 0.2);
        color: var(--primary);
        border: 2px solid var(--primary);
      `;
    } else {
      return `
        background-color: rgba(255, 255, 255, 0.05);
        color: var(--text-secondary);
        border: 2px solid rgba(255, 255, 255, 0.1);
      `;
    }
  }}

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
`;

const StepConnector = styled.div<{ completed: boolean }>`
  width: 40px;
  height: 2px;
  background-color: ${(props) =>
    props.completed ? "#28a745" : "rgba(255, 255, 255, 0.1)"};
  transition: background-color 0.3s ease;

  @media (max-width: 768px) {
    width: 20px;
  }
`;

const StepContent = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
  min-height: 600px;
`;

const StepTitle = styled.h2`
  font-size: 1.8rem;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: var(--primary);
  }
`;

const StepDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1rem;
  line-height: 1.6;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
`;

const NavButton = styled.button<{ variant?: "primary" | "secondary" }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;

  ${(props) => {
    switch (props.variant) {
      case "primary":
        return `
          background: linear-gradient(90deg, var(--primary), var(--accent));
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
          }
        `;
      default:
        return `
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.1);
          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: var(--text);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`;

function CreateCampaignPage() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [emailElements, setEmailElements] = useState<EmailElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(
    null
  );
  const [editingElementId, setEditingElementId] = useState<string | null>(null);

  const createNewElement = (type: string): EmailElement => {
    return {
      id: `element-${Date.now()}`,
      type,
      content: "",
    };
  };

  const updateElement = (elementId: string, updates: ElementUpdate) => {
    setEmailElements((elements) =>
      elements.map((el) => (el.id === elementId ? { ...el, ...updates } : el))
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData("elementType");
    if (elementType) {
      const newElement = createNewElement(elementType);
      setEmailElements((elements) => [...elements, newElement]);
    }
  };

  const renderEmailElement = (element: EmailElement) => {
    const isSelected = selectedElementId === element.id;
    const isEditing = editingElementId === element.id;

    return (
      <div
        key={element.id}
        style={{
          position: "relative",
          border: isSelected ? "2px solid var(--primary)" : "none",
          padding: "0.5rem",
          marginBottom: "1rem",
        }}
        onClick={() => setSelectedElementId(element.id)}
        onDoubleClick={() => setEditingElementId(element.id)}
      >
        {element.type === "text" && (
          <div
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => {
              updateElement(element.id, {
                content: e.currentTarget.textContent || "",
              });
              setEditingElementId(null);
            }}
            style={{
              minHeight: "1.5rem",
              outline: "none",
              ...element.style,
            }}
          >
            {element.content}
          </div>
        )}
        {element.type === "image" && (
          <Image
            src={element.src || "/placeholder-image.jpg"}
            alt=""
            width={200}
            height={200}
            style={{
              maxWidth: "100%",
              height: element.height || "auto",
              ...element.style,
            }}
          />
        )}
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div>
            <StepTitle>
              <FaUsers /> {t("Select Audience")}
            </StepTitle>
            <StepDescription>
              {t("Choose who will receive this campaign")}
            </StepDescription>
            {/* Audience selection content */}
          </div>
        );
      case 2:
        return (
          <div>
            <StepTitle>
              <FaPalette /> {t("Choose Template")}
            </StepTitle>
            <StepDescription>
              {t("Select a template or start from scratch")}
            </StepDescription>
            {/* Template selection content */}
          </div>
        );
      case 3:
        return (
          <div>
            <StepTitle>
              <FaEdit /> {t("Edit Content")}
            </StepTitle>
            <StepDescription>
              {t("Customize your email content")}
            </StepDescription>
            {/* Content editor */}
            <div
              onDrop={(e) => handleDrop(e)}
              style={{ minHeight: "400px", padding: "1rem" }}
            >
              {emailElements.map((element) => renderEmailElement(element))}
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <StepTitle>
              <FaClock /> {t("Schedule")}
            </StepTitle>
            <StepDescription>
              {t("Choose when to send your campaign")}
            </StepDescription>
            {/* Schedule content */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Container>
      <NextSEO title={t("Create Campaign")} />
      <Header>
        <Title>
          <FaEnvelopeOpen /> {t("Create Campaign")}
        </Title>
        <Subtitle>{t("Create and send a new email campaign")}</Subtitle>
      </Header>

      <StepIndicator>
        <Step active={currentStep === 1} completed={currentStep > 1}>
          <FaUsers /> {t("Audience")}
        </Step>
        <StepConnector completed={currentStep > 1} />
        <Step active={currentStep === 2} completed={currentStep > 2}>
          <FaPalette /> {t("Template")}
        </Step>
        <StepConnector completed={currentStep > 2} />
        <Step active={currentStep === 3} completed={currentStep > 3}>
          <FaEdit /> {t("Content")}
        </Step>
        <StepConnector completed={currentStep > 3} />
        <Step active={currentStep === 4} completed={currentStep > 4}>
          <FaClock /> {t("Schedule")}
        </Step>
      </StepIndicator>

      <StepContent>
        <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
      </StepContent>

      <NavigationButtons>
        {currentStep > 1 && (
          <NavButton onClick={() => setCurrentStep(currentStep - 1)}>
            <FaArrowLeft /> {t("Previous")}
          </NavButton>
        )}
        {currentStep < 4 ? (
          <NavButton
            variant="primary"
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            {t("Next")} <FaArrowRight />
          </NavButton>
        ) : (
          <NavButton variant="primary">
            <FaPaperPlane /> {t("Send Campaign")}
          </NavButton>
        )}
      </NavigationButtons>
    </Container>
  );
}

export default CreateCampaignPage;
