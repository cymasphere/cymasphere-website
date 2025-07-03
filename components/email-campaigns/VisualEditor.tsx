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
  FaList,
  FaListOl,
  FaYoutube,
  FaFacebookF,
  FaInstagram,
  FaDiscord
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
  padding: 2rem;
  overflow: visible;
  display: flex;
  justify-content: center;
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
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'editing',
})<{ selected: boolean; editing: boolean }>`
  margin: 0;
  padding: 0;
  border: 2px solid ${props => props.selected ? 'var(--primary)' : 'transparent'};
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: grab;
  overflow: visible;
  background: ${props => 
    props.editing ? 'rgba(108, 99, 255, 0.1)' :
    props.selected ? 'rgba(108, 99, 255, 0.05)' : 
    'transparent'
  };

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

  .element-controls {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.5rem;
    opacity: ${props => props.selected || props.editing ? 1 : 0};
    transition: opacity 0.3s ease;
    z-index: 10;
  }

  &:hover .element-controls {
    opacity: 1;
  }

  &::before {
    content: ${props => props.selected ? '"✨ Selected"' : '""'};
    position: absolute;
    top: -8px;
    left: 12px;
    background: var(--primary);
    color: white;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
    opacity: ${props => props.selected ? 1 : 0};
    transform: ${props => props.selected ? 'translateY(0)' : 'translateY(-5px)'};
    transition: all 0.3s ease;
    z-index: 5;
    pointer-events: none;
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
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 40px;
  background: rgba(108, 99, 255, 0.9);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  opacity: 0.3;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 50;
  color: white;
  user-select: none;
  border: 2px solid rgba(255, 255, 255, 0.3);
  
  &:hover {
    opacity: 1 !important;
    background: var(--primary);
    transform: translateY(-50%) scale(1.1);
    box-shadow: 0 6px 20px rgba(108, 99, 255, 0.4);
    cursor: grab;
  }
  
  &:active {
    transform: translateY(-50%) scale(0.95);
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

const EditableText = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'editing',
})<{ editing: boolean }>`
  outline: ${props => props.editing ? '2px solid var(--primary)' : 'none'};
  border-radius: 4px;
  padding: ${props => props.editing ? '0.5rem' : '0'};
  background: ${props => props.editing ? 'rgba(108, 99, 255, 0.1)' : 'transparent'};
  transition: all 0.3s ease;

  &:focus {
    outline: 2px solid var(--primary);
    background: rgba(108, 99, 255, 0.1);
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
  position: relative;
  overflow: visible;
  backdrop-filter: blur(10px);

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    opacity: 0;
    transition: opacity 0.3s ease;
    border-radius: 23px;
  }

  &:hover {
    border-color: var(--primary);
    color: var(--text);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(108, 99, 255, 0.25);

    &:before {
      opacity: 0.15;
    }
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
  background: rgba(108, 99, 255, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
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
  const [currentView, setCurrentView] = useState<'desktop' | 'mobile' | 'text'>('desktop');
  
  // Element reordering state
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [draggedElementIndex, setDraggedElementIndex] = useState<number | null>(null);
  const [elementDragOverIndex, setElementDragOverIndex] = useState<number | null>(null);
  
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [rightPanelState, setRightPanelState] = useState(rightPanelExpanded);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  // ✨ NEW: Design settings state
  const [designSettings, setDesignSettings] = useState({
    backgroundColor: '#ffffff',
    contentWidth: '600px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '16px',
    primaryColor: '#6c63ff',
    textColor: '#333333'
  });

  // ✨ NEW: Rich text formatting state
  const [showFormattingToolbar, setShowFormattingToolbar] = useState(false);
  const [textSelection, setTextSelection] = useState<Selection | null>(null);
  
  // ✨ NEW: Image upload state
  const [imageUploadElement, setImageUploadElement] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✨ NEW: Update design setting
  const updateDesignSetting = (key: string, value: string) => {
    setDesignSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // ✨ NEW: Rich text formatting functions
  const applyFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    setShowFormattingToolbar(false);
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      setTextSelection(selection);
      setShowFormattingToolbar(true);
    } else {
      setShowFormattingToolbar(false);
    }
  };

  // ✨ NEW: Image upload functions
  const handleImageUpload = (elementId: string) => {
    setImageUploadElement(elementId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && imageUploadElement) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        updateElement(imageUploadElement, { src });
        setImageUploadElement(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageDrop = (e: React.DragEvent, elementId: string) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const src = event.target?.result as string;
          updateElement(elementId, { src });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Element reordering drag handlers
  const handleElementDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Only show drop indicator if we're dragging an element (not adding a new one)
    if (draggedElementId) {
      setElementDragOverIndex(index);
    }
  };

  const handleElementDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    console.log('💧 Drop attempted at index:', dropIndex);
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
    
    // ✨ NEW: Base element with padding properties
    const baseElement = {
      id,
      type,
      paddingTop: 16,    // Default 16px top padding
      paddingBottom: 16  // Default 16px bottom padding  
    };
    
    switch (type) {
      case 'header':
        return { ...baseElement, content: 'Your Header Text Here' };
      case 'text':
        return { ...baseElement, content: 'Add your text content here. You can edit this by double-clicking.' };
      case 'button':
        return { ...baseElement, content: 'Click Here', url: '#' };
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
    if (e.key === 'Delete' && selectedElementId && editingElementId !== selectedElementId) {
      e.preventDefault();
      removeElement(selectedElementId);
    }
    
    // Ctrl+D / Cmd+D - duplicate selected element
    if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElementId) {
      e.preventDefault();
      duplicateElement(selectedElementId);
    }
    
    // Escape key - deselect element
    if (e.key === 'Escape') {
      e.preventDefault();
    setSelectedElementId(null);
    setEditingElementId(null);
    }
  }, [selectedElementId, editingElementId]);

  // ✨ NEW: Add keyboard event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const selectElement = (elementId: string) => {
    setSelectedElementId(elementId);
    setEditingElementId(null);
  };

  const startEditing = (elementId: string) => {
    setEditingElementId(elementId);
    setSelectedElementId(elementId);
  };

  const stopEditing = () => {
    setEditingElementId(null);
  };

  const handleElementDoubleClick = (elementId: string) => {
    startEditing(elementId);
  };

  const handleContentChange = (elementId: string, newContent: string) => {
    setEmailElements(emailElements.map(el => 
      el.id === elementId ? { ...el, content: newContent } : el
    ));
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

  const renderEmailElement = (element: any, index: number) => {
    const isSelected = selectedElementId === element.id;
    const isEditing = editingElementId === element.id;

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        stopEditing();
      }
    };

    const handleBlur = () => {
      stopEditing();
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
      handleContentChange(element.id, e.currentTarget.textContent || '');
    };

    const handleDragStart = (e: React.DragEvent) => {
      console.log('🚀 DRAG START - Element:', element.id, 'Index:', index, 'Type:', element.type);
      console.log('🚀 Event target:', e.target);
      console.log('🚀 Current target:', e.currentTarget);
      e.stopPropagation();
      
      // Set drag data
      setDraggedElementId(element.id);
      setDraggedElementIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/element-id', element.id);
      e.dataTransfer.setData('text/element-index', index.toString());
      
      // Change cursor
      document.body.style.cursor = 'grabbing';
      console.log('✅ Drag data set successfully for element:', element.id);
    };

    const handleDragEnd = (e: React.DragEvent) => {
      console.log('🎯 DRAG END - Element:', element.id);
      console.log('🎯 Event target:', e.target);
      e.stopPropagation();
      
      // Reset drag state
      setDraggedElementId(null);
      setDraggedElementIndex(null);
      setElementDragOverIndex(null);
      
      // Reset cursor
      document.body.style.cursor = '';
      console.log('✅ Drag ended, state cleared for element:', element.id);
    };

    const handleClickCapture = (e: React.MouseEvent) => {
      // Prevent drag handle from interfering with element selection
      if (!(e.target as Element).closest('.drag-handle')) {
        selectElement(element.id);
      }
    };

    const handleDoubleClickCapture = (e: React.MouseEvent) => {
      // Prevent drag handle from interfering with editing
      if (!(e.target as Element).closest('.drag-handle')) {
        handleElementDoubleClick(element.id);
      }
    };

    return (
      <EmailElement
        key={element.id}
        selected={isSelected}
        editing={isEditing}
        draggable={true}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onClickCapture={handleClickCapture}
        onDoubleClickCapture={handleDoubleClickCapture}
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
          cursor: draggedElementId === element.id ? 'grabbing' : 'grab'
        }}
      >
        <div className="element-controls">
          <ElementControl onClick={(e) => { e.stopPropagation(); startEditing(element.id); }} title="Edit">
            <FaEdit size={12} />
          </ElementControl>
          <ElementControl onClick={(e) => { e.stopPropagation(); duplicateElement(element.id); }} title="Duplicate">
            <FaCopy size={12} />
          </ElementControl>
          <ElementControl onClick={(e) => { e.stopPropagation(); removeElement(element.id); }} title="Delete">
            <FaTrash size={12} />
          </ElementControl>
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
          style={{ userSelect: 'none' }}
        >
          <FaGripVertical size={14} style={{ pointerEvents: 'none', userSelect: 'none' }} />
        </DragHandle>
        {element.type === 'header' && (
          <EditableText
            editing={isEditing}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onInput={handleInput}
            onMouseUp={isEditing ? handleTextSelect : undefined}
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center',
              margin: 0,
              position: 'relative'
            }}
          >
            {element.content}
            {/* ✨ NEW: Rich text formatting toolbar */}
            {isEditing && (
              <FormattingToolbar className={showFormattingToolbar ? 'show' : ''}>
                <FormatButton onClick={() => applyFormat('bold')} title="Bold">
                  <FaBold />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('italic')} title="Italic">
                  <FaItalic />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('underline')} title="Underline">
                  <FaUnderline />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('justifyLeft')} title="Align Left">
                  <FaAlignLeft />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('justifyCenter')} title="Align Center">
                  <FaAlignCenter />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('justifyRight')} title="Align Right">
                  <FaAlignRight />
                </FormatButton>
                <FormatButton onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) applyFormat('createLink', url);
                }} title="Add Link">
                  <FaLink />
                </FormatButton>
              </FormattingToolbar>
            )}
          </EditableText>
        )}
        {element.type === 'text' && (
          <EditableText
            editing={isEditing}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onInput={handleInput}
            onMouseUp={isEditing ? handleTextSelect : undefined}
            style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#333',
              margin: 0,
              position: 'relative'
            }}
          >
            {element.content}
            {/* ✨ NEW: Rich text formatting toolbar */}
            {isEditing && (
              <FormattingToolbar className={showFormattingToolbar ? 'show' : ''}>
                <FormatButton onClick={() => applyFormat('bold')} title="Bold">
                  <FaBold />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('italic')} title="Italic">
                  <FaItalic />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('underline')} title="Underline">
                  <FaUnderline />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('insertUnorderedList')} title="Bullet List">
                  <FaList />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('insertOrderedList')} title="Numbered List">
                  <FaListOl />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('justifyLeft')} title="Align Left">
                  <FaAlignLeft />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('justifyCenter')} title="Align Center">
                  <FaAlignCenter />
                </FormatButton>
                <FormatButton onClick={() => applyFormat('justifyRight')} title="Align Right">
                  <FaAlignRight />
                </FormatButton>
                <FormatButton onClick={() => {
                  const url = prompt('Enter URL:');
                  if (url) applyFormat('createLink', url);
                }} title="Add Link">
                  <FaLink />
                </FormatButton>
                <FormatButton onClick={() => {
                  const color = prompt('Enter color (e.g., #ff0000):');
                  if (color) applyFormat('foreColor', color);
                }} title="Text Color">
                  <FaPalette />
                </FormatButton>
              </FormattingToolbar>
            )}
          </EditableText>
        )}
        {element.type === 'button' && (
          <div style={{ textAlign: 'center', margin: 0 }}>
            <EditableText
              editing={isEditing}
              contentEditable={isEditing}
              suppressContentEditableWarning={true}
              onKeyDown={handleKeyDown}
              onBlur={handleBlur}
              onInput={handleInput}
              style={{
                display: 'inline-block',
                padding: '1.25rem 2.5rem',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '50px',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '0 8px 25px rgba(108, 99, 255, 0.3)'
              }}
            >
              {element.content}
            </EditableText>
          </div>
        )}
        {element.type === 'image' && (
          <div style={{ textAlign: 'center', margin: 0, position: 'relative' }}>
            {element.src ? (
              <div style={{ position: 'relative' }}>
            <img 
              src={element.src} 
              alt={element.alt || 'Email image'} 
              style={{ 
                maxWidth: '100%', 
                height: 'auto', 
                borderRadius: '8px',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
              }} 
            />
                {/* ✨ NEW: Image upload overlay when selected */}
                {isSelected && (
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
                onClick={() => handleImageUpload(element.id)}
                onDrop={(e) => handleImageDrop(e, element.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add('dragover');
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove('dragover');
                }}
              >
                <FaCloudUploadAlt size={48} style={{ color: '#6c63ff', marginBottom: '1rem' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  Upload an Image
                </div>
                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  Click to browse or drag and drop
                </div>
                <div style={{ fontSize: '0.8rem', color: '#999' }}>
                  Supports JPG, PNG, GIF (max 5MB)
                </div>
              </ImageUploadArea>)
            )}
          </div>
        )}
        {element.type === 'divider' && (
          <div style={{ margin: 0, textAlign: 'center' }}>
            <div style={{
              height: '2px',
              background: 'linear-gradient(90deg, transparent, #ddd, transparent)',
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
                    const newColumns = [...element.columns];
                    newColumns[idx] = { ...newColumns[idx], content: e.currentTarget.textContent || '' };
                    updateElement(element.id, { columns: newColumns });
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
      </EmailElement>
    );
  };

  return (
    <>
      {/* Visual Email Canvas */}
      <div style={{ 
        display: 'flex',
        gap: '2rem', 
        minHeight: '600px',
        marginTop: '1rem',
        overflow: 'visible'
      }}>
        
        {/* Visual Email Canvas - Left */}
        <div style={{ 
          flex: rightPanelState ? '1' : '1 1 auto',
          display: 'flex', 
          flexDirection: 'column',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
          borderRadius: '16px',
          padding: '1rem',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          alignSelf: 'flex-start',
          transition: 'all 0.3s ease',
          overflow: 'visible'
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
              width: currentView === 'mobile' ? '375px' : currentView === 'text' ? '100%' : designSettings.contentWidth,
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
                  {emailElements.map((element, index) => (
                    <div key={element.id} style={{ marginBottom: '1rem' }}>
                      {element.type === 'header' && <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{element.content}</div>}
                      {element.type === 'text' && <div>{element.content}</div>}
                      {element.type === 'button' && <div style={{ padding: '0.5rem', border: '1px solid #ddd', display: 'inline-block' }}>[BUTTON: {element.content}]</div>}
                      {element.type === 'image' && <div style={{ fontStyle: 'italic' }}>[IMAGE: {element.src}]</div>}
                      {element.type === 'divider' && <div>{'─'.repeat(50)}</div>}
                      {element.type === 'spacer' && <div style={{ height: element.height || '20px' }}></div>}
                    </div>
                  ))}
                  <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #ddd', fontSize: '0.8rem', color: '#666' }}>
                    Cymasphere by NNAudio | Unsubscribe | Privacy Policy
                  </div>
                </div>)
              ) : (
                // Visual view (desktop/mobile)
                (<>
                  <EmailHeader>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <div style={{ 
                        width: '60px', 
                        height: '60px', 
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        borderRadius: '50%',
                        margin: '0 auto 1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                        color: 'white'
                      }}>
                        🎵
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#666', fontWeight: '500' }}>
                        Having trouble viewing this email? <a href="#" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: '600' }}>View in browser</a>
                      </div>
                    </div>
                  </EmailHeader>
                  <EmailBody>
                    {emailElements.map((element, index) => (
                      <React.Fragment key={element.id}>
                        {/* Element reordering drop zone at the beginning */}
                        {index === 0 && draggedElementId && (
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
                        {draggedElementId && (
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
                        )}
                      </React.Fragment>
                    ))}
                    
                    {/* Empty state */}
                    {emailElements.length === 0 && (
                      <div style={{
                        textAlign: 'center',
                        padding: '4rem 2rem',
                        color: '#666',
                        fontSize: '1.1rem'
                      }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem' }}>
                          Start Building Your Email
                        </div>
                        <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>
                          Your email content will appear here as you add elements
                        </div>
                      </div>
                    )}
                  </EmailBody>
                  <EmailFooter>
                    <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.8rem', color: '#666' }}>
                      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                        <a href="#" style={{ 
                          color: '#6c63ff', 
                          textDecoration: 'none', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          transition: 'all 0.3s ease'
                        }}>
                          <FaFacebookF size={16} />
                        </a>
                        <a href="#" style={{ 
                          color: '#6c63ff', 
                          textDecoration: 'none',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          transition: 'all 0.3s ease'
                        }}>
                          <FaXTwitter size={16} />
                        </a>
                        <a href="#" style={{ 
                          color: '#6c63ff', 
                          textDecoration: 'none',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          transition: 'all 0.3s ease'
                        }}>
                          <FaInstagram size={16} />
                        </a>
                        <a href="#" style={{ 
                          color: '#6c63ff', 
                          textDecoration: 'none',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          transition: 'all 0.3s ease'
                        }}>
                          <FaYoutube size={16} />
                        </a>
                        <a href="#" style={{ 
                          color: '#6c63ff', 
                          textDecoration: 'none',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          padding: '0.5rem',
                          borderRadius: '6px',
                          transition: 'all 0.3s ease'
                        }}>
                          <FaDiscord size={16} />
                        </a>
                      </div>
                      <div>
                        Cymasphere by NNAudio | <a href="#" style={{ color: '#999', textDecoration: 'none' }}>Unsubscribe</a> | <a href="#" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</a>
                      </div>
                    </div>
                  </EmailFooter>
                </>)
              )}
            </EmailContainer>
          </EmailCanvas>
        </div>

        {/* Settings Panels - Right */}
        <div style={{ 
          width: rightPanelState ? '400px' : '60px',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '1.5rem', 
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
          borderRadius: '16px',
          padding: rightPanelState ? '1rem' : '0.5rem',
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
                    <ControlLabel>Content Width</ControlLabel>
                    <ControlSelect 
                      value={designSettings.contentWidth}
                      onChange={(e) => updateDesignSetting('contentWidth', e.target.value)}
                    >
                      <option value="500px">500px (Narrow)</option>
                      <option value="600px">600px (Standard)</option>
                      <option value="700px">700px (Wide)</option>
                      <option value="800px">800px (Extra Wide)</option>
                    </ControlSelect>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <VariableTag>{'{{firstName}}'}</VariableTag>
                  <VariableTag>{'{{lastName}}'}</VariableTag>
                  <VariableTag>{'{{email}}'}</VariableTag>
                  <VariableTag>{'{{companyName}}'}</VariableTag>
                  <VariableTag>{'{{unsubscribeUrl}}'}</VariableTag>
                  <VariableTag>{'{{currentDate}}'}</VariableTag>
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
    </>
  );
} 