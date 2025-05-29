"use client";
import React, { useState, useRef } from "react";
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
  FaTextHeight
} from "react-icons/fa";

// Styled components for the visual editor
const ContentElementsBar = styled.div`
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  margin-bottom: 1.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(90deg, var(--accent), var(--primary));
  }
`;

const ContentElementButton = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(10px);
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.8rem;
  position: relative;
  overflow: hidden;
  min-width: 80px;
  text-align: center;

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
    border-radius: 10px;
  }

  &:hover {
    border-color: var(--primary);
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 10px 30px rgba(108, 99, 255, 0.3);
    
    &:before {
      opacity: 0.1;
    }
  }

  &:active {
    cursor: grabbing;
    transform: translateY(-1px) scale(0.98);
  }

  .icon {
    font-size: 1.4rem;
    z-index: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    color: var(--text);
  }

  .label {
    color: var(--text);
    font-weight: 600;
    z-index: 1;
    letter-spacing: 0.5px;
  }
`;

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

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }

  &:hover {
    background: ${props => props.active 
      ? 'linear-gradient(135deg, var(--accent), var(--primary))' 
      : 'rgba(255, 255, 255, 0.15)'};
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(108, 99, 255, 0.3);

    &:before {
      left: 100%;
    }
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
  overflow-y: auto;
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
  padding: 2.5rem;
  background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);
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

const DroppableArea = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isDragOver',
})<{ isDragOver: boolean }>`
  min-height: 50px;
  border: 2px dashed ${props => props.isDragOver ? 'var(--primary)' : 'transparent'};
  border-radius: 12px;
  background: ${props => props.isDragOver ? 'rgba(108, 99, 255, 0.1)' : 'transparent'};
  transition: all 0.3s ease;
  position: relative;
  margin: 1rem 0;

  &:before {
    content: '${props => props.isDragOver ? '✨ Drop here to add content' : ''}';
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

const EmailElement = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'editing',
})<{ selected: boolean; editing: boolean }>`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 2px solid ${props => props.selected ? 'var(--primary)' : 'transparent'};
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: pointer;
  background: ${props => props.selected ? 'rgba(108, 99, 255, 0.05)' : 'transparent'};

  &:hover {
    border-color: var(--primary);
    background: linear-gradient(135deg, rgba(108, 99, 255, 0.05) 0%, rgba(108, 99, 255, 0.02) 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(108, 99, 255, 0.15);
  }

  .element-controls {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    display: flex;
    gap: 0.5rem;
    opacity: ${props => props.selected ? 1 : 0};
    transition: opacity 0.3s ease;
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
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    background: var(--primary);
    color: white;
    transform: scale(1.1);
  }
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

const DropZone = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 4rem 2rem;
  border: 2px dashed rgba(108, 99, 255, 0.3);
  border-radius: 12px;
  background: rgba(108, 99, 255, 0.05);
  text-align: center;
  color: var(--text-secondary);

  span:first-child {
    font-size: 3rem;
  }

  span:nth-child(2) {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--text);
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
  overflow: hidden;
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
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [rightPanelState, setRightPanelState] = useState(rightPanelExpanded);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    setDraggedElement(elementType);
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', elementType);
    
    if (dragPreviewRef.current) {
      e.dataTransfer.setDragImage(dragPreviewRef.current, 0, 0);
    }
  };

  const handleDragEnd = () => {
    setDraggedElement(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverIndex(index ?? emailElements.length);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('text/plain');
    
    if (elementType && draggedElement) {
      const newElement = createNewElement(elementType);
      const insertIndex = index ?? emailElements.length;
      
      const newElements = [...emailElements];
      newElements.splice(insertIndex, 0, newElement);
      setEmailElements(newElements);
    }
    
    setDraggedElement(null);
    setDragOverIndex(null);
  };

  const createNewElement = (type: string) => {
    const id = type + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    switch (type) {
      case 'header':
        return { id, type: 'header', content: 'Your Header Text Here' };
      case 'text':
        return { id, type: 'text', content: 'Add your text content here. You can edit this by double-clicking.' };
      case 'button':
        return { id, type: 'button', content: 'Click Here', url: '#' };
      case 'image':
        return { id, type: 'image', src: 'https://via.placeholder.com/600x300/6c63ff/ffffff?text=🎵+Your+Image', alt: 'Image description' };
      case 'divider':
        return { id, type: 'divider' };
      case 'social':
        return { id, type: 'social', links: [
          { platform: 'facebook', url: '#' },
          { platform: 'twitter', url: '#' },
          { platform: 'instagram', url: '#' }
        ]};
      case 'spacer':
        return { id, type: 'spacer', height: '30px' };
      case 'columns':
        return { id, type: 'columns', columns: [
          { content: 'Column 1 content' },
          { content: 'Column 2 content' }
        ]};
      case 'video':
        return { id, type: 'video', thumbnail: 'https://via.placeholder.com/600x300/6c63ff/ffffff?text=▶️+Video', url: '#' };
      default:
        return { id, type: 'text', content: 'New element' };
    }
  };

  const removeElement = (elementId: string) => {
    setEmailElements(emailElements.filter(el => el.id !== elementId));
    setSelectedElementId(null);
    setEditingElementId(null);
  };

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
      const newContent = e.currentTarget.textContent || '';
      handleContentChange(element.id, newContent);
    };

    return (
      <EmailElement
        key={element.id}
        selected={isSelected}
        editing={isEditing}
        onClick={() => selectElement(element.id)}
        onDoubleClick={() => handleElementDoubleClick(element.id)}
      >
        <div className="element-controls">
          <ElementControl onClick={(e) => { e.stopPropagation(); startEditing(element.id); }}>
            <FaEdit size={12} />
          </ElementControl>
          <ElementControl onClick={(e) => { e.stopPropagation(); removeElement(element.id); }}>
            <FaTrash size={12} />
          </ElementControl>
        </div>

        {element.type === 'header' && (
          <EditableText
            editing={isEditing}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onInput={handleInput}
            style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#333',
              textAlign: 'center',
              marginBottom: '1rem'
            }}
          >
            {element.content}
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
            style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#333',
              marginBottom: '1rem'
            }}
          >
            {element.content}
          </EditableText>
        )}

        {element.type === 'button' && (
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
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
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
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
          </div>
        )}

        {element.type === 'divider' && (
          <div style={{ margin: '2rem 0', textAlign: 'center' }}>
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
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              {element.links?.map((link: any, idx: number) => (
                <a key={idx} href={link.url} style={{
                  display: 'flex',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#6c63ff',
                  color: 'white',
                  textDecoration: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2rem'
                }}>
                  {link.platform === 'facebook' && '📘'}
                  {link.platform === 'twitter' && '🐦'}
                  {link.platform === 'instagram' && '📷'}
                </a>
              ))}
            </div>
          </div>
        )}

        {element.type === 'columns' && (
          <div style={{ display: 'flex', gap: '2rem', margin: '2rem 0' }}>
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
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
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
      {/* Content Elements Toolbar */}
      <ContentElementsBar>
        <ContentElementButton 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'header')}
          onDragEnd={handleDragEnd}
        >
          <FaFont className="icon" />
          <span className="label">Header</span>
        </ContentElementButton>
        <ContentElementButton 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'text')}
          onDragEnd={handleDragEnd}
        >
          <FaFont className="icon" />
          <span className="label">Text Block</span>
        </ContentElementButton>
        <ContentElementButton 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'button')}
          onDragEnd={handleDragEnd}
        >
          <FaMousePointer className="icon" />
          <span className="label">Button</span>
        </ContentElementButton>
        <ContentElementButton 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'image')}
          onDragEnd={handleDragEnd}
        >
          <FaImage className="icon" />
          <span className="label">Image</span>
        </ContentElementButton>
        <ContentElementButton 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'divider')}
          onDragEnd={handleDragEnd}
        >
          <FaDivide className="icon" />
          <span className="label">Divider</span>
        </ContentElementButton>
        <ContentElementButton 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'social')}
          onDragEnd={handleDragEnd}
        >
          <FaShareAlt className="icon" />
          <span className="label">Social Links</span>
        </ContentElementButton>
        <ContentElementButton 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'spacer')}
          onDragEnd={handleDragEnd}
        >
          <FaExpandArrowsAlt className="icon" />
          <span className="label">Spacer</span>
        </ContentElementButton>
        <ContentElementButton 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'columns')}
          onDragEnd={handleDragEnd}
        >
          <FaColumns className="icon" />
          <span className="label">Columns</span>
        </ContentElementButton>
        <ContentElementButton 
          draggable 
          onDragStart={(e) => handleDragStart(e, 'video')}
          onDragEnd={handleDragEnd}
        >
          <FaVideo className="icon" />
          <span className="label">Video</span>
        </ContentElementButton>
      </ContentElementsBar>
      
      {/* Visual Email Canvas */}
      <div style={{ 
        display: 'flex',
        gap: '2rem', 
        minHeight: '600px',
        marginTop: '1rem'
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
          transition: 'all 0.3s ease'
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
              width: currentView === 'mobile' ? '375px' : currentView === 'text' ? '100%' : '600px',
              maxWidth: currentView === 'text' ? '500px' : 'none',
              backgroundColor: currentView === 'text' ? '#f8f9fa' : 'white',
              transition: 'all 0.3s ease'
            }}>
              {currentView === 'text' ? (
                // Text-only view
                <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: '1.6' }}>
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
                    Cymasphere Inc. | Unsubscribe | Privacy Policy
                  </div>
                </div>
              ) : (
                // Visual view (desktop/mobile)
                <>
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

                  <EmailBody
                    onDragOver={(e) => handleDragOver(e)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e)}
                  >
                    {/* Drop zone at the beginning */}
                    <DroppableArea 
                      isDragOver={draggedElement !== null && dragOverIndex === 0}
                      onDragOver={(e) => handleDragOver(e, 0)}
                      onDrop={(e) => handleDrop(e, 0)}
                    />
                    
                    {emailElements.map((element, index) => (
                      <React.Fragment key={element.id}>
                        {renderEmailElement(element, index)}
                        
                        {/* Drop zone between elements */}
                        <DroppableArea 
                          isDragOver={draggedElement !== null && dragOverIndex === index + 1}
                          onDragOver={(e) => handleDragOver(e, index + 1)}
                          onDrop={(e) => handleDrop(e, index + 1)}
                        />
                      </React.Fragment>
                    ))}
                    
                    {/* Final drop zone */}
                    {emailElements.length === 0 && (
                      <DropZone
                        onDragOver={(e) => handleDragOver(e)}
                        onDrop={(e) => handleDrop(e)}
                      >
                        <span>📦</span>
                        <span>Drop elements here to start building your email</span>
                        <small style={{ opacity: 0.7, fontSize: '0.85rem' }}>
                          Drag any element from the toolbar above to build your email
                        </small>
                      </DropZone>
                    )}
                  </EmailBody>

                  <EmailFooter>
                    <div style={{ textAlign: 'center', padding: '2rem', fontSize: '0.8rem', color: '#666' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <a href="#" style={{ color: '#6c63ff', textDecoration: 'none', margin: '0 1rem' }}>Facebook</a>
                        <a href="#" style={{ color: '#6c63ff', textDecoration: 'none', margin: '0 1rem' }}>Twitter</a>
                        <a href="#" style={{ color: '#6c63ff', textDecoration: 'none', margin: '0 1rem' }}>Instagram</a>
                      </div>
                      <div>
                        Cymasphere Inc. | <a href="#" style={{ color: '#999', textDecoration: 'none' }}>Unsubscribe</a> | <a href="#" style={{ color: '#999', textDecoration: 'none' }}>Privacy Policy</a>
                      </div>
                    </div>
                  </EmailFooter>
                </>
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
          overflow: 'hidden'
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
                    <ColorInput type="color" defaultValue="#ffffff" />
                  </ControlGroup>
                  <ControlGroup>
                    <ControlLabel>Content Width</ControlLabel>
                    <ControlSelect>
                      <option>600px (Standard)</option>
                      <option>500px (Narrow)</option>
                      <option>700px (Wide)</option>
                    </ControlSelect>
                  </ControlGroup>
                  <ControlGroup>
                    <ControlLabel>Font Family</ControlLabel>
                    <ControlSelect>
                      <option>Arial</option>
                      <option>Helvetica</option>
                      <option>Georgia</option>
                      <option>Times New Roman</option>
                    </ControlSelect>
                  </ControlGroup>
                  <ControlGroup>
                    <ControlLabel>Font Size</ControlLabel>
                    <ControlSelect>
                      <option>14px</option>
                      <option>16px (Recommended)</option>
                      <option>18px</option>
                      <option>20px</option>
                    </ControlSelect>
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
    </>
  );
} 