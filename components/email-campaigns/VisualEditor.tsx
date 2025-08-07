"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { 
  FaFont, 
  FaMousePointer, 
  FaImage, 
  FaDivide, 
  FaShareAlt, 
  FaExpandArrowsAlt, 
  FaColumns, 
  FaVideo,
  FaDesktop,
  FaMobileAlt,
  FaEnvelope,
  FaTrash,
  FaEdit,
  FaTimes,
  FaCog,
  FaPaintBrush,
  FaTextHeight,
  FaCopy,
  FaGripVertical,
  FaBold,
  FaItalic,
  FaUnderline,
  FaLink,
  FaPalette,
  FaUpload,
  FaCloudUploadAlt,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,

  FaYoutube,
  FaFacebookF,
  FaInstagram,
  FaDiscord,
  FaEye,
  FaCode,
  FaSave
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

// Styled components for the visual editor

const ViewToggle = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 25px;
  background: ${props => props.active 
    ? 'linear-gradient(135deg, var(--primary), var(--accent))' 
    : 'rgba(255, 255, 255, 0.08)'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
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
    background: ${props => props.active 
      ? 'linear-gradient(135deg, var(--accent), var(--primary))' 
      : 'rgba(255, 255, 255, 0.15)'};
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(108, 99, 255, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ViewToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  backdrop-filter: blur(10px);
  border-radius: 50px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const EmailCanvas = styled.div`
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 0.75rem;
  overflow: visible;
  display: flex;
  justify-content: flex-start;
  min-height: 600px;
  position: relative;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="%23ffffff" fill-opacity="0.05"><circle cx="30" cy="30" r="1"/></g></svg>');
    border-radius: 16px;
    pointer-events: none;
  }
`;

const EmailContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 20px rgba(0, 0, 0, 0.1);
  overflow: visible;
  position: relative;
  z-index: 1;
  transition: box-shadow 0.3s ease;
  width: 100%;
  max-width: none;
`;

const EmailHeader = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-bottom: 1px solid #dee2e6;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(108, 99, 255, 0.3), transparent);
  }
`;

const EmailBody = styled.div`
  padding: 3rem 2.5rem;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
  overflow: visible;
  position: relative;
`;

const EmailFooter = styled.div`
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-top: 1px solid #dee2e6;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(108, 99, 255, 0.3), transparent);
  }
`;

const EmailElement = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'editing' && prop !== 'fullWidth',
})<{ selected: boolean; editing: boolean; fullWidth?: boolean }>`
  margin: ${props => props.fullWidth ? '0 -2.5rem 12px -2.5rem' : '0 auto 12px auto'};
  padding: ${props => props.fullWidth ? '0' : '8px'};
  max-width: ${props => props.fullWidth ? 'none' : 'none'};
  border: 2px solid ${props => props.selected ? 'var(--primary)' : 'transparent'};
  border-radius: ${props => props.fullWidth ? '0' : '12px'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: grab;
  overflow: visible;
  background: ${props => 
    props.editing ? 'rgba(108, 99, 255, 0.1)' :
    props.selected ? 'rgba(108, 99, 255, 0.05)' : 
    props.fullWidth ? 'rgba(108, 99, 255, 0.03)' : 'transparent'
  };
  
  ${props => props.fullWidth && `
    box-shadow: inset 2px 0 0 rgba(108, 99, 255, 0.3), inset -2px 0 0 rgba(108, 99, 255, 0.3);
  `}

  &:hover {
    border-color: ${props => props.selected ? 'var(--primary)' : 'rgba(108, 99, 255, 0.5)'};
    background: ${props => 
      props.editing ? 'rgba(108, 99, 255, 0.15)' :
      props.selected ? 'rgba(108, 99, 255, 0.08)' : 
      'rgba(108, 99, 255, 0.03)'
    };
    
    .drag-handle {
      opacity: 1 !important;
      transform: translateY(-50%) scale(1.05);
    }
  }

  &:active {
    cursor: grabbing;
  }

  &[draggable="true"] {
    cursor: grab;
  }

  &[draggable="true"]:active {
    cursor: grabbing;
  }
  
  .drag-handle {
    opacity: 0.8;
  }

  .element-controls {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.5rem;
    opacity: 1;
    transition: opacity 0.3s ease;
    z-index: 10;
    pointer-events: auto;
  }

  &:hover .element-controls {
    opacity: 1;
  }
`;

const ElementControl = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);

  &:hover {
    background: var(--primary);
    color: white;
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
  }
`;

// Drag handle for element reordering
const DragHandle = styled.div.withConfig({
  shouldForwardProp: (prop) => true,
})`
  position: absolute;
  left: 4px;
  top: 4px;
  width: 20px;
  height: 20px;
  background: rgba(108, 99, 255, 0.9);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  color: white;
  user-select: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  pointer-events: auto;
  
  &:hover {
    opacity: 1 !important;
    background: var(--primary);
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
    cursor: grab;
  }
  
  &:active {
    transform: scale(0.95);
    cursor: grabbing;
  }
  
  &[draggable="true"] {
    cursor: grab;
  }
  
  &[draggable="true"]:active {
    cursor: grabbing;
  }
`;

// ✨ NEW: Rich text formatting toolbar
const FormattingToolbar = styled.div`
  position: absolute;
  top: -50px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.9);
  border-radius: 8px;
  padding: 0.5rem;
  display: flex;
  gap: 0.25rem;
  z-index: 30;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &.show {
    opacity: 1;
    visibility: visible;
  }
`;

const FormatButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  &.active {
    background: var(--primary);
  }
`;

// ✨ NEW: Image upload area
const ImageUploadArea = styled.div`
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--primary);
    background: rgba(108, 99, 255, 0.05);
  }
  
  &.dragover {
    border-color: var(--primary);
    background: rgba(108, 99, 255, 0.1);
  }
`;

const FileInput = styled.input`
  display: none;
`;

// ✨ NEW: Spinning animation for upload indicators
const SpinKeyframes = styled.div`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const EditableText = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'editing',
})<{ editing: boolean }>`
  outline: ${props => props.editing ? '2px solid var(--primary)' : 'none'};
  border-radius: 4px;
  padding: ${props => props.editing ? '0.5rem' : '0.25rem'};
  background: ${props => props.editing ? 'rgba(108, 99, 255, 0.1)' : 'transparent'};
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.editing ? 'rgba(108, 99, 255, 0.1)' : 'rgba(108, 99, 255, 0.05)'};
  }

  &:focus {
    outline: 2px solid var(--primary) !important;
    background: rgba(108, 99, 255, 0.1) !important;
  }
  
  &:focus-within {
    outline: 2px solid var(--primary) !important;
    background: rgba(108, 99, 255, 0.1) !important;
  }
`;

// Sidebar styled components
const SidebarPanel = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    border-color: rgba(255, 255, 255, 0.15);
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const PanelIcon = styled.div`
  font-size: 1.2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  color: var(--primary);
`;

const PanelTitle = styled.h4`
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin: 0;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ControlLabel = styled.label`
  color: var(--text);
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const ColorInput = styled.input`
  width: 100%;
  height: 48px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--primary);
    transform: scale(1.02);
  }
`;

const ControlSelect = styled.select`
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  option {
    background-color: var(--card-bg);
    color: var(--text);
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const VariableTag = styled.div`
  padding: 0.75rem 1rem;
  border: 2px solid transparent;
  border-radius: 25px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-family: 'Courier New', monospace;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    border-color: var(--primary);
    background: linear-gradient(135deg, rgba(108, 99, 255, 0.2) 0%, rgba(108, 99, 255, 0.1) 100%);
    color: var(--primary);
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(108, 99, 255, 0.2);
  }
`;

// Modal components
const ModalOverlay = styled.div`
  position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  min-width: 300px;
  max-width: 400px;
  width: 90%;
`;

const ModalTitle = styled.h3`
  margin: 0 0 1.5rem 0;
  color: var(--text);
  font-size: 1.25rem;
  font-weight: 600;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 1rem;
  margin-bottom: 1.5rem;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
  }
`;

const ColorPickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ColorInputModal = styled.input`
  width: 100%;
  height: 80px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  cursor: pointer;
  background: transparent;
  
  &::-webkit-color-swatch-wrapper {
    padding: 4px;
    border-radius: 8px;
  }
  
  &::-webkit-color-swatch {
    border: none;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }
  
  &::-moz-color-swatch {
    border: none;
    border-radius: 8px;
  }

  &:hover {
    border-color: var(--primary);
    transform: scale(1.02);
  }
`;

const ColorPresets = styled.div`
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 0.5rem;
`;

const ColorPreset = styled.button`
  width: 32px;
  height: 32px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    border-color: var(--primary);
  }
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.$variant === 'primary' ? `
    background: var(--primary);
    color: white;
    
    &:hover {
      background: var(--accent);
      transform: translateY(-1px);
    }
  ` : `
    background: rgba(255, 255, 255, 0.1);
    color: var(--text);

    &:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `}
`;

const ElementBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  cursor: grab;
  transition: all 0.3s ease;
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  text-align: center;
  user-select: none;

  &:hover {
    background: rgba(108, 99, 255, 0.1);
    border-color: rgba(108, 99, 255, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.2);
    color: var(--primary);
  }

  &:active {
    transform: translateY(0);
    cursor: grabbing;
  }

  &[draggable="true"]:hover {
    cursor: grab;
  }

  &[draggable="true"]:active {
    cursor: grabbing;
    opacity: 0.7;
    transform: scale(0.95);
  }
`;

// ✨ NEW: Padding control components
const PaddingControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const PaddingLabel = styled.label`
  color: var(--text);
  font-size: 0.8rem;
  font-weight: 600;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const PaddingSlider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  opacity: 0.8;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 1;
  }
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(108, 99, 255, 0.3);
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.2);
      box-shadow: 0 4px 12px rgba(108, 99, 255, 0.5);
    }
  }
  
  &::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(108, 99, 255, 0.3);
  }
`;

const PaddingValue = styled.span`
  color: var(--primary);
  font-weight: 700;
  font-size: 0.75rem;
`;

const UrlInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: var(--text);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: var(--text-secondary);
    opacity: 0.7;
  }

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(108, 99, 255, 0.1);
    background: rgba(255, 255, 255, 0.15);
  }
`;

interface VisualEditorProps {
  emailElements: any[];
  setEmailElements: (elements: any[]) => void;
  campaignData: {
    senderName: string;
    subject: string;
    preheader?: string;
  };
  rightPanelExpanded?: boolean;
}

export default function VisualEditor({ 
  emailElements, 
  setEmailElements, 
  campaignData, 
  rightPanelExpanded = true 
}: VisualEditorProps) {
  // Client-side check to prevent SSR issues
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until we're on the client side
  if (!isClient) {
    return <div>Loading editor...</div>;
  }
  const [currentView, setCurrentView] = useState<'desktop' | 'mobile' | 'text'>('desktop');
  
  // Element reordering state
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [draggedElementIndex, setDraggedElementIndex] = useState<number | null>(null);
  const [elementDragOverIndex, setElementDragOverIndex] = useState<number | null>(null);
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [rightPanelState, setRightPanelState] = useState(rightPanelExpanded);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  // ✨ NEW: Design settings state
  const [designSettings, setDesignSettings] = useState({
    backgroundColor: '#ffffff',
    contentWidth: '1200px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    primaryColor: '#6c63ff',
    textColor: '#333333'
  });

  // ✨ NEW: Rich text formatting state
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [showRawHtmlElements, setShowRawHtmlElements] = useState<Record<string, boolean>>({}); // Toggle between raw HTML and rendered HTML per element
  
  // ✨ NEW: Image upload state
  const [imageUploadElement, setImageUploadElement] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Link and color picker modals
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [colorPickerType, setColorPickerType] = useState<'text' | 'background'>('text');
  const [savedSelection, setSavedSelection] = useState<Range | null>(null);
  const [selectionInfo, setSelectionInfo] = useState<{
    startOffset: number;
    endOffset: number;
    selectedText: string;
    elementId: string;
  } | null>(null);

  // ✨ NEW: Update design setting
  const updateDesignSetting = (key: string, value: string) => {
    setDesignSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✨ NEW: Modern rich text formatting functions
  const applyFormat = (command: string, value?: string) => {
    console.log(`🎨 Applying format: ${command}${value ? ` with value: ${value}` : ''}`);
    
    if (!editingElement || typeof window === 'undefined') {
      console.warn('❌ No editing element found or not on client side');
      return;
    }

    try {
      // Find the currently editing element
      const editingElementDOM = typeof document !== 'undefined' 
        ? document.querySelector(`[data-element-id="${editingElement}"]`) as HTMLElement
        : null;
      if (!editingElementDOM) {
        console.warn('❌ Could not find editing element in DOM');
        return;
      }
      
      console.log(`🎯 Found editing element:`, editingElementDOM);
      
      // Make sure the element is focused before applying formatting
      editingElementDOM.focus();
      
      // Handle different commands
      switch (command) {
        case 'bold':
        case 'italic':
        case 'underline':
          if (typeof document !== 'undefined') {
            document.execCommand(command, false);
          }
          break;
        case 'createLink':
          if (value && typeof document !== 'undefined') {
            document.execCommand(command, false, value);
          }
          break;
        case 'foreColor':
        case 'backColor':
          if (value && typeof document !== 'undefined') {
            document.execCommand(command, false, value);
          }
          break;
        case 'justifyLeft':
        case 'justifyCenter':
        case 'justifyRight':
          const align = command.replace('justify', '').toLowerCase();
          // For alignment, we'll update the element's textAlign style
          updateElement(editingElement, { textAlign: align });
          return;
        default:
          if (typeof document !== 'undefined') {
            document.execCommand(command, false, value);
          }
      }
      
      // No need to update state - content will be saved when editing stops
      console.log(`📄 Formatting applied to element:`, editingElement);
    } catch (error) {
      console.error('❌ Error applying format:', error);
    }
  };

  const handleTextSelect = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't update toolbar state during editing to avoid re-renders
    // Toolbar is always visible when editing anyway
  };



  // Link and color picker handlers
  const openLinkModal = () => {
    // Only work if we're editing an element and on client side
    if (!editingElement || typeof window === 'undefined') {
      return;
    }
    
    // Get the editing element
    const editingElementDOM = typeof document !== 'undefined' 
      ? document.querySelector(`[data-element-id="${editingElement}"]`) as HTMLElement
      : null;
    if (!editingElementDOM) return;
    
    // Save the current selection with text-based positioning
    const selection = typeof window !== 'undefined' ? window.getSelection() : null;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      
      // Get the full text content of the element
      const fullText = editingElementDOM.textContent || '';
      
      // Find the position of the selected text within the full text
      const selectionStart = fullText.indexOf(selectedText);
      const selectionEnd = selectionStart + selectedText.length;
      
      console.log('💾 Saving selection info:', {
        selectedText,
        fullText,
        selectionStart,
        selectionEnd,
        elementId: editingElement
      });
      
      setSelectionInfo({
        startOffset: selectionStart,
        endOffset: selectionEnd,
        selectedText,
        elementId: editingElement
      });
      
      setLinkText(selectedText);
    } else {
      setSelectionInfo(null);
      setLinkText('');
      console.log('❌ No selection to save for link');
    }
    
    setLinkUrl('');
    setShowLinkModal(true);
  };

  const closeLinkModal = () => {
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    setSavedSelection(null);
    setSelectionInfo(null);
  };

  const applyLink = () => {
    console.log('🔗 Applying link:', { linkUrl, linkText, editingElement, selectionInfo, selectedElementId });
    
    // Check if this is for a button element (when not editing but selected)
    if (!editingElement && selectedElementId) {
      const selectedElement = emailElements.find(el => el.id === selectedElementId);
      if (selectedElement?.type === 'button') {
        if (!linkUrl.trim()) {
          console.log('❌ Missing URL for button');
          return;
        }
        // Update button URL directly
        updateElement(selectedElementId, { url: linkUrl.trim() });
        console.log('✅ Button URL updated');
        closeLinkModal();
        return;
      }
    }
    
    if (!linkUrl.trim() || !linkText.trim()) {
      console.log('❌ Missing URL or text');
      return;
    }

    if (!editingElement) {
      console.log('❌ No editing element');
      closeLinkModal();
      return;
    }

    // Get the editing element
    const editingElementDOM = typeof document !== 'undefined' 
      ? document.querySelector(`[data-element-id="${editingElement}"]`) as HTMLElement
      : null;
    console.log('📝 Found editing element:', editingElementDOM);
    
    if (editingElementDOM) {
      if (selectionInfo && selectionInfo.selectedText) {
        console.log('📝 Current HTML content:', editingElementDOM.innerHTML);
        console.log('🎯 Target selection:', selectionInfo);
        
        // Use a more sophisticated approach that preserves HTML structure
        const currentHtml = editingElementDOM.innerHTML;
        const selectedText = selectionInfo.selectedText;
        
        // Create the link HTML - use the text from the modal (allows user to change the text)
        const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer">${linkText.trim()}</a>`;
        
        // Find and replace the selected text in the HTML, being careful to preserve other HTML tags
        let newHtml = currentHtml;
        
        // Try to find the exact text match in the HTML
        const textIndex = currentHtml.indexOf(selectedText);
        if (textIndex !== -1) {
          // Simple case: the selected text appears as plain text in the HTML
          newHtml = currentHtml.substring(0, textIndex) + linkHtml + currentHtml.substring(textIndex + selectedText.length);
          console.log('✅ Found plain text match, replacing directly');
        } else {
          // Fallback: append link to the end
          newHtml = currentHtml + ' ' + linkHtml;
          console.log('✅ Fallback: appended link to end');
        }
        
        console.log('🔄 New HTML content:', newHtml);
        editingElementDOM.innerHTML = newHtml;
        console.log('✅ Link applied while preserving HTML structure');
      } else {
        // No selection info, append link to the end
        const displayText = linkText?.trim() || 'Click here';
        const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer">${displayText}</a>`;
        editingElementDOM.innerHTML += ' ' + linkHtml;
        console.log('✅ Link appended to element (no selection)');
      }
      
      console.log('✅ Link applied to DOM (will save on Save button click)');
      console.log('🔍 Current DOM content after link:', editingElementDOM.innerHTML);
    }
    
    closeLinkModal();
  };

  const openColorPicker = (type: 'text' | 'background') => {
    // Only work if we're editing an element
    if (!editingElement) {
      return;
    }
    
    // Get the editing element
    const editingElementDOM = typeof document !== 'undefined' 
      ? document.querySelector(`[data-element-id="${editingElement}"]`) as HTMLElement
      : null;
    if (!editingElementDOM) return;
    
    // Save the current selection with text-based positioning
    const selection = typeof window !== 'undefined' ? window.getSelection() : null;
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();
      
      // Get the full text content of the element
      const fullText = editingElementDOM.textContent || '';
      
      // Find the position of the selected text within the full text
      const selectionStart = fullText.indexOf(selectedText);
      const selectionEnd = selectionStart + selectedText.length;
      
      console.log('💾 Saving color selection info:', {
        selectedText,
        fullText,
        selectionStart,
        selectionEnd,
        elementId: editingElement,
        type
      });
      
      setSelectionInfo({
        startOffset: selectionStart,
        endOffset: selectionEnd,
        selectedText,
        elementId: editingElement
      });
    } else {
      setSelectionInfo(null);
      console.log('❌ No selection to save for color');
    }
    
    setColorPickerType(type);
    setSelectedColor('#000000');
    setShowColorPicker(true);
  };

  const closeColorPicker = () => {
    setShowColorPicker(false);
    setSelectedColor('#000000');
    setSavedSelection(null);
    setSelectionInfo(null);
  };

  const applyColor = () => {
    console.log('🎨 Applying color:', { selectedColor, colorPickerType, editingElement });
    
    if (!selectedColor || !editingElement) {
      console.log('❌ Missing color or editing element');
      closeColorPicker();
      return;
    }

    // Get the editing element
    const editingElementDOM = typeof document !== 'undefined' 
      ? document.querySelector(`[data-element-id="${editingElement}"]`) as HTMLElement
      : null;
    console.log('📝 Found editing element:', editingElementDOM);
    
    if (editingElementDOM) {
      // Focus the element to ensure selection works
      editingElementDOM.focus();
      
      const selection = typeof window !== 'undefined' ? window.getSelection() : null;
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        
        console.log('🎯 Current selection:', selectedText);
        
        if (selectedText.length > 0) {
          // Apply color to selected text only
          if (typeof document !== 'undefined') {
            const span = document.createElement('span');
            const styleProperty = colorPickerType === 'text' ? 'color' : 'background-color';
            span.style.setProperty(styleProperty, selectedColor);
            
            try {
              // Extract the selected content and wrap it in the styled span
              const contents = range.extractContents();
              span.appendChild(contents);
              range.insertNode(span);
              
              // Clear the selection
              selection.removeAllRanges();
              
              console.log('✅ Color applied to selected text only');
              console.log('🔍 DOM after color application:', editingElementDOM.innerHTML);
            } catch (error) {
              console.error('❌ Error applying color to selection:', error);
              // Fallback: apply to entire element
              const currentText = editingElementDOM.textContent || '';
              const styledContent = `<span style="${styleProperty}: ${selectedColor};">${currentText}</span>`;
              editingElementDOM.innerHTML = styledContent;
              console.log('✅ Fallback: Color applied to entire element');
            }
          }
        } else {
          // No text selected, apply to entire element
          const currentText = editingElementDOM.textContent || '';
          const styleProperty = colorPickerType === 'text' ? 'color' : 'background-color';
          const styledContent = `<span style="${styleProperty}: ${selectedColor};">${currentText}</span>`;
          editingElementDOM.innerHTML = styledContent;
          console.log('✅ Color applied to entire element (no selection)');
        }
      } else {
        // No selection, apply to entire element
        const currentText = editingElementDOM.textContent || '';
        const styleProperty = colorPickerType === 'text' ? 'color' : 'background-color';
        const styledContent = `<span style="${styleProperty}: ${selectedColor};">${currentText}</span>`;
        editingElementDOM.innerHTML = styledContent;
        console.log('✅ Color applied to entire element (no selection API)');
      }
      
      console.log('✅ Color applied to DOM (will save on Save button click)');
    }
    
    closeColorPicker();
  };

  const colorPresets = [
    // Grayscale
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    // Primary colors
    '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    // Dark colors
    '#800000', '#008000', '#000080', '#808000', '#800080', '#008080',
    // Bright colors
    '#FFA500', '#FFC0CB', '#A52A2A', '#90EE90', '#87CEEB', '#DDA0DD',
    // Professional colors
    '#2E86AB', '#A23B72', '#F18F01', '#C73E1D', '#6A994E', '#582F0E',
    // Modern colors
    '#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51', '#E63946'
  ];

  // ✨ NEW: Image upload functions
  const uploadImageToSupabase = async (file: File, elementId: string) => {
    try {
      setImageUploading(elementId);
      setUploadError(null);
      
      console.log('📤 Uploading image to Supabase storage:', file.name);
      
      // Create form data
      const formData = new FormData();
      formData.append('image', file);
      
      // Upload to API endpoint
      const response = await fetch('/api/email-campaigns/upload-image', {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Image uploaded successfully:', result.data.publicUrl);
        
        // Update element with public URL
        updateElement(elementId, { 
          src: result.data.publicUrl,
          alt: file.name
        });
        
        setUploadError(null);
      } else {
        console.error('❌ Image upload failed:', result.error);
        setUploadError(result.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      setUploadError('Network error occurred while uploading image');
    } finally {
      setImageUploading(null);
    }
  };

  const handleImageUpload = (elementId: string) => {
    setImageUploadElement(elementId);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && imageUploadElement) {
      await uploadImageToSupabase(file, imageUploadElement);
        setImageUploadElement(null);
    }
  };

  const handleImageDrop = async (e: React.DragEvent, elementId: string) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await uploadImageToSupabase(file, elementId);
      }
    }
  };

  // Element reordering drag handlers
  const handleElementDragOver = (e: React.DragEvent, index: number) => {
    if (typeof window === 'undefined') return;
    
    e.preventDefault();
    
    // Check if we're dragging a new element from the palette
    const elementType = e.dataTransfer.getData('text/element-type');
    if (elementType) {
      e.dataTransfer.dropEffect = 'copy';
      setElementDragOverIndex(index);
      return;
    }
    
    // Handle reordering existing elements
    e.dataTransfer.dropEffect = 'move';
    if (draggedElementId) {
      setElementDragOverIndex(index);
    }
  };

  const handleElementDrop = (e: React.DragEvent, dropIndex: number) => {
    if (typeof window === 'undefined') return;
    
    e.preventDefault();
    console.log('💧 Drop attempted at index:', dropIndex);
    
    // Check if we're dropping a new element from the palette
    const elementType = e.dataTransfer.getData('text/element-type');
    if (elementType) {
      console.log('🆕 Creating new element:', elementType, 'at index:', dropIndex);
      const newElement = createNewElement(elementType);
      const newElements = [...emailElements];
      newElements.splice(dropIndex, 0, newElement);
      setEmailElements(newElements);
      console.log('🎉 New element added successfully!');
      setElementDragOverIndex(null);
      return;
    }
    
    // Otherwise, handle reordering existing elements
    const elementId = e.dataTransfer.getData('text/element-id');
    const dragIndex = parseInt(e.dataTransfer.getData('text/element-index'));
    console.log('📦 Dropped element ID:', elementId, 'from index:', dragIndex);
    
    if (elementId && !isNaN(dragIndex) && dragIndex !== dropIndex) {
      console.log('✅ Valid drop: moving from', dragIndex, 'to', dropIndex);
      const newElements = [...emailElements];
      const draggedElement = newElements[dragIndex];
      
      // Remove from old position
      newElements.splice(dragIndex, 1);
      
      // Calculate new position (adjust if dropping after original position)
      const adjustedDropIndex = dropIndex > dragIndex ? dropIndex - 1 : dropIndex;
      console.log('🎯 Adjusted drop index:', adjustedDropIndex);
      
      // Insert at new position
      newElements.splice(adjustedDropIndex, 0, draggedElement);
      
      setEmailElements(newElements);
      console.log('🎉 Elements reordered successfully!');
    } else {
      console.log('❌ Invalid drop:', { elementId, dragIndex, dropIndex });
    }
    
    setDraggedElementId(null);
    setDraggedElementIndex(null);
    setElementDragOverIndex(null);
  };

  const createNewElement = (type: string) => {
    const id = type + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // ✨ NEW: Base element with padding, width, and formatting properties
    const baseElement = {
      id,
      type,
      paddingTop: 16,    // Default 16px top padding
      paddingBottom: 16, // Default 16px bottom padding
      fullWidth: false,  // Default to constrained width with margins
      // Rich text formatting properties
      fontSize: '16px',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'left'
    };
    
    switch (type) {
      case 'header':
        return { 
          ...baseElement, 
          content: 'Your Header Text Here', 
          fullWidth: true,
          fontSize: '32px',
          fontWeight: 'bold',
          textAlign: 'center'
        };
      case 'text':
        return { 
          ...baseElement, 
          content: 'Add your text content here. You can edit this by double-clicking.',
          fontSize: '16px',
          textAlign: 'left'
        };
      case 'button':
        return { 
          ...baseElement, 
          content: 'Click Here', 
          url: '#',
          fontSize: '16px',
          fontWeight: 'bold',
          textAlign: 'center'
        };
      case 'image':
        return { ...baseElement, src: 'https://via.placeholder.com/600x300/6c63ff/ffffff?text=Your+Image', alt: 'Image description' };
      case 'divider':
        return { ...baseElement };
      case 'social':
        return { ...baseElement, links: [
          { platform: 'facebook', url: '#' },
          { platform: 'twitter', url: '#' },
          { platform: 'instagram', url: '#' },
          { platform: 'youtube', url: '#' },
          { platform: 'discord', url: '#' }
        ]};
      case 'spacer':
        return { ...baseElement, height: '30px' };
      case 'columns':
        return { ...baseElement, columns: [
          { content: 'Column 1 content' },
          { content: 'Column 2 content' }
        ]};
      case 'video':
        return { ...baseElement, thumbnail: 'https://via.placeholder.com/600x300/6c63ff/ffffff?text=Video+Placeholder', url: '#' };
      case 'footer':
        return { 
          ...baseElement, 
          fullWidth: true,
          socialLinks: [
            { platform: 'facebook', url: 'https://facebook.com/cymasphere' },
            { platform: 'twitter', url: 'https://twitter.com/cymasphere' },
            { platform: 'instagram', url: 'https://instagram.com/cymasphere' },
            { platform: 'youtube', url: 'https://youtube.com/cymasphere' },
            { platform: 'discord', url: 'https://discord.gg/cymasphere' }
          ],
          footerText: '© 2024 Cymasphere Inc. All rights reserved.',
          unsubscribeText: 'Unsubscribe',
          unsubscribeUrl: '#unsubscribe',
          privacyText: 'Privacy Policy',
          privacyUrl: '#privacy',
          contactText: 'Contact Us',
          contactUrl: '#contact'
        };
      
      case 'brand-header':
        return { 
          ...baseElement, 
          fullWidth: true,
          content: 'CYMASPHERE',
          backgroundColor: 'linear-gradient(135deg, #1a1a1a 0%, #121212 100%)',
          textColor: '#ffffff',
          logoStyle: 'gradient' // 'solid', 'gradient', 'outline'
        };
      default:
        return { ...baseElement, content: 'New element' };
    }
  };

  const removeElement = (elementId: string) => {
    const updatedElements = emailElements.filter(el => el.id !== elementId);
    setEmailElements(updatedElements);
    if (selectedElementId === elementId) {
      setSelectedElementId(null);
    }
  };

  const duplicateElement = (elementId: string) => {
    const elementToDuplicate = emailElements.find(el => el.id === elementId);
    if (elementToDuplicate) {
      const newElement = {
        ...elementToDuplicate,
        id: `${elementToDuplicate.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content: elementToDuplicate.content + ' (Copy)'
      };
      const index = emailElements.findIndex(el => el.id === elementId);
      const updatedElements = [...emailElements];
      updatedElements.splice(index + 1, 0, newElement);
      setEmailElements(updatedElements);
      setSelectedElementId(newElement.id);
    }
  };

  // ✨ NEW: Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Delete key - remove selected element
    if (e.key === 'Delete' && selectedElementId && editingElement !== selectedElementId) {
      e.preventDefault();
      removeElement(selectedElementId);
    }
    
    // Ctrl+D / Cmd+D - duplicate selected element
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementId) {
      e.preventDefault();
      duplicateElement(selectedElementId);
    }
    
    // Escape key - deselect element and stop editing
    if (e.key === 'Escape') {
      e.preventDefault();
    setSelectedElementId(null);
      setEditingElement(null);
    }
  }, [selectedElementId, editingElement]);

  // ✨ NEW: Add keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const selectElement = (elementId: string) => {
    setSelectedElementId(elementId);
    // DON'T clear editing state when selecting - only clear when explicitly stopping edit
    // setEditingElement(null);
    setUploadError(null); // Clear any upload errors when selecting different element
  };

  const startEditing = (elementId: string) => {
    console.log('🎯 START EDITING called for element:', elementId);
    console.log('🎯 Current editingElement state:', editingElement);
    setEditingElement(elementId);
    console.log('🎯 Called setEditingElement with:', elementId);
    
    // Set the DOM content when editing starts (since we're not using dangerouslySetInnerHTML in edit mode)
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        const element = emailElements.find(el => el.id === elementId);
        const domElement = document.querySelector(`[data-element-id="${elementId}"]`) as HTMLElement;
        if (domElement && element) {
          domElement.innerHTML = element.content || (element.type === 'header' ? 'Enter header text...' : 'Enter your text...');
          domElement.focus();
          console.log('🎯 Set DOM content for editing:', domElement.innerHTML);
        }
      }
    }, 0);
  };

  const saveAndStopEditing = () => {
    console.log('💾 SAVE AND STOP EDITING called');
    
    // Save the current content before stopping editing
    if (editingElement) {
      const editingElementDOM = typeof document !== 'undefined' 
        ? document.querySelector(`[data-element-id="${editingElement}"]`) as HTMLElement
        : null;
      if (editingElementDOM) {
        const currentContent = editingElementDOM.innerHTML;
        const previousContent = emailElements.find(el => el.id === editingElement)?.content;
        
        console.log('💾 SAVING CONTENT:');
        console.log('💾 Previous:', previousContent);
        console.log('💾 Current:', currentContent);
        console.log('💾 Has colors?', currentContent.includes('color:') || currentContent.includes('style='));
        console.log('💾 Has spans?', currentContent.includes('<span'));
        console.log('💾 Has links?', currentContent.includes('<a'));
        
        setEmailElements(emailElements.map(el => 
          el.id === editingElement ? { ...el, content: currentContent } : el
        ));
        
        console.log('✅ Content saved successfully');
      } else {
        console.error('❌ Could not find editing element DOM');
      }
    } else {
      console.error('❌ No editing element to save');
    }
    
    setEditingElement(null);
  };

  const cancelEditing = () => {
    console.log('❌ CANCEL EDITING called');
    
    // Restore original content without saving changes
    if (editingElement) {
      const editingElementDOM = typeof document !== 'undefined' 
        ? document.querySelector(`[data-element-id="${editingElement}"]`) as HTMLElement
        : null;
      const originalElement = emailElements.find(el => el.id === editingElement);
      
      if (editingElementDOM && originalElement) {
        // Restore the original content to the DOM
        editingElementDOM.innerHTML = originalElement.content || '';
      }
    }
    
    setEditingElement(null);
  };

  const isElementEditing = (elementId: string) => {
    return editingElement === elementId;
  };

  const handleElementDoubleClick = (elementId: string) => {
    startEditing(elementId);
  };

  // ✨ FIXED: Cursor position preservation for contentEditable
  const saveCursorPosition = (element: HTMLElement) => {
    if (typeof window === 'undefined') return null;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;
    
    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(element);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    
    return preCaretRange.toString().length;
  };
  
  const restoreCursorPosition = (element: HTMLElement, cursorPosition: number) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    
    const selection = window.getSelection();
    if (!selection) return;
    
    let charCount = 0;
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      const textLength = node.textContent?.length || 0;
      if (charCount + textLength >= cursorPosition) {
        const range = document.createRange();
        range.setStart(node, cursorPosition - charCount);
        range.setEnd(node, cursorPosition - charCount);
        selection.removeAllRanges();
        selection.addRange(range);
        return;
      }
      charCount += textLength;
    }
    
    // If we can't find the exact position, place cursor at the end
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  const handleContentChange = (elementId: string, newContent: string, elementRef?: HTMLElement) => {
    // Save cursor position before state update
    const cursorPosition = elementRef ? saveCursorPosition(elementRef) : null;
    
    setEmailElements(emailElements.map(el => 
      el.id === elementId ? { ...el, content: newContent } : el
    ));
    
    // Restore cursor position after React re-render
    if (elementRef && cursorPosition !== null) {
      setTimeout(() => {
        restoreCursorPosition(elementRef, cursorPosition);
      }, 0);
    }
  };

  const updateElement = (elementId: string, updates: any) => {
    setEmailElements(emailElements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    ));
  };

  // ✨ NEW: Update element padding
  const updateElementPadding = (elementId: string, paddingType: 'paddingTop' | 'paddingBottom', value: number) => {
    setEmailElements(emailElements.map(el => 
      el.id === elementId ? { ...el, [paddingType]: value } : el
    ));
  };

  // ✨ NEW: Insert variable into selected element content
  const insertVariable = (variable: string) => {
    if (!selectedElementId) {
      alert('Please select a text or header element first, then click the variable to insert it.');
      return;
    }
    
    const selectedElement = emailElements.find(el => el.id === selectedElementId);
    if (!selectedElement || !['text', 'header', 'button'].includes(selectedElement.type)) {
      alert('Variables can only be inserted into text, header, or button elements.');
      return;
    }
    
    // Insert the variable at the end of the current content
    const currentContent = selectedElement.content || '';
    const newContent = currentContent + (currentContent ? ' ' : '') + variable;
    
    updateElement(selectedElementId, { content: newContent });
  };

  // Helper functions for HTML toggle per element
  const toggleRawHtml = (elementId: string) => {
    setShowRawHtmlElements(prev => ({
      ...prev,
      [elementId]: !prev[elementId]
    }));
  };

  const isShowingRawHtml = (elementId: string) => {
    return showRawHtmlElements[elementId] || false;
  };

  const renderEmailElement = (element: any, index: number) => {
    const isSelected = selectedElementId === element.id;
    const isEditing = isElementEditing(element.id);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Allow Enter to create new lines (don't prevent default)
        // Only Shift+Enter or Escape will exit editing mode
        if (e.shiftKey) {
        e.preventDefault();
          saveAndStopEditing();
      }
        // Regular Enter creates a new line (browser default behavior)
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    };

    const handleBlur = (e: React.FocusEvent) => {
      console.log('💡 BLUR EVENT triggered for element:', element.id);
      console.log('💡 Related target:', e.relatedTarget);
      console.log('💡 Current target:', e.currentTarget);
      
      // Delay blur handling to allow toolbar clicks to process
      setTimeout(() => {
        const relatedTarget = e.relatedTarget as HTMLElement;
        
        console.log('💡 Checking blur conditions...');
        console.log('💡 Related target after timeout:', relatedTarget);
        
        // Don't stop editing if:
        // 1. No related target (internal cursor movement)
        // 2. Clicking on toolbar buttons
        // 3. Clicking within the same contentEditable element
        // 4. Clicking on other contentEditable elements (for multi-selection)
        if (!relatedTarget || (relatedTarget && (
          relatedTarget.closest('.formatting-toolbar') ||
          relatedTarget.closest('[data-toolbar-button]') ||
          relatedTarget.matches('[data-toolbar-button]') ||
          relatedTarget.contentEditable === 'true' ||
          relatedTarget.closest('.editable-text') ||
          relatedTarget.closest('.email-element') // Don't exit when clicking within the same element container
        ))) {
          console.log('🎯 Staying in edit mode - safe target or no target');
          return;
        }
        
        // Only exit if truly clicking outside the editing area
        console.log('👋 Exiting edit mode due to blur outside editing area');
        saveAndStopEditing();
      }, 150);
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      // DO NOTHING during editing to prevent re-renders from wiping out formatting
      // All changes (including colors and links) will be saved when user clicks Save
      console.log('📝 Input detected but not updating state (preserving DOM changes)');
    };

    const handleDragStart = (e: React.DragEvent) => {
      if (typeof window === 'undefined') return;
      
      console.log('🚀 DRAG START - Element:', element.id, 'Index:', index, 'Type:', element.type);
      console.log('🚀 Event target:', e.target);
      console.log('🚀 Current target:', e.currentTarget);
      console.log('🚀 Target class name:', (e.target as HTMLElement).className);
      console.log('🚀 Current target class name:', (e.currentTarget as HTMLElement).className);
      
      // Prevent drag if element is being edited
      if (isEditing) {
        console.log('❌ Preventing drag - element is being edited');
        e.preventDefault();
        return;
      }
      
      // Only allow drag from the drag handle
      const target = e.target as HTMLElement;
      if (!target.closest('.drag-handle')) {
        console.log('❌ Preventing drag - not initiated from drag handle');
        e.preventDefault();
        return;
      }
      
      // Set drag data
      setDraggedElementId(element.id);
      setDraggedElementIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/element-id', element.id);
      e.dataTransfer.setData('text/element-index', index.toString());
      
      // Change cursor
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'grabbing';
      }
      console.log('✅ Drag data set successfully for element:', element.id);
      console.log('✅ Dragged element ID set to:', element.id);
    };

    const handleDragEnd = (e: React.DragEvent) => {
      if (typeof window === 'undefined') return;
      
      console.log('🎯 DRAG END - Element:', element.id);
      console.log('🎯 Event target:', e.target);
      console.log('🎯 Target class name:', (e.target as HTMLElement).className);
      e.stopPropagation();
      
      // Reset drag state
      setDraggedElementId(null);
      setDraggedElementIndex(null);
      setElementDragOverIndex(null);
      
      // Reset cursor
      if (typeof document !== 'undefined') {
        document.body.style.cursor = '';
      }
      console.log('✅ Drag ended, state cleared for element:', element.id);
      console.log('✅ All drag state reset');
    };

    const handleClickCapture = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // If clicking on drag handle, don't interfere
      if (target.closest('.drag-handle')) {
        return;
      }
      
      // NEVER start editing directly - only Edit button should do that
        e.stopPropagation();
        selectElement(element.id);
    };



    return (
      <EmailElement
        key={element.id}
        selected={isSelected}
        editing={isEditing}
        fullWidth={element.fullWidth}
        draggable={false}
        // onClickCapture={handleClickCapture}
        onDragOver={(e) => handleElementDragOver(e, index)}
        onDrop={(e) => handleElementDrop(e, index)}
        onDragLeave={() => setElementDragOverIndex(null)}
        style={{
          paddingTop: `${element.paddingTop ?? 16}px`,
          paddingBottom: `${element.paddingBottom ?? 16}px`,
          opacity: draggedElementId === element.id ? 0.5 : 1,
          transform: draggedElementId === element.id ? 'scale(0.95)' : 'scale(1)',
          transition: 'opacity 0.2s ease, transform 0.2s ease',
          borderTop: elementDragOverIndex === index ? '3px solid var(--primary)' : 'none',
          cursor: isEditing ? 'default' : (draggedElementId === element.id ? 'grabbing' : 'grab')
        }}
      >
        <div className="element-controls">
          {isEditing ? (
            <>
              <ElementControl onClick={(e) => { e.stopPropagation(); saveAndStopEditing(); }} title="Save Changes">
                <FaSave size={12} />
              </ElementControl>
              <ElementControl onClick={(e) => { e.stopPropagation(); cancelEditing(); }} title="Cancel (Discard Changes)">
                <FaTimes size={12} />
              </ElementControl>
            </>
          ) : (
            <>
              <ElementControl onClick={(e) => { 
                console.log('🔥 EDIT BUTTON CLICKED for element:', element.id);
                e.stopPropagation(); 
                startEditing(element.id); 
              }} title="Edit">
            <FaEdit size={12} />
          </ElementControl>
              <ElementControl onClick={(e) => { 
                console.log('🔥 DUPLICATE BUTTON CLICKED for element:', element.id);
                e.stopPropagation(); 
                duplicateElement(element.id); 
              }} title="Duplicate">
            <FaCopy size={12} />
          </ElementControl>
              <ElementControl onClick={(e) => { 
                console.log('🔥 DELETE BUTTON CLICKED for element:', element.id);
                e.stopPropagation(); 
                removeElement(element.id); 
              }} title="Delete">
            <FaTrash size={12} />
          </ElementControl>
            </>
          )}
        </div>
        {/* Enhanced Drag handle for visual feedback */}
        <DragHandle 
          className="drag-handle" 
          title="Drag to reorder this element"
          draggable={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseDown={(e) => {
            e.stopPropagation();
            console.log('🖱️ Drag handle mousedown for element:', element.id);
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{ userSelect: 'none' }}
        >
          <FaGripVertical size={10} style={{ pointerEvents: 'none', userSelect: 'none' }} />
        </DragHandle>
        {element.type === 'header' && (
          <div style={{ position: 'relative' }}>
            {isShowingRawHtml(element.id) ? (
              <textarea
                value={element.content}
                onChange={(e) => handleContentChange(element.id, e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '3em',
                  background: 'transparent',
                  border: '1px dashed rgba(108, 99, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                  color: '#333',
                  resize: 'vertical'
                }}
              />
            ) : (
          <EditableText
            className="editable-text"
            editing={isEditing}
                contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onKeyDown={handleKeyDown}
                // onBlur={handleBlur}
            onInput={handleInput}
            onMouseUp={isEditing ? handleTextSelect : undefined}
            onClick={(e) => {
              e.stopPropagation();
                  // Only select element if NOT in editing mode
              if (!isEditing) {
                    selectElement(element.id);
              }
            }}
                dangerouslySetInnerHTML={!isEditing ? { __html: element.content || 'Enter header text...' } : undefined}
                data-element-id={element.id}
            style={{
                  fontSize: element.fontSize || '28px',
              fontWeight: element.fontWeight || 'bold',
              fontStyle: element.fontStyle || 'normal',
              textDecoration: element.textDecoration || 'none',
                  lineHeight: '1.2',
                  color: element.textColor || '#333',
              margin: 0,
              position: 'relative',
                  cursor: isEditing ? 'text' : 'default',
              minHeight: '1em',
              width: element.fullWidth ? '100%' : 'auto',
              background: element.fullWidth ? 'rgba(108, 99, 255, 0.05)' : 'transparent',
              padding: element.fullWidth ? '0' : '0',
                  borderRadius: element.fullWidth ? '0' : '0',
                  textAlign: element.textAlign || 'left',
                  outline: 'none'
                }}
              />
            )}
            
            {/* ✨ UPDATED: Always show toolbar when editing */}
            {isEditing && (
              <FormattingToolbar className="show formatting-toolbar">
                <FormatButton 
                  data-toolbar-button="true"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleRawHtml(element.id)} 
                  title={isShowingRawHtml(element.id) ? "Switch to Visual Editor" : "Switch to Raw HTML"}
                  style={{
                    background: isShowingRawHtml(element.id) ? '#6c63ff' : 'transparent',
                    color: 'white'
                  }}
                >
                  {isShowingRawHtml(element.id) ? <FaEye /> : <FaCode />}
                </FormatButton>
                
                {!isShowingRawHtml(element.id) && (
                  <>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('bold')} title="Bold">
                  <FaBold />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('italic')} title="Italic">
                  <FaItalic />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('underline')} title="Underline">
                  <FaUnderline />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={openLinkModal} title="Add Link">
                      <FaLink />
                    </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => openColorPicker('text')} title="Text Color">
                      <FaPalette />
                    </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('justifyLeft')} title="Align Left">
                  <FaAlignLeft />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('justifyCenter')} title="Align Center">
                  <FaAlignCenter />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('justifyRight')} title="Align Right">
                  <FaAlignRight />
                </FormatButton>
                  </>
                )}
              </FormattingToolbar>
            )}
          </div>
        )}
        {element.type === 'text' && (
          <div style={{ position: 'relative' }}>
            {isShowingRawHtml(element.id) ? (
              <textarea
                value={element.content}
                onChange={(e) => handleContentChange(element.id, e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '3em',
                  background: 'transparent',
                  border: '1px dashed rgba(108, 99, 255, 0.3)',
                  borderRadius: '4px',
                  padding: '0.5rem',
                  fontFamily: 'monospace',
                  fontSize: '0.9em',
                  color: '#333',
                  resize: 'vertical'
                }}
              />
            ) : (
          <EditableText
            className="editable-text"
            editing={isEditing}
                contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onKeyDown={handleKeyDown}
                // onBlur={handleBlur}
            onInput={handleInput}
            onMouseUp={isEditing ? handleTextSelect : undefined}
            onClick={(e) => {
              e.stopPropagation();
                  // Only select element if NOT in editing mode
              if (!isEditing) {
                    selectElement(element.id);
              }
            }}
                dangerouslySetInnerHTML={!isEditing ? { __html: element.content || 'Enter your text...' } : undefined}
                data-element-id={element.id}
            style={{
              fontSize: element.fontSize || '16px',
              fontWeight: element.fontWeight || 'normal',
              fontStyle: element.fontStyle || 'normal',
              textDecoration: element.textDecoration || 'none',
              lineHeight: '1.6',
              color: '#333',
              margin: 0,
              position: 'relative',
                  cursor: isEditing ? 'text' : 'default',
              minHeight: '1em',
              width: element.fullWidth ? '100%' : 'auto',
              background: element.fullWidth ? 'rgba(108, 99, 255, 0.05)' : 'transparent',
              padding: element.fullWidth ? '0' : '0',
              borderRadius: element.fullWidth ? '0' : '0',
                  textAlign: element.textAlign || 'left',
                  outline: 'none'
                }}
              />
            )}
            
            {/* ✨ UPDATED: Always show toolbar when editing */}
            {isEditing && (
              <FormattingToolbar className="show formatting-toolbar">
                <FormatButton 
                  data-toolbar-button="true"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => toggleRawHtml(element.id)} 
                  title={isShowingRawHtml(element.id) ? "Switch to Visual Editor" : "Switch to Raw HTML"}
                  style={{
                    background: isShowingRawHtml(element.id) ? '#6c63ff' : 'transparent',
                    color: 'white'
                  }}
                >
                  {isShowingRawHtml(element.id) ? <FaEye /> : <FaCode />}
                </FormatButton>
                
                {!isShowingRawHtml(element.id) && (
                  <>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('bold')} title="Bold">
                  <FaBold />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('italic')} title="Italic">
                  <FaItalic />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('underline')} title="Underline">
                  <FaUnderline />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={openLinkModal} title="Add Link">
                      <FaLink />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => openColorPicker('text')} title="Text Color">
                      <FaPalette />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('justifyLeft')} title="Align Left">
                  <FaAlignLeft />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('justifyCenter')} title="Align Center">
                  <FaAlignCenter />
                </FormatButton>
                    <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('justifyRight')} title="Align Right">
                  <FaAlignRight />
                </FormatButton>
                  </>
                )}
              </FormattingToolbar>
            )}
          </div>
        )}
        {element.type === 'button' && (
          <div style={{ 
            textAlign: element.fullWidth ? 'left' : 'center', 
            margin: 0,
            width: element.fullWidth ? '100%' : 'auto',
            position: 'relative'
          }}>
            {/* ✨ NEW: Formatting toolbar for button text - ABOVE the button */}
            {isEditing && (
              <div style={{ position: 'relative', marginBottom: '1rem' }}>
                <FormattingToolbar className="show formatting-toolbar">
                  <FormatButton 
                    data-toolbar-button="true"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => toggleRawHtml(element.id)} 
                    title={isShowingRawHtml(element.id) ? "Switch to Visual Editor" : "Switch to Raw HTML"}
                    style={{
                      background: isShowingRawHtml(element.id) ? '#6c63ff' : 'transparent',
                      color: 'white'
                    }}
                  >
                    {isShowingRawHtml(element.id) ? <FaEye /> : <FaCode />}
                  </FormatButton>
                  
                  {!isShowingRawHtml(element.id) && (
                    <>
                      <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('bold')} title="Bold">
                        <FaBold />
                      </FormatButton>
                      <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('italic')} title="Italic">
                        <FaItalic />
                      </FormatButton>
                      <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('underline')} title="Underline">
                        <FaUnderline />
                      </FormatButton>
                      <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => openColorPicker('text')} title="Text Color">
                        <FaPalette />
                      </FormatButton>
                      <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('justifyLeft')} title="Align Left">
                        <FaAlignLeft />
                      </FormatButton>
                      <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('justifyCenter')} title="Align Center">
                        <FaAlignCenter />
                      </FormatButton>
                      <FormatButton data-toolbar-button="true" onMouseDown={(e) => e.preventDefault()} onClick={() => applyFormat('justifyRight')} title="Align Right">
                        <FaAlignRight />
                      </FormatButton>
                    </>
                  )}
                </FormattingToolbar>
              </div>
            )}
            
            {isEditing ? (
            <EditableText
              className="editable-text"
              editing={isEditing}
              contentEditable={true}
              suppressContentEditableWarning={true}
              onKeyDown={handleKeyDown}
                // onBlur={handleBlur}
              onInput={handleInput}
              onClick={(e) => {
                e.stopPropagation();
              }}
              data-element-id={element.id}
              style={{
                display: element.fullWidth ? 'block' : 'inline-block',
                padding: element.fullWidth ? '0' : '1.25rem 2.5rem',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: element.fullWidth ? '0' : '50px',
                fontWeight: '700',
                fontSize: '1rem',
                  cursor: 'text',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: element.fullWidth ? 'none' : '0 8px 25px rgba(108, 99, 255, 0.3)',
                minHeight: '1em',
                width: element.fullWidth ? '100%' : 'auto',
                textAlign: 'center'
              }}
            >
              {element.content}
            </EditableText>
            ) : (
              <a
                href={element.url || '#'}
                target={element.url && element.url.startsWith('http') ? '_blank' : '_self'}
                rel={element.url && element.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  startEditing(element.id);
                }}
                style={{
                  display: element.fullWidth ? 'block' : 'inline-block',
                  padding: element.fullWidth ? '0' : '1.25rem 2.5rem',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: element.fullWidth ? '0' : '50px',
                  fontWeight: '700',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  boxShadow: element.fullWidth ? 'none' : '0 8px 25px rgba(108, 99, 255, 0.3)',
                  width: element.fullWidth ? '100%' : 'auto',
                  textAlign: 'center'
                }}
                dangerouslySetInnerHTML={{ __html: element.content }}
              />
            )}
            
            {/* URL hint when selected but not editing */}
            {isSelected && !isEditing && element.url && element.url !== '#' && (
              <div style={{
                position: 'absolute',
                top: '-40px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                whiteSpace: 'nowrap',
                zIndex: 10,
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                🔗 Links to: {element.url}
              </div>
            )}
            
            {/* ✨ Link icon next to button when editing */}
            {isEditing && (
              <div style={{
                position: 'absolute',
                top: '50%',
                right: '-60px',
                transform: 'translateY(-50%)',
                zIndex: 20
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLinkUrl(element.url || '');
                    setShowLinkModal(true);
                  }}
                  style={{
                    background: 'var(--primary)',
                    border: '2px solid white',
                    color: 'white',
                    padding: '0.75rem',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(108, 99, 255, 0.5)',
                    transition: 'all 0.3s ease',
                    width: '44px',
                    height: '44px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--accent)';
                    e.currentTarget.style.transform = 'scale(1.15)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 99, 255, 0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--primary)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 99, 255, 0.5)';
                  }}
                  title="Edit Button URL"
                >
                  <FaLink size={16} />
                </button>
              </div>
            )}

          </div>
        )}
        {element.type === 'image' && (
          <div style={{ 
            textAlign: element.fullWidth ? 'left' : 'center', 
            margin: 0, 
            position: 'relative',
            width: element.fullWidth ? '100%' : 'auto'
          }}>
            {/* Upload progress indicator */}
            {imageUploading === element.id && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(108, 99, 255, 0.1)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                backdropFilter: 'blur(2px)'
              }}>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Uploading to storage...
                </div>
              </div>
            )}
            
            {/* Error message */}
            {uploadError && isSelected && (
              <div style={{
                position: 'absolute',
                top: '-60px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(239, 68, 68, 0.9)',
                color: 'white',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                zIndex: 15,
                whiteSpace: 'nowrap'
              }}>
                {uploadError}
              </div>
            )}
            
            {element.src ? (
              <div style={{ position: 'relative' }}>
            <img 
              src={element.src} 
              alt={element.alt || 'Email image'} 
              style={{ 
                maxWidth: '100%', 
                width: element.fullWidth ? '100%' : 'auto',
                height: 'auto', 
                borderRadius: element.fullWidth ? '0' : '8px',
                boxShadow: element.fullWidth ? 'none' : '0 4px 15px rgba(0, 0, 0, 0.1)',
                opacity: imageUploading === element.id ? 0.5 : 1,
                transition: 'opacity 0.3s ease'
              }} 
            />
                {/* ✨ NEW: Image upload overlay when selected */}
                {isSelected && imageUploading !== element.id && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0, 0, 0, 0.8)',
                    color: 'white',
                    padding: '1rem',
                    borderRadius: '8px',
                    display: 'flex',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    <button
                      onClick={() => handleImageUpload(element.id)}
                      style={{
                        background: 'var(--primary)',
                        border: 'none',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                    >
                      <FaUpload size={14} />
                      Change Image
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ✨ NEW: Image upload area when no image */
              (<ImageUploadArea
                onClick={() => imageUploading !== element.id && handleImageUpload(element.id)}
                onDrop={(e) => imageUploading !== element.id && handleImageDrop(e, element.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (imageUploading !== element.id) {
                  e.currentTarget.classList.add('dragover');
                  }
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('dragover');
                }}
                style={{
                  opacity: imageUploading === element.id ? 0.5 : 1,
                  cursor: imageUploading === element.id ? 'not-allowed' : 'pointer'
                }}
              >
                {imageUploading === element.id ? (
                  <>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      border: '3px solid rgba(108, 99, 255, 0.3)',
                      borderTop: '3px solid #6c63ff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginBottom: '1rem'
                    }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Uploading to Storage...
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      Please wait while we save your image
                    </div>
                  </>
                ) : (
                  <>
                <FaCloudUploadAlt size={48} style={{ color: '#6c63ff', marginBottom: '1rem' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Upload an Image
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  Click to browse or drag and drop
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999' }}>
                      Supports JPG, PNG, GIF (max 10MB)
                </div>
                  </>
                )}
              </ImageUploadArea>)
            )}
          </div>
        )}
        {element.type === 'divider' && (
          <div style={{ 
            margin: 0, 
            textAlign: 'center',
            width: element.fullWidth ? '100%' : 'auto'
          }}>
            <div style={{
              height: '2px',
              background: element.fullWidth 
                ? 'linear-gradient(90deg, #ddd, #ddd, #ddd)' 
                : 'linear-gradient(90deg, transparent, #ddd, transparent)',
              width: '100%'
            }} />
          </div>
        )}
        {element.type === 'spacer' && (
          <div style={{ height: element.height || '30px' }} />
        )}
        {element.type === 'social' && (
          <div style={{ textAlign: 'center', margin: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {element.links?.map((link: any, idx: number) => (
                <a key={idx} href={link.url} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  background: '#6c63ff',
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  minWidth: '120px',
                  justifyContent: 'center'
                }}>
                  {link.platform === 'facebook' && <FaFacebookF size={16} />}
                  {link.platform === 'twitter' && <FaXTwitter size={16} />}
                  {link.platform === 'instagram' && <FaInstagram size={16} />}
                  {link.platform === 'youtube' && <FaYoutube size={16} />}
                  {link.platform === 'discord' && <FaDiscord size={16} />}
                </a>
              ))}
            </div>
          </div>
        )}
        {element.type === 'columns' && (
          <div style={{ display: 'flex', gap: '2rem', margin: 0 }}>
            {element.columns?.map((column: any, idx: number) => (
              <div key={idx} style={{ flex: 1, padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <EditableText
                  editing={isEditing}
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                  onKeyDown={handleKeyDown}
                  onBlur={handleBlur}
                  onInput={(e) => {
                    // Save cursor position before update
                    const cursorPosition = saveCursorPosition(e.currentTarget);
                    
                    const newColumns = [...element.columns];
                    newColumns[idx] = { ...newColumns[idx], content: e.currentTarget.textContent || '' };
                    updateElement(element.id, { columns: newColumns });
                    
                    // Restore cursor position after update
                    if (cursorPosition !== null) {
                      setTimeout(() => {
                        restoreCursorPosition(e.currentTarget, cursorPosition);
                      }, 0);
                    }
                  }}
                >
                  {column.content}
                </EditableText>
              </div>
            ))}
          </div>
        )}
        {element.type === 'video' && (
          <div style={{ textAlign: 'center', margin: 0 }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <img 
                src={element.thumbnail} 
                alt="Video thumbnail" 
                style={{ 
                  maxWidth: '100%', 
                  height: 'auto', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60px',
                height: '60px',
                background: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem'
              }}>
                ▶️
              </div>
            </div>
          </div>
        )}
        {element.type === 'footer' && (
          <div style={{ 
            textAlign: 'center', 
            padding: element.fullWidth ? '0' : '2rem',
            fontSize: '0.8rem', 
            color: '#666',
            background: element.fullWidth 
              ? 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)' 
              : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderTop: element.fullWidth ? 'none' : '1px solid #dee2e6',
            margin: 0,
            width: element.fullWidth ? '100%' : 'auto',
            borderRadius: element.fullWidth ? '0' : 'inherit'
          }}>
            {/* Social Links */}
            {element.socialLinks && element.socialLinks.length > 0 && (
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                {element.socialLinks.map((social: any, idx: number) => (
                  <a key={idx} href={social.url} style={{ 
                    color: '#6c63ff', 
                    textDecoration: 'none',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    padding: '0.5rem',
                    borderRadius: '6px',
                    transition: 'all 0.3s ease'
                  }}>
                    {social.platform === 'facebook' && <FaFacebookF size={16} />}
                    {social.platform === 'twitter' && <FaXTwitter size={16} />}
                    {social.platform === 'instagram' && <FaInstagram size={16} />}
                    {social.platform === 'youtube' && <FaYoutube size={16} />}
                    {social.platform === 'discord' && <FaDiscord size={16} />}
                  </a>
                ))}
              </div>
            )}
            
            {/* Footer Text */}
            <EditableText
              className="editable-text"
              editing={isEditing && selectedElementId === element.id}
              contentEditable={isEditing && selectedElementId === element.id}
              suppressContentEditableWarning={true}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onInput={(e) => {
                const newContent = e.currentTarget.textContent || '';
                updateElement(element.id, { footerText: newContent });
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isEditing) {
                  startEditing(element.id);
                }
              }}
              style={{
                marginBottom: '1rem',
                cursor: isEditing ? 'text' : 'pointer',
                outline: 'none',
                minHeight: '1em'
              }}
            >
              {element.footerText || '© 2024 Cymasphere Inc. All rights reserved.'}
            </EditableText>
            
            {/* Footer Links */}
            <div>
              <a href={element.unsubscribeUrl || '#unsubscribe'} style={{ color: '#6c63ff', textDecoration: 'none' }}>
                {element.unsubscribeText || 'Unsubscribe'}
              </a>
              {' | '}
              <a href={element.privacyUrl || '#privacy'} style={{ color: '#6c63ff', textDecoration: 'none' }}>
                {element.privacyText || 'Privacy Policy'}
              </a>
              {' | '}
              <a href={element.contactUrl || '#contact'} style={{ color: '#6c63ff', textDecoration: 'none' }}>
                {element.contactText || 'Contact Us'}
              </a>
            </div>
            
            {/* Edit hint when selected */}
            {isSelected && !isEditing && (
              <div style={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                zIndex: 10
              }}>
                Double-click to edit footer content
              </div>
            )}
          </div>
        )}
        {element.type === 'brand-header' && (
          <div style={{ 
            textAlign: 'center', 
            padding: element.fullWidth ? '0' : '20px',
            background: element.backgroundColor || 'linear-gradient(135deg, #1a1a1a 0%, #121212 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60px'
          }}>
            <EditableText
              className="editable-text brand-header"
              editing={isEditing && selectedElementId === element.id}
              contentEditable={isEditing && selectedElementId === element.id}
              suppressContentEditableWarning={true}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onInput={(e) => {
                const newContent = e.currentTarget.textContent || '';
                updateElement(element.id, { content: newContent });
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isEditing) {
                  startEditing(element.id);
                }
              }}
              style={{
                color: element.textColor || '#ffffff',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: isEditing ? 'text' : 'pointer',
                outline: 'none',
                minHeight: '1em'
              }}
            >
              {element.logoStyle === 'gradient' ? (
                <>
                  <span style={{
                    background: 'linear-gradient(90deg, #6c63ff, #4ecdc4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>
                    {element.content ? element.content.slice(0, 4) : 'CYMA'}
                  </span>
                  <span>
                    {element.content ? element.content.slice(4) : 'SPHERE'}
                  </span>
                </>
              ) : (
                <span>{element.content || 'CYMASPHERE'}</span>
              )}
            </EditableText>
            
            {/* Edit hint when selected */}
            {isSelected && !isEditing && (
              <div style={{
                position: 'absolute',
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'rgba(0, 0, 0, 0.8)',
                color: 'white',
                padding: '0.4rem 0.8rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
                zIndex: 10
              }}>
                Double-click to edit brand header
              </div>
            )}
          </div>
        )}
      </EmailElement>
    );
  };

  return (
    <div>
      {/* Keyframes for animations */}
      <SpinKeyframes />
      {/* Visual Email Canvas */}
      {/* Element Palette - Horizontal Top Bar */}
      <div style={{ 
        marginBottom: '1rem',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
        borderRadius: '12px',
        padding: '0.75rem',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex', 
        gap: '0.75rem', 
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging header element from palette');
            e.dataTransfer.setData('text/element-type', 'header');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('header');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaFont size={14} />
          <span>Header</span>
        </ElementBlock>
        
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging text element from palette');
            e.dataTransfer.setData('text/element-type', 'text');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('text');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaFont size={12} />
          <span>Text</span>
        </ElementBlock>
        
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging button element from palette');
            e.dataTransfer.setData('text/element-type', 'button');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('button');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaMousePointer size={12} />
          <span>Button</span>
        </ElementBlock>
        
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging image element from palette');
            e.dataTransfer.setData('text/element-type', 'image');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('image');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaImage size={12} />
          <span>Image</span>
        </ElementBlock>
        
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging divider element from palette');
            e.dataTransfer.setData('text/element-type', 'divider');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('divider');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaDivide size={12} />
          <span>Divider</span>
        </ElementBlock>
        
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging spacer element from palette');
            e.dataTransfer.setData('text/element-type', 'spacer');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('spacer');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaExpandArrowsAlt size={12} />
          <span>Spacer</span>
        </ElementBlock>
        
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging social element from palette');
            e.dataTransfer.setData('text/element-type', 'social');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('social');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaShareAlt size={12} />
          <span>Social</span>
        </ElementBlock>
        
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging columns element from palette');
            e.dataTransfer.setData('text/element-type', 'columns');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('columns');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaColumns size={12} />
          <span>Columns</span>
        </ElementBlock>
        
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging video element from palette');
            e.dataTransfer.setData('text/element-type', 'video');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('video');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaVideo size={12} />
          <span>Video</span>
        </ElementBlock>
        
        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging footer element from palette');
            e.dataTransfer.setData('text/element-type', 'footer');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('footer');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaCog size={12} />
          <span>Footer</span>
        </ElementBlock>

        <ElementBlock 
          draggable={true}
          onDragStart={(e) => {
            console.log('🚀 Dragging brand-header element from palette');
            e.dataTransfer.setData('text/element-type', 'brand-header');
            e.dataTransfer.effectAllowed = 'copy';
          }}
          onClick={() => {
            const newElement = createNewElement('brand-header');
            setEmailElements([...emailElements, newElement]);
          }}
        >
          <FaBold size={12} />
          <span>Brand Header</span>
        </ElementBlock>
      </div>

      <div style={{ 
        display: 'flex',
        gap: '0.5rem', 
        minHeight: '600px',
        overflow: 'visible',
        width: '100%'
      }}>
        
        {/* Visual Email Canvas - Left */}
        <div style={{ 
          flex: rightPanelState ? '8' : '1 1 auto',
          display: 'flex', 
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
          borderRadius: '16px',
          padding: '0.5rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          alignSelf: 'flex-start',
          transition: 'all 0.3s ease',
          overflow: 'visible',
          minWidth: 0
        }}>
          <ViewToggleContainer>
            <ViewToggle 
              active={currentView === 'desktop'}
              onClick={() => setCurrentView('desktop')}
            >
              <FaDesktop style={{ marginRight: '0.5rem' }} />
              Desktop
            </ViewToggle>
            <ViewToggle 
              active={currentView === 'mobile'}
              onClick={() => setCurrentView('mobile')}
            >
              <FaMobileAlt style={{ marginRight: '0.5rem' }} />
              Mobile
            </ViewToggle>
            <ViewToggle 
              active={currentView === 'text'}
              onClick={() => setCurrentView('text')}
            >
              <FaEnvelope style={{ marginRight: '0.5rem' }} />
              Text Only
            </ViewToggle>
          </ViewToggleContainer>

          <EmailCanvas>
            <EmailContainer style={{
              width: currentView === 'mobile' ? '375px' : '100%',
              maxWidth: currentView === 'text' ? '500px' : 'none',
              backgroundColor: currentView === 'text' ? '#f8f9fa' : designSettings.backgroundColor,
              fontFamily: designSettings.fontFamily,
              fontSize: designSettings.fontSize,
              color: designSettings.textColor,
              transition: 'all 0.3s ease'
            }}>
              {currentView === 'text' ? (
                // Text-only view
                (<div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #ddd' }}>
                    <strong>From:</strong> {campaignData.senderName || 'Sender Name'}<br/>
                    <strong>Subject:</strong> {campaignData.subject || 'Email Subject'}<br/>
                    {campaignData.preheader && (
                      <>
                        <strong>Preheader:</strong> {campaignData.preheader}<br/>
                      </>
                    )}
                  </div>
                  

                  
                  {emailElements.map((element, index) => {
                    // Helper function to strip HTML tags for text-only view
                    const stripHtml = (html: string) => {
                      const div = document.createElement('div');
                      div.innerHTML = html;
                      return div.textContent || div.innerText || '';
                    };
                    
                    return (
                    <div key={element.id} style={{ marginBottom: '1rem' }}>
                      {element.type === 'header' && <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{stripHtml(element.content)}</div>}
                      {element.type === 'text' && <div>{stripHtml(element.content)}</div>}
                      {element.type === 'button' && <div style={{ padding: '0.5rem', border: '1px solid #ddd', display: 'inline-block' }}>[BUTTON: {stripHtml(element.content)}]</div>}
                      {element.type === 'image' && <div style={{ fontStyle: 'italic' }}>[IMAGE: {element.src}]</div>}
                      {element.type === 'divider' && <div>{'─'.repeat(50)}</div>}
                      {element.type === 'spacer' && <div style={{ height: element.height || '20px' }}></div>}
                      {element.type === 'footer' && (
                  <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ddd', fontSize: '0.8rem', color: '#666' }}>
                          {/* Social Links */}
                          {element.socialLinks && element.socialLinks.length > 0 && (
                            <div style={{ marginBottom: '1rem' }}>
                              Social Links: {element.socialLinks.map((social: any, idx: number) => (
                                `${social.platform}: ${social.url}`
                              )).join(' | ')}
                  </div>
                          )}
                          {/* Footer Text */}
                          <div style={{ marginBottom: '0.5rem' }}>
                            {element.footerText || '© 2024 Cymasphere Inc. All rights reserved.'}
                          </div>
                          {/* Footer Links */}
                          <div>
                            {element.unsubscribeText || 'Unsubscribe'}: {element.unsubscribeUrl || '#unsubscribe'} | 
                            {element.privacyText || 'Privacy Policy'}: {element.privacyUrl || '#privacy'} | 
                            {element.contactText || 'Contact Us'}: {element.contactUrl || '#contact'}
                          </div>
                        </div>
                      )}
                      {element.type === 'brand-header' && (
                      <div style={{ 
                          textAlign: 'center', 
                          marginBottom: '2rem', 
                          paddingBottom: '1rem', 
                          borderBottom: '2px solid #ddd',
                        fontSize: '1.5rem',
                          fontWeight: 'bold',
                          letterSpacing: '0.2em'
                      }}>
                          {element.content || 'CYMASPHERE'}
                      </div>
                      )}
                      </div>
                    );
                  })}
                </div>)
              ) : (
                // Visual view (desktop/mobile)
                (<>

                  <EmailBody
                    onDragOver={(e) => {
                      e.preventDefault();
                      const elementType = e.dataTransfer.getData('text/element-type');
                      if (elementType || draggedElementId) {
                        e.dataTransfer.dropEffect = elementType ? 'copy' : 'move';
                        if (emailElements.length === 0) {
                          setElementDragOverIndex(0);
                        }
                      }
                    }}
                    onDrop={(e) => {
                      if (emailElements.length === 0) {
                        handleElementDrop(e, 0);
                      }
                    }}
                    onDragLeave={() => {
                      if (emailElements.length === 0) {
                        setElementDragOverIndex(null);
                      }
                    }}
                  >
                    {emailElements.map((element, index) => (
                      <React.Fragment key={element.id}>
                        {/* Element reordering drop zone at the beginning */}
                        {index === 0 && (
                          <div
                            onDragOver={(e) => handleElementDragOver(e, 0)}
                            onDrop={(e) => handleElementDrop(e, 0)}
                            style={{
                              height: elementDragOverIndex === 0 ? '6px' : '2px',
                              background: elementDragOverIndex === 0 ? 'var(--primary)' : 'transparent',
                              transition: 'all 0.2s ease',
                              margin: '8px 0',
                              borderRadius: '2px'
                            }}
                          />
                        )}
                        
                        {renderEmailElement(element, index)}
                        
                        {/* Element reordering drop zone after each element */}
                          <div
                            onDragOver={(e) => handleElementDragOver(e, index + 1)}
                            onDrop={(e) => handleElementDrop(e, index + 1)}
                            style={{
                              height: elementDragOverIndex === index + 1 ? '6px' : '2px',
                              background: elementDragOverIndex === index + 1 ? 'var(--primary)' : 'transparent',
                              transition: 'all 0.2s ease',
                              margin: '8px 0',
                              borderRadius: '2px'
                            }}
                        />
                      </React.Fragment>
                    ))}
                    
                    {/* Empty state */}
                    {emailElements.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        color: '#666',
                        fontSize: '1.1rem',
                        border: elementDragOverIndex === 0 ? '2px dashed var(--primary)' : '2px dashed transparent',
                        borderRadius: '12px',
                        background: elementDragOverIndex === 0 ? 'rgba(108, 99, 255, 0.05)' : 'transparent',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                          {elementDragOverIndex === 0 ? 'Drop element here!' : 'Start Building Your Email'}
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                          {elementDragOverIndex === 0 ? 'Release to add the element' : 'Drag elements from above or click to add them'}
                        </div>
                      </div>
                    )}
                  </EmailBody>
                </>)
              )}
            </EmailContainer>
          </EmailCanvas>
        </div>

        {/* Settings Panels - Right */}
        <div style={{ 
          width: rightPanelState ? '320px' : '50px',
          flexShrink: 0,
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem', 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
          borderRadius: '16px',
          padding: rightPanelState ? '0.5rem' : '0.25rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          alignSelf: 'flex-start',
          transition: 'all 0.3s ease',
          overflow: 'visible'
        }}>
          
          {/* Toggle Button */}
          <div style={{ 
            display: 'flex', 
            justifyContent: rightPanelState ? 'flex-end' : 'center',
            marginBottom: rightPanelState ? '0' : '1rem'
          }}>
            <button
              onClick={() => setRightPanelState(!rightPanelState)}
              style={{ 
                padding: '0.75rem',
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                border: 'none', 
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(108, 99, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '40px',
                minHeight: '40px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(108, 99, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(108, 99, 255, 0.3)';
              }}
            >
              {rightPanelState ? '→' : '←'}
            </button>
          </div>

          {rightPanelState && (
            <>
              {/* Element Properties */}
              <SidebarPanel>
                <PanelHeader>
                  <PanelIcon><FaCog /></PanelIcon>
                  <PanelTitle>Element Properties</PanelTitle>
                </PanelHeader>
                {selectedElementId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ padding: '1rem', background: 'rgba(108, 99, 255, 0.1)', borderRadius: '8px' }}>
                      <p style={{ margin: 0, color: 'var(--text)', fontWeight: '600' }}>
                        Selected: {emailElements.find(el => el.id === selectedElementId)?.type || 'Unknown'} Element
                      </p>
                    </div>
                    
                    {/* ✨ NEW: Padding Controls */}
                    <PaddingControl>
                      <div style={{ marginBottom: '1rem' }}>
                        <PaddingLabel>
                          Padding Top
                          <PaddingValue>{emailElements.find(el => el.id === selectedElementId)?.paddingTop ?? 16}px</PaddingValue>
                        </PaddingLabel>
                        <PaddingSlider
                          type="range"
                          min="0"
                          max="100"
                          value={emailElements.find(el => el.id === selectedElementId)?.paddingTop ?? 16}
                          onChange={(e) => updateElementPadding(selectedElementId, 'paddingTop', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div>
                        <PaddingLabel>
                          Padding Bottom
                          <PaddingValue>{emailElements.find(el => el.id === selectedElementId)?.paddingBottom ?? 16}px</PaddingValue>
                        </PaddingLabel>
                        <PaddingSlider
                          type="range"
                          min="0"
                          max="100"
                          value={emailElements.find(el => el.id === selectedElementId)?.paddingBottom ?? 16}
                          onChange={(e) => updateElementPadding(selectedElementId, 'paddingBottom', parseInt(e.target.value))}
                        />
                      </div>
                    </PaddingControl>
                    
                    {/* Full Width Toggle */}
                    <ControlGroup>
                      <ControlLabel style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={emailElements.find(el => el.id === selectedElementId)?.fullWidth ?? false}
                          onChange={(e) => updateElement(selectedElementId, { fullWidth: e.target.checked })}
                          style={{
                            width: '16px',
                            height: '16px',
                            accentColor: 'var(--primary)',
                            cursor: 'pointer'
                          }}
                        />
                        Full Width
                        {emailElements.find(el => el.id === selectedElementId)?.fullWidth && (
                          <span style={{ 
                            fontSize: '0.7rem', 
                            background: 'var(--primary)', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '4px',
                            fontWeight: 'bold'
                          }}>
                            FULL
                          </span>
                        )}
                      </ControlLabel>
                      <div style={{ 
                        fontSize: '0.8rem', 
                        color: 'var(--text-secondary)', 
                        opacity: 0.8,
                        marginTop: '0.25rem'
                      }}>
                        {emailElements.find(el => el.id === selectedElementId)?.fullWidth 
                          ? '✨ Element extends to email container edges' 
                          : 'Expand element to full email width'}
                      </div>
                    </ControlGroup>

                    {/* Button Specific Controls */}
                    {emailElements.find(el => el.id === selectedElementId)?.type === 'button' && (
                      <ControlGroup>
                        <ControlLabel style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaLink size={14} />
                          Button URL
                        </ControlLabel>
                        <UrlInput
                          type="url"
                          placeholder="https://example.com or #anchor"
                          value={emailElements.find(el => el.id === selectedElementId)?.url || '#'}
                          onChange={(e) => updateElement(selectedElementId, { url: e.target.value })}
                        />
                        <div style={{ 
                          fontSize: '0.8rem', 
                          color: 'var(--text-secondary)', 
                          opacity: 0.8,
                          marginTop: '0.25rem'
                        }}>
                          🔗 Link destination when button is clicked
                        </div>
                      </ControlGroup>
                    )}

                    {/* Brand Header Specific Controls */}
                    {emailElements.find(el => el.id === selectedElementId)?.type === 'brand-header' && (
                      <>
                        <ControlGroup>
                          <ControlLabel>Background Color</ControlLabel>
                          <ColorInput 
                            type="color" 
                            value={emailElements.find(el => el.id === selectedElementId)?.backgroundColor || '#1a1a1a'}
                            onChange={(e) => updateElement(selectedElementId, { backgroundColor: e.target.value })}
                          />
                        </ControlGroup>
                        
                        <ControlGroup>
                          <ControlLabel>Text Color</ControlLabel>
                          <ColorInput 
                            type="color" 
                            value={emailElements.find(el => el.id === selectedElementId)?.textColor || '#ffffff'}
                            onChange={(e) => updateElement(selectedElementId, { textColor: e.target.value })}
                          />
                        </ControlGroup>

                        <ControlGroup>
                          <ControlLabel>Logo Style</ControlLabel>
                          <ControlSelect 
                            value={emailElements.find(el => el.id === selectedElementId)?.logoStyle || 'gradient'}
                            onChange={(e) => updateElement(selectedElementId, { logoStyle: e.target.value })}
                          >
                            <option value="gradient">Gradient</option>
                            <option value="solid">Solid</option>
                          </ControlSelect>
                        </ControlGroup>
                      </>
                    )}
                    
                    <ControlGroup>
                      <ControlLabel>Element ID</ControlLabel>
                      <div style={{ 
                        padding: '0.75rem', 
                        background: 'rgba(255, 255, 255, 0.05)', 
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)'
                      }}>
                        {selectedElementId}
                      </div>
                    </ControlGroup>
                  </div>
                ) : (
                  <EmptyState>
                    <span style={{ fontSize: '2rem', opacity: 0.5 }}>🔧</span>
                    <span style={{ fontWeight: '500' }}>Select an element to edit its properties</span>
                  </EmptyState>
                )}
              </SidebarPanel>

              {/* Design Settings */}
              <SidebarPanel>
                <PanelHeader>
                  <PanelIcon><FaPaintBrush /></PanelIcon>
                  <PanelTitle>Design Settings</PanelTitle>
                </PanelHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <ControlGroup>
                    <ControlLabel>Background Color</ControlLabel>
                    <ColorInput 
                      type="color" 
                      value={designSettings.backgroundColor}
                      onChange={(e) => updateDesignSetting('backgroundColor', e.target.value)}
                    />
                  </ControlGroup>
                  <ControlGroup>
                    <ControlLabel style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Content Width
                      {parseInt(designSettings.contentWidth) >= 800 && (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          background: 'linear-gradient(135deg, var(--primary), var(--accent))', 
                          color: 'white', 
                          padding: '2px 6px', 
                          borderRadius: '4px',
                          fontWeight: 'bold'
                        }}>
                          WIDE
                        </span>
                      )}
                    </ControlLabel>
                    <ControlSelect 
                      value={designSettings.contentWidth}
                      onChange={(e) => updateDesignSetting('contentWidth', e.target.value)}
                    >
                      <option value="500px">500px (Narrow)</option>
                      <option value="600px">600px (Standard)</option>
                      <option value="700px">700px (Wide)</option>
                      <option value="800px">800px (Extra Wide)</option>
                      <option value="900px">900px (Spacious)</option>
                      <option value="1000px">1000px (Full)</option>
                      <option value="1200px">1200px (Expanded)</option>
                      <option value="1400px">1400px (Wide)</option>
                      <option value="1600px">1600px (Maximum)</option>
                    </ControlSelect>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: 'var(--text-secondary)', 
                      opacity: 0.8,
                      marginTop: '0.25rem'
                    }}>
                      ✨ Now with expanded workspace for larger designs
                    </div>
                  </ControlGroup>
                  <ControlGroup>
                    <ControlLabel>Font Family</ControlLabel>
                    <ControlSelect 
                      value={designSettings.fontFamily}
                      onChange={(e) => updateDesignSetting('fontFamily', e.target.value)}
                    >
                      <option value="Arial, sans-serif">Arial</option>
                      <option value="Helvetica, sans-serif">Helvetica</option>
                      <option value="Georgia, serif">Georgia</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Courier New', monospace">Courier New</option>
                    </ControlSelect>
                  </ControlGroup>
                  <ControlGroup>
                    <ControlLabel>Font Size</ControlLabel>
                    <ControlSelect 
                      value={designSettings.fontSize}
                      onChange={(e) => updateDesignSetting('fontSize', e.target.value)}
                    >
                      <option value="14px">14px (Small)</option>
                      <option value="16px">16px (Standard)</option>
                      <option value="18px">18px (Large)</option>
                      <option value="20px">20px (Extra Large)</option>
                    </ControlSelect>
                  </ControlGroup>
                  <ControlGroup>
                    <ControlLabel>Text Color</ControlLabel>
                    <ColorInput 
                      type="color" 
                      value={designSettings.textColor}
                      onChange={(e) => updateDesignSetting('textColor', e.target.value)}
                    />
                  </ControlGroup>
                </div>
              </SidebarPanel>

              {/* Variables */}
              <SidebarPanel>
                <PanelHeader>
                  <PanelIcon><FaTextHeight /></PanelIcon>
                  <PanelTitle>Variables</PanelTitle>
                </PanelHeader>
                <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(108, 99, 255, 0.1)', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  💡 Select a text, header, or button element, then click a variable to insert it.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <VariableTag onClick={() => insertVariable('{{firstName}}')}>{'{{firstName}}'}</VariableTag>
                  <VariableTag onClick={() => insertVariable('{{lastName}}')}>{'{{lastName}}'}</VariableTag>
                  <VariableTag onClick={() => insertVariable('{{fullName}}')}>{'{{fullName}}'}</VariableTag>
                  <VariableTag onClick={() => insertVariable('{{email}}')}>{'{{email}}'}</VariableTag>
                  <VariableTag onClick={() => insertVariable('{{companyName}}')}>{'{{companyName}}'}</VariableTag>
                  <VariableTag onClick={() => insertVariable('{{subscription}}')}>{'{{subscription}}'}</VariableTag>
                  <VariableTag onClick={() => insertVariable('{{lifetimePurchase}}')}>{'{{lifetimePurchase}}'}</VariableTag>
                  <VariableTag onClick={() => insertVariable('{{unsubscribeUrl}}')}>{'{{unsubscribeUrl}}'}</VariableTag>
                  <VariableTag onClick={() => insertVariable('{{currentDate}}')}>{'{{currentDate}}'}</VariableTag>
                </div>
              </SidebarPanel>
            </>
          )}

        </div>
      </div>
      {/* Hidden drag preview */}
      <div ref={dragPreviewRef} style={{ position: 'absolute', top: '-1000px', left: '-1000px' }}>
        Dragging element...
      </div>
      {/* ✨ NEW: Hidden file input for image uploads */}
      <FileInput
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
      />
      {/* ✨ ENHANCED: Updated keyboard shortcuts hint */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(108, 99, 255, 0.05) 100%)',
        borderRadius: '12px',
        border: '1px solid rgba(108, 99, 255, 0.2)',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)',
        textAlign: 'center'
      }}>
        <strong style={{ color: 'var(--primary)' }}>💡 Quick Shortcuts & Features:</strong>{' '}
        <span style={{ margin: '0 1rem' }}>
          <kbd style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '0.8rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>Delete</kbd> Remove selected
        </span>
        <span style={{ margin: '0 1rem' }}>
          <kbd style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '0.8rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>Ctrl+D</kbd> Duplicate
        </span>
        <span style={{ margin: '0 1rem' }}>
          <kbd style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '0.8rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>Esc</kbd> Deselect
        </span>
        <span style={{ margin: '0 1rem' }}>
          <kbd style={{ 
            background: 'rgba(255, 255, 255, 0.1)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            fontSize: '0.8rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>Double-click</kbd> Edit text
        </span>
        <br />
        <span style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: '0.5rem', display: 'inline-block' }}>
          🎯 <strong>Email Editor:</strong> Drag handles to reorder • Rich text formatting • Image upload • Padding controls
        </span>
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <ModalOverlay onClick={closeLinkModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {!editingElement && selectedElementId && emailElements.find(el => el.id === selectedElementId)?.type === 'button' 
                ? 'Edit Button URL' 
                : 'Add Link'}
            </ModalTitle>
            
            {/* Show text input only for inline links, not for button URLs */}
            {editingElement && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: 'var(--text)', 
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Link Text (required)
                </label>
                <ModalInput
                  type="text"
                  placeholder="Enter the text to display (e.g., Click here)"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                color: 'var(--text)', 
                fontSize: '0.9rem',
                fontWeight: '600'
              }}>
                URL (required)
              </label>
              <ModalInput
                type="url"
                placeholder="Enter URL (e.g., https://example.com)"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                autoFocus={!editingElement}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    // For buttons, only URL is required
                    if (!editingElement && selectedElementId && linkUrl.trim()) {
                      applyLink();
                    }
                    // For text links, both text and URL are required
                    else if (editingElement && linkText.trim() && linkUrl.trim()) {
                      applyLink();
                    }
                  } else if (e.key === 'Escape') {
                    closeLinkModal();
                  }
                }}
              />
            </div>
            
            <ModalButtons>
              <ModalButton $variant="secondary" onClick={closeLinkModal}>
                Cancel
              </ModalButton>
              <ModalButton 
                $variant="primary" 
                onClick={applyLink}
                style={{ 
                  opacity: (() => {
                    // For buttons, only URL is required
                    if (!editingElement && selectedElementId) {
                      return linkUrl.trim() ? 1 : 0.5;
                    }
                    // For text links, both text and URL are required
                    return (linkText.trim() && linkUrl.trim()) ? 1 : 0.5;
                  })(),
                  cursor: (() => {
                    // For buttons, only URL is required
                    if (!editingElement && selectedElementId) {
                      return linkUrl.trim() ? 'pointer' : 'not-allowed';
                    }
                    // For text links, both text and URL are required
                    return (linkText.trim() && linkUrl.trim()) ? 'pointer' : 'not-allowed';
                  })()
                }}
              >
                {!editingElement && selectedElementId && emailElements.find(el => el.id === selectedElementId)?.type === 'button' 
                  ? 'Update Button URL' 
                  : 'Add Link'}
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Color Picker Modal */}
      {showColorPicker && (
        <ModalOverlay onClick={closeColorPicker}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              Choose {colorPickerType === 'text' ? 'Text' : 'Background'} Color
            </ModalTitle>
            <ColorPickerContainer>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: 'var(--text)', 
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Color Picker
                </label>
                <ColorInputModal
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                />
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1rem', 
                marginBottom: '1rem',
                padding: '0.75rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  backgroundColor: selectedColor,
                  borderRadius: '8px',
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }} />
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: '600' }}>
                    Selected Color
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {selectedColor.toUpperCase()}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: 'var(--text)', 
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}>
                  Quick Colors
                </label>
                <ColorPresets>
                  {colorPresets.map((color) => (
                    <ColorPreset
                      key={color}
                      style={{ 
                        backgroundColor: color,
                        border: selectedColor === color ? '3px solid var(--primary)' : '2px solid rgba(255, 255, 255, 0.2)'
                      }}
                      onClick={() => setSelectedColor(color)}
                      title={color}
                    />
                  ))}
                </ColorPresets>
              </div>
            </ColorPickerContainer>
            <ModalButtons>
              <ModalButton $variant="secondary" onClick={closeColorPicker}>
                Cancel
              </ModalButton>
              <ModalButton $variant="primary" onClick={applyColor}>
                Apply {colorPickerType === 'text' ? 'Text' : 'Background'} Color
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
} 