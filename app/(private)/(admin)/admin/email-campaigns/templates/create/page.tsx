"use client";
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import NextSEO from "@/components/NextSEO";
import { useAuth } from "@/contexts/AuthContext";
import LoadingComponent from "@/components/common/LoadingComponent";
import useLanguage from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import {
  FaArrowLeft,
  FaSave,
  FaFileAlt,
  FaChevronRight,
  FaInfoCircle,
  FaEdit,
  FaMousePointer,
  FaDivide,
  FaShareAlt,
  FaExpandArrowsAlt,
  FaColumns,
  FaVideo,
  FaDesktop,
  FaMobileAlt,
  FaEnvelope,
  FaImage,
  FaFont,
  FaHeading,
} from "react-icons/fa";
import Link from "next/link";
import VisualEditor from "@/components/email-campaigns/VisualEditor";

// Copy all the styled components from campaign creation
const CreateContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Breadcrumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const BreadcrumbLink = styled(Link)`
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary);
  }
`;

const BreadcrumbCurrent = styled.span`
  color: var(--text);
  font-weight: 500;
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

const FormSection = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: var(--text);
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
  }

  option {
    background-color: var(--card-bg);
    color: var(--text);
  }
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

// Copy visual editor components from campaign creation
const ViewToggle = styled.button<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  background: ${(props) =>
    props.active
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : "rgba(255, 255, 255, 0.08)"};
  color: ${(props) => (props.active ? "white" : "var(--text-secondary)")};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &:hover {
    background: ${(props) =>
      props.active
        ? "linear-gradient(135deg, var(--accent), var(--primary))"
        : "rgba(255, 255, 255, 0.15)"};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(108, 99, 255, 0.3);
  }
`;

const EmailCanvas = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  justify-content: center;
  min-height: 600px;
  position: relative;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const EmailContainer = styled.div`
  width: 600px;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.2), 0 12px 30px rgba(0, 0, 0, 0.15);
  }
`;

const EmailHeader = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  position: relative;

  &:after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(108, 99, 255, 0.3),
      transparent
    );
  }
`;

const EmailBody = styled.div`
  padding: 2.5rem;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
`;

const EmailFooter = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #dee2e6;
  position: relative;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(108, 99, 255, 0.3),
      transparent
    );
  }
`;

const ContentElementsBar = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  margin-bottom: 1.5rem;
  overflow-x: auto;
  overflow-y: hidden;
`;

const ContentElementButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  min-width: 80px;
  border-radius: 12px;
  border: 2px solid transparent;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 100%
  );
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.8rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);

  &:hover {
    border-color: var(--primary);
    transform: translateY(-3px) scale(1.05);
    box-shadow: 0 10px 30px rgba(108, 99, 255, 0.3);
  }

  &:active {
    cursor: grabbing;
    transform: translateY(-1px) scale(0.98);
  }

  .icon {
    font-size: 1.4rem;
    color: var(--primary);
    z-index: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  .label {
    color: var(--text);
    font-weight: 600;
    z-index: 1;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }
`;

const DragPreview = styled.div`
  position: fixed;
  top: -1000px;
  left: -1000px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  pointer-events: none;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const DroppableArea = styled.div<{ isDragOver: boolean }>`
  min-height: 50px;
  border: 2px dashed
    ${(props) => (props.isDragOver ? "var(--primary)" : "transparent")};
  border-radius: 12px;
  background: ${(props) =>
    props.isDragOver ? "rgba(108, 99, 255, 0.1)" : "transparent"};
  transition: all 0.3s ease;
  position: relative;
  margin: 1rem 0;

  &:before {
    content: "${(props) =>
      props.isDragOver ? "✨ Drop here to add content" : ""}";
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--primary);
    font-weight: 600;
    font-size: 0.9rem;
    white-space: nowrap;
  }
`;

const EmailElement = styled.div<{ selected?: boolean; editing?: boolean }>`
  margin: 1rem 0;
  padding: 1rem;
  border: 2px solid
    ${(props) => {
      if (props.editing) return "var(--accent)";
      if (props.selected) return "var(--primary)";
      return "transparent";
    }};
  border-radius: 8px;
  background: ${(props) => {
    if (props.editing) return "rgba(255, 193, 7, 0.1)";
    if (props.selected) return "rgba(108, 99, 255, 0.1)";
    return "rgba(255, 255, 255, 0.02)";
  }};
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: ${(props) =>
      props.editing ? "var(--accent)" : "var(--primary)"};
    background: ${(props) => {
      if (props.editing) return "rgba(255, 193, 7, 0.15)";
      return "rgba(108, 99, 255, 0.08)";
    }};
  }
`;

const EditableText = styled.div<{ isEditing: boolean }>`
  outline: none;
  ${(props) =>
    props.isEditing
      ? `
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid var(--accent);
    border-radius: 4px;
    padding: 4px 8px;
    color: #333;
  `
      : ""}
`;

const EmailButton = styled.a`
  display: inline-block;
  padding: 1.25rem 2.5rem;
  background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
  color: white;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 8px 25px rgba(108, 99, 255, 0.3);

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 15px 40px rgba(108, 99, 255, 0.4);
  }
`;

const DropZone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  padding: 4rem;
  border: 3px dashed #ccc;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  color: #666;
  font-size: 1rem;
  text-align: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(108, 99, 255, 0.2);
  }
`;

const ViewToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  backdrop-filter: blur(10px);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const SocialLink = styled.a`
  color: #6c63ff;
  text-decoration: none;
  margin: 0 0.75rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    color: var(--accent);
    transform: translateY(-1px);
  }
`;

const FooterLink = styled.a`
  color: #999;
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: #6c63ff;
  }
`;

interface EmailElement {
  id: string;
  type: string;
  content?: string;
  src?: string;
  alt?: string;
  url?: string;
  style?: React.CSSProperties;
  links?: Array<{ platform: string; url: string }>;
  height?: string;
  columns?: Array<{ content: string; width?: string }>;
  thumbnail?: string;
  title?: string;
}

interface TemplateData {
  name: string;
  subject: string;
  senderName: string;
  preheader: string;
  description: string;
  type: string;
  audience: string;
  content: string;
  emailElements: EmailElement[];
}

// Content elements for drag and drop
const contentElements = [
  { type: "header", icon: FaHeading, label: "Header" },
  { type: "text", icon: FaFont, label: "Text" },
  { type: "button", icon: FaMousePointer, label: "Button" },
  { type: "image", icon: FaImage, label: "Image" },
  { type: "divider", icon: FaDivide, label: "Divider" },
  { type: "social", icon: FaShareAlt, label: "Social" },
  { type: "spacer", icon: FaExpandArrowsAlt, label: "Spacer" },
  { type: "columns", icon: FaColumns, label: "Columns" },
  { type: "video", icon: FaVideo, label: "Video" },
];

function CreateTemplatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState("");
  const [currentView, setCurrentView] = useState<"desktop" | "mobile" | "text">(
    "desktop"
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  const [templateData, setTemplateData] = useState<TemplateData>({
    name: "",
    subject: "",
    senderName: "",
    preheader: "",
    description: "",
    type: "",
    audience: "",
    content: "",
    emailElements: [
      {
        id: "header_" + Date.now(),
        type: "header",
        content: "Your Template Header",
      },
      {
        id: "text_" + Date.now(),
        type: "text",
        content: "Add your template content here...",
      },
    ],
  });

  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    e.dataTransfer.setData("text/plain", elementType);
    e.dataTransfer.effectAllowed = "copy";

    if (dragPreviewRef.current) {
      dragPreviewRef.current.textContent = elementType;
      e.dataTransfer.setDragImage(dragPreviewRef.current, 0, 0);
    }
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOverIndex(index !== undefined ? index : null);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData("text/plain");

    if (elementType) {
      const newElement = createNewElement(elementType);
      const newElements = [...templateData.emailElements];

      if (index !== undefined) {
        newElements.splice(index, 0, newElement);
      } else {
        newElements.push(newElement);
      }

      setTemplateData({ ...templateData, emailElements: newElements });
    }

    setDragOverIndex(null);
  };

  const createNewElement = (type: string): EmailElement => {
    const id = `${type}_${Date.now()}`;

    switch (type) {
      case "header":
        return {
          id,
          type,
          content: "New Header",
          style: {
            fontSize: "32px",
            fontWeight: "bold",
            textAlign: "center" as const,
          },
        };
      case "text":
        return {
          id,
          type,
          content: "Add your text content here...",
          style: { fontSize: "16px", lineHeight: "1.6" },
        };
      case "button":
        return {
          id,
          type,
          content: "Click Here",
          url: "#",
          style: {
            backgroundColor: "#6c63ff",
            color: "white",
            padding: "12px 24px",
          },
        };
      case "image":
        return {
          id,
          type,
          src: "https://via.placeholder.com/600x300",
          alt: "Image",
          style: { width: "100%" },
        };
      case "divider":
        return {
          id,
          type,
          style: {
            height: "2px",
            backgroundColor: "#e0e0e0",
            margin: "20px 0",
          },
        };
      case "social":
        return {
          id,
          type,
          links: [
            { platform: "facebook", url: "#" },
            { platform: "twitter", url: "#" },
            { platform: "instagram", url: "#" },
          ],
        };
      case "spacer":
        return { id, type, height: "40px" };
      case "columns":
        return {
          id,
          type,
          columns: [
            { content: "Column 1 content", width: "50%" },
            { content: "Column 2 content", width: "50%" },
          ],
        };
      case "video":
        return {
          id,
          type,
          src: "",
          thumbnail: "https://via.placeholder.com/600x300",
          title: "Video Title",
        };
      default:
        return { id, type, content: "New Element" };
    }
  };

  const updateElement = (elementId: string, updates: Partial<EmailElement>) => {
    const newElements = templateData.emailElements.map((el) =>
      el.id === elementId ? { ...el, ...updates } : el
    );
    setTemplateData({ ...templateData, emailElements: newElements });
  };

  const selectElement = (elementId: string) => {
    setSelectedElement(elementId);
    setEditingElement(null);
  };

  const startEditing = (elementId: string) => {
    setEditingElement(elementId);
    setSelectedElement(elementId);
  };

  const stopEditing = () => {
    setEditingElement(null);
  };

  const handleElementDoubleClick = (elementId: string) => {
    if (editingElement !== elementId) {
      startEditing(elementId);
    }
  };

  const handleContentChange = (elementId: string, newContent: string) => {
    updateElement(elementId, { content: newContent });
  };

  const removeElement = (elementId: string) => {
    const newElements = templateData.emailElements.filter(
      (el) => el.id !== elementId
    );
    setTemplateData({ ...templateData, emailElements: newElements });
    if (selectedElement === elementId) setSelectedElement(null);
    if (editingElement === elementId) setEditingElement(null);
  };

  const renderEmailElement = (element: EmailElement, index: number) => {
    const isSelected = selectedElement === element.id;
    const isEditing = editingElement === element.id;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        stopEditing();
      } else if (e.key === "Escape") {
        stopEditing();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (!isEditing) {
          e.preventDefault();
          removeElement(element.id);
        }
      }
    };

    const handleBlur = () => {
      stopEditing();
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      const newContent = (e.target as HTMLDivElement).textContent || "";
      handleContentChange(element.id, newContent);
    };

    return (
      <React.Fragment key={element.id}>
        <DroppableArea
          isDragOver={dragOverIndex === index}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
        />

        <EmailElement
          selected={isSelected}
          editing={isEditing}
          onClick={() => selectElement(element.id)}
          onDoubleClick={() => handleElementDoubleClick(element.id)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {element.type === "header" && (
            <EditableText
              isEditing={isEditing}
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={handleBlur}
              onInput={handleInput}
              style={{
                fontSize: element.style?.fontSize || "32px",
                fontWeight: element.style?.fontWeight || "bold",
                textAlign: element.style?.textAlign || "center",
                color: element.style?.color || "#333",
                margin: "0",
                outline: "none",
              }}
            >
              {element.content}
            </EditableText>
          )}

          {element.type === "text" && (
            <EditableText
              isEditing={isEditing}
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onBlur={handleBlur}
              onInput={handleInput}
              style={{
                fontSize: element.style?.fontSize || "16px",
                lineHeight: element.style?.lineHeight || "1.6",
                color: element.style?.color || "#555",
                margin: "0",
                outline: "none",
              }}
            >
              {element.content}
            </EditableText>
          )}

          {element.type === "button" && (
            <div style={{ textAlign: "center", margin: "2rem 0" }}>
              <EmailButton
                style={{
                  backgroundColor: element.style?.backgroundColor || "#6c63ff",
                  color: element.style?.color || "white",
                  padding: element.style?.padding || "12px 24px",
                }}
              >
                {isEditing ? (
                  <EditableText
                    isEditing={true}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onBlur={handleBlur}
                    onInput={handleInput}
                    style={{
                      outline: "none",
                      background: "none",
                      border: "none",
                      color: "inherit",
                    }}
                  >
                    {element.content}
                  </EditableText>
                ) : (
                  element.content
                )}
              </EmailButton>
            </div>
          )}

          {element.type === "image" && (
            <div style={{ textAlign: "center", margin: "1.5rem 0" }}>
              <img
                src={element.src || "https://via.placeholder.com/600x300"}
                alt={element.alt || "Email Image"}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: "8px",
                  ...element.style,
                }}
              />
              {isEditing && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8rem",
                    color: "#666",
                  }}
                >
                  Double-click to edit image source
                </div>
              )}
            </div>
          )}

          {element.type === "divider" && (
            <div
              style={{
                height: element.style?.height || "2px",
                backgroundColor: element.style?.backgroundColor || "#e0e0e0",
                margin: element.style?.margin || "20px 0",
                border: "none",
                borderRadius: "1px",
              }}
            />
          )}

          {element.type === "social" && (
            <div style={{ textAlign: "center", margin: "2rem 0" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "1rem",
                }}
              >
                {element.links?.map((link, linkIndex: number) => (
                  <SocialLink key={linkIndex} href={link.url}>
                    {link.platform}
                  </SocialLink>
                ))}
              </div>
              {isEditing && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8rem",
                    color: "#666",
                  }}
                >
                  Click to edit social links
                </div>
              )}
            </div>
          )}

          {element.type === "spacer" && (
            <div
              style={{
                height: element.height || "40px",
                backgroundColor: isSelected
                  ? "rgba(108, 99, 255, 0.1)"
                  : "transparent",
                border: isSelected ? "1px dashed var(--primary)" : "none",
                borderRadius: "4px",
                position: "relative",
              }}
            >
              {isSelected && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "0.8rem",
                    color: "var(--primary)",
                    fontWeight: "600",
                  }}
                >
                  Spacer ({element.height || "40px"})
                </div>
              )}
            </div>
          )}

          {element.type === "columns" && (
            <div style={{ display: "flex", gap: "1rem", margin: "1.5rem 0" }}>
              {element.columns?.map((column, colIndex: number) => (
                <div
                  key={colIndex}
                  style={{
                    flex: column.width || "1",
                    padding: "1rem",
                    border: "1px solid #e0e0e0",
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                  }}
                >
                  {isEditing ? (
                    <EditableText
                      isEditing={true}
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onBlur={handleBlur}
                      onInput={(e) => {
                        const newColumns = [...element.columns!];
                        newColumns[colIndex] = {
                          ...newColumns[colIndex],
                          content:
                            (e.target as HTMLDivElement).textContent || "",
                        };
                        updateElement(element.id, { columns: newColumns });
                      }}
                    >
                      {column.content}
                    </EditableText>
                  ) : (
                    column.content
                  )}
                </div>
              ))}
            </div>
          )}

          {element.type === "video" && (
            <div style={{ textAlign: "center", margin: "2rem 0" }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                <img
                  src={
                    element.thumbnail || "https://via.placeholder.com/600x300"
                  }
                  alt={element.title || "Video Thumbnail"}
                  style={{ maxWidth: "100%", borderRadius: "8px" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "60px",
                    height: "60px",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "24px",
                  }}
                >
                  ▶
                </div>
              </div>
              {isEditing && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    fontSize: "0.8rem",
                    color: "#666",
                  }}
                >
                  Double-click to edit video settings
                </div>
              )}
            </div>
          )}

          {isSelected && !isEditing && (
            <button
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                background: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                cursor: "pointer",
                fontSize: "12px",
              }}
              onClick={(e) => {
                e.stopPropagation();
                removeElement(element.id);
              }}
            >
              ×
            </button>
          )}
        </EmailElement>
      </React.Fragment>
    );
  };

  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  const templateTypes = [
    { value: "welcome", label: "Welcome Email" },
    { value: "newsletter", label: "Newsletter" },
    { value: "promotional", label: "Promotional" },
    { value: "transactional", label: "Transactional" },
    { value: "announcement", label: "Announcement" },
    { value: "event", label: "Event" },
  ];

  const audienceOptions = [
    { value: "all", label: "All Subscribers" },
    { value: "new", label: "New Subscribers" },
    { value: "active", label: "Active Users" },
    { value: "customers", label: "Customers" },
    { value: "inactive", label: "Inactive Users" },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    setSavingMessage("Saving template...");

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("Saving template:", templateData);
      setSavingMessage("Template saved successfully!");

      setTimeout(() => {
        router.push("/admin/email-campaigns/templates");
      }, 1500);
    } catch (error) {
      console.error("Error saving template:", error);
      setSavingMessage("Error saving template. Please try again.");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSavingMessage(""), 3000);
    }
  };

  return (
    <>
      <NextSEO
        title="Create Template"
        description="Create a new email template"
      />

      <CreateContainer>
        <Breadcrumbs>
          <BreadcrumbLink href="/admin/email-campaigns">
            Email Campaigns
          </BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/templates">
            Templates
          </BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>Create Template</BreadcrumbCurrent>
        </Breadcrumbs>

        <Header>
          <Title>
            <FaFileAlt />
            Create New Template
          </Title>
          <Subtitle>
            Create a reusable email template with our visual editor
          </Subtitle>
        </Header>

        {/* Template Details Form */}
        <FormSection>
          <h3
            style={{
              color: "var(--text)",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FaInfoCircle style={{ color: "var(--primary)" }} />
            Template Details
          </h3>
          <FormGrid>
            <FormGroup>
              <Label>Template Name</Label>
              <Input
                type="text"
                value={templateData.name}
                onChange={(e) =>
                  setTemplateData({ ...templateData, name: e.target.value })
                }
                placeholder="Enter template name"
              />
            </FormGroup>
            <FormGroup>
              <Label>Template Type</Label>
              <Select
                value={templateData.type}
                onChange={(e) =>
                  setTemplateData({ ...templateData, type: e.target.value })
                }
              >
                <option value="">Choose template type...</option>
                {templateTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormGrid>
          <FormGrid>
            <FormGroup>
              <Label>Default Subject Line</Label>
              <Input
                type="text"
                value={templateData.subject}
                onChange={(e) =>
                  setTemplateData({ ...templateData, subject: e.target.value })
                }
                placeholder="Enter default subject line"
              />
            </FormGroup>
            <FormGroup>
              <Label>Default Sender Name</Label>
              <Input
                type="text"
                value={templateData.senderName}
                onChange={(e) =>
                  setTemplateData({
                    ...templateData,
                    senderName: e.target.value,
                  })
                }
                placeholder="e.g. Cymasphere Team"
              />
            </FormGroup>
          </FormGrid>
          <FormGrid>
            <FormGroup>
              <Label>Default Preheader Text</Label>
              <Input
                type="text"
                value={templateData.preheader}
                onChange={(e) =>
                  setTemplateData({
                    ...templateData,
                    preheader: e.target.value,
                  })
                }
                placeholder="Preview text that appears next to subject line"
              />
            </FormGroup>
            <FormGroup>
              <Label>Target Audience</Label>
              <Select
                value={templateData.audience}
                onChange={(e) =>
                  setTemplateData({ ...templateData, audience: e.target.value })
                }
              >
                <option value="">Choose target audience...</option>
                {audienceOptions.map((audience) => (
                  <option key={audience.value} value={audience.value}>
                    {audience.label}
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormGrid>
          <FormGroup>
            <Label>Description</Label>
            <TextArea
              value={templateData.description}
              onChange={(e) =>
                setTemplateData({
                  ...templateData,
                  description: e.target.value,
                })
              }
              placeholder="Describe what this template is for"
            />
          </FormGroup>
        </FormSection>

        {/* Visual Email Editor Section */}
        <FormSection>
          <h3
            style={{
              color: "var(--text)",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <FaEdit style={{ color: "var(--primary)" }} />
            Design Your Template
          </h3>

          {/* Content Elements Bar */}
          <ContentElementsBar>
            {contentElements.map((element) => {
              const IconComponent = element.icon;
              return (
                <ContentElementButton
                  key={element.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, element.type)}
                  onDragEnd={handleDragEnd}
                  title={`Drag to add ${element.label}`}
                >
                  <IconComponent className="icon" />
                  <span className="label">{element.label}</span>
                </ContentElementButton>
              );
            })}
          </ContentElementsBar>

          <ViewToggleContainer>
            <ViewToggle
              active={currentView === "desktop"}
              onClick={() => setCurrentView("desktop")}
            >
              <FaDesktop style={{ marginRight: "0.5rem" }} />
              Desktop
            </ViewToggle>
            <ViewToggle
              active={currentView === "mobile"}
              onClick={() => setCurrentView("mobile")}
            >
              <FaMobileAlt style={{ marginRight: "0.5rem" }} />
              Mobile
            </ViewToggle>
            <ViewToggle
              active={currentView === "text"}
              onClick={() => setCurrentView("text")}
            >
              <FaEnvelope style={{ marginRight: "0.5rem" }} />
              Text Only
            </ViewToggle>
          </ViewToggleContainer>

          <EmailCanvas>
            <EmailContainer
              style={{
                width:
                  currentView === "mobile"
                    ? "375px"
                    : currentView === "text"
                    ? "100%"
                    : "600px",
                maxWidth: currentView === "text" ? "500px" : "none",
                backgroundColor: currentView === "text" ? "#f8f9fa" : "white",
                transition: "all 0.3s ease",
              }}
            >
              {currentView === "text" ? (
                <div
                  style={{
                    padding: "2rem",
                    fontFamily: "monospace",
                    fontSize: "0.9rem",
                    lineHeight: "1.6",
                  }}
                >
                  <div
                    style={{
                      marginBottom: "1rem",
                      paddingBottom: "1rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    <strong>Template Name:</strong>{" "}
                    {templateData.name || "Untitled Template"}
                    <br />
                    <strong>Subject:</strong>{" "}
                    {templateData.subject || "Email Subject"}
                    <br />
                    <strong>Sender:</strong>{" "}
                    {templateData.senderName || "Sender Name"}
                    <br />
                    {templateData.preheader && (
                      <>
                        <strong>Preheader:</strong> {templateData.preheader}
                        <br />
                      </>
                    )}
                  </div>
                  {templateData.emailElements.map((element) => (
                    <div key={element.id} style={{ marginBottom: "1rem" }}>
                      {element.type === "header" && (
                        <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                          {element.content}
                        </div>
                      )}
                      {element.type === "text" && <div>{element.content}</div>}
                      {element.type === "button" && (
                        <div
                          style={{
                            padding: "0.5rem",
                            border: "1px solid #ddd",
                            display: "inline-block",
                          }}
                        >
                          [BUTTON: {element.content}]
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <EmailHeader style={{ padding: "1.5rem 2rem" }}>
                    <div
                      style={{
                        textAlign: "center",
                        color: "#666",
                        fontSize: "0.9rem",
                      }}
                    >
                      📧 Email Preview
                    </div>
                  </EmailHeader>

                  <EmailBody
                    onDragOver={(e) => handleDragOver(e)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e)}
                  >
                    <div
                      style={{
                        textAlign: "center",
                        marginBottom: "2rem",
                        paddingBottom: "1rem",
                        borderBottom: "1px solid #eee",
                      }}
                    >
                      <h2
                        style={{
                          color: "#333",
                          marginBottom: "0.5rem",
                          fontSize: "1.5rem",
                        }}
                      >
                        {templateData.subject || "Template Subject"}
                      </h2>
                      <p
                        style={{
                          color: "#666",
                          fontSize: "0.9rem",
                          margin: "0",
                        }}
                      >
                        From: {templateData.senderName || "Sender Name"}
                      </p>
                      {templateData.preheader && (
                        <p
                          style={{
                            color: "#999",
                            fontSize: "0.85rem",
                            fontStyle: "italic",
                            margin: "0.5rem 0 0 0",
                          }}
                        >
                          {templateData.preheader}
                        </p>
                      )}
                    </div>

                    {templateData.emailElements.length === 0 ? (
                      <DropZone
                        onDragOver={(e) => handleDragOver(e)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e)}
                      >
                        <div style={{ fontSize: "2rem", opacity: "0.5" }}>
                          📧
                        </div>
                        <div>
                          <strong>Drag content elements here</strong>
                        </div>
                        <div style={{ fontSize: "0.9rem", opacity: "0.8" }}>
                          Start building your template by dragging elements from
                          above
                        </div>
                      </DropZone>
                    ) : (
                      <>
                        {templateData.emailElements.map(renderEmailElement)}
                        <DroppableArea
                          isDragOver={
                            dragOverIndex === templateData.emailElements.length
                          }
                          onDragOver={(e) =>
                            handleDragOver(e, templateData.emailElements.length)
                          }
                          onDragLeave={handleDragLeave}
                          onDrop={(e) =>
                            handleDrop(e, templateData.emailElements.length)
                          }
                        />
                      </>
                    )}
                  </EmailBody>

                  <EmailFooter
                    style={{ padding: "1.5rem 2rem", textAlign: "center" }}
                  >
                    <div style={{ color: "#666", fontSize: "0.8rem" }}>
                      <FooterLink href="#">Unsubscribe</FooterLink> |
                      <FooterLink href="#" style={{ margin: "0 0.5rem" }}>
                        Privacy Policy
                      </FooterLink>{" "}
                      |<FooterLink href="#">Contact Us</FooterLink>
                    </div>
                    <div
                      style={{
                        marginTop: "0.5rem",
                        color: "#999",
                        fontSize: "0.75rem",
                      }}
                    >
                      © 2024 Your Company. All rights reserved.
                    </div>
                  </EmailFooter>
                </>
              )}
            </EmailContainer>
          </EmailCanvas>

          {/* Drag Preview Element */}
          <DragPreview ref={dragPreviewRef} />
        </FormSection>

        <NavigationButtons>
          <NavButton onClick={() => router.back()}>
            <FaArrowLeft />
            Cancel
          </NavButton>

          <NavButton variant="primary" onClick={handleSave} disabled={isSaving}>
            <FaSave />
            {isSaving ? "Saving..." : "Save Template"}
          </NavButton>
        </NavigationButtons>

        {/* Saving Feedback Message */}
        <AnimatePresence>
          {savingMessage && (
            <motion.div
              style={{
                position: "fixed",
                top: "20px",
                right: "20px",
                padding: "1rem 1.5rem",
                borderRadius: "8px",
                color: "white",
                fontWeight: "600",
                zIndex: 1000,
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.2)",
                backgroundColor: savingMessage.includes("Error")
                  ? "#dc3545"
                  : "#28a745",
              }}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
            >
              {savingMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </CreateContainer>
    </>
  );
}

export default CreateTemplatePage;
