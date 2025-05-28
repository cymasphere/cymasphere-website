"use client";
import React, { useState, useEffect, useRef } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaEnvelopeOpen, 
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaUsers,
  FaPalette,
  FaEdit,
  FaCalendarAlt,
  FaEye,
  FaSave,
  FaPaperPlane,
  FaChevronRight,
  FaInfoCircle,
  FaFilter,
  FaTag,
  FaImage,
  FaCode,
  FaClock,
  FaPlay
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import Link from "next/link";

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
  
  ${props => {
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
  background-color: ${props => props.completed ? '#28a745' : 'rgba(255, 255, 255, 0.1)'};
  transition: background-color 0.3s ease;

  @media (max-width: 768px) {
    width: 20px;
  }
`;

const StepContent = styled(motion.div)`
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

const AudienceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const AudienceCard = styled.div<{ selected: boolean }>`
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid ${props => props.selected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  background-color: ${props => props.selected ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--primary);
    background-color: rgba(108, 99, 255, 0.05);
  }
`;

const AudienceTitle = styled.h4`
  color: var(--text);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AudienceDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const AudienceStats = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const TemplateGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const TemplateCard = styled.div<{ selected: boolean }>`
  border-radius: 8px;
  border: 2px solid ${props => props.selected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  background-color: ${props => props.selected ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;

  &:hover {
    border-color: var(--primary);
    background-color: rgba(108, 99, 255, 0.05);
  }
`;

const TemplatePreview = styled.div`
  height: 150px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.9rem;
`;

const TemplateInfo = styled.div`
  padding: 1rem;
`;

const TemplateTitle = styled.h4`
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const TemplateDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.8rem;
`;

const ContentEditor = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  min-height: 400px;
  margin-bottom: 2rem;
`;

const EditorToolbar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
`;

const ToolbarButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: ${props => props.active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;

  &:hover {
    background-color: ${props => props.active ? 'var(--accent)' : 'rgba(255, 255, 255, 0.2)'};
    color: ${props => props.active ? 'white' : 'var(--text)'};
  }
`;

const EditorContent = styled.div`
  padding: 1rem;
  min-height: 300px;
`;

const ScheduleOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const ScheduleOption = styled.div<{ selected: boolean }>`
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid ${props => props.selected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  background-color: ${props => props.selected ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;

  &:hover {
    border-color: var(--primary);
    background-color: rgba(108, 99, 255, 0.05);
  }
`;

const ScheduleIcon = styled.div`
  font-size: 2rem;
  color: var(--primary);
  margin-bottom: 1rem;
`;

const ScheduleTitle = styled.h4`
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const ScheduleDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
`;

const NavButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
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
      case 'primary':
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

const PreviewSection = styled.div`
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const PreviewTitle = styled.h3`
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const PreviewContent = styled.div`
  background-color: white;
  color: #333;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const ContentBlock = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.75rem 0.5rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  text-align: center;

  &:hover {
    border-color: var(--primary);
    background-color: rgba(108, 99, 255, 0.05);
  }

  span:first-child {
    font-size: 1.2rem;
  }

  span:last-child {
    color: var(--text-secondary);
    font-weight: 500;
  }
`;

const VariableButton = styled.button`
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.02);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  text-align: left;

  &:hover {
    border-color: var(--primary);
    background-color: rgba(108, 99, 255, 0.05);
    color: var(--text);
  }
`;

const DragElement = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 12px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  backdrop-filter: blur(10px);
  cursor: grab;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  position: relative;
  overflow: hidden;

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

  span:first-child {
    font-size: 1.4rem;
    z-index: 1;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  }

  span:last-child {
    color: var(--text);
    font-weight: 600;
    z-index: 1;
    letter-spacing: 0.5px;
  }
`;

const ViewToggle = styled.button<{ active: boolean }>`
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

const EmailBlock = styled.div`
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 2px dashed transparent;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  cursor: pointer;

  &:hover {
    border-color: var(--primary);
    background: linear-gradient(135deg, rgba(108, 99, 255, 0.05) 0%, rgba(108, 99, 255, 0.02) 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(108, 99, 255, 0.15);
  }

  &:before {
    content: '✏️';
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-size: 1rem;
  }

  &:hover:before {
    opacity: 1;
  }
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

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.6s ease;
  }

  &:hover {
    transform: translateY(-4px) scale(1.05);
    box-shadow: 0 15px 40px rgba(108, 99, 255, 0.4);
    background: linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%);

    &:before {
      left: 100%;
    }
  }

  &:active {
    transform: translateY(-2px) scale(1.02);
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
  position: relative;
  overflow: hidden;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(108, 99, 255, 0.05) 0%, rgba(108, 99, 255, 0.02) 100%);
    opacity: 0;
    transition: opacity 0.4s ease;
    border-radius: 13px;
  }

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    transform: translateY(-3px);
    box-shadow: 0 12px 35px rgba(108, 99, 255, 0.2);

    &:before {
      opacity: 1;
    }
  }

  span:first-child {
    font-size: 3rem;
    opacity: 0.6;
    transition: all 0.4s ease;
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
  }

  &:hover span:first-child {
    opacity: 1;
    transform: scale(1.1);
  }

  span:last-child {
    font-weight: 600;
    letter-spacing: 0.5px;
  }
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

const PreviewButton = styled.button`
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.9rem;
  font-weight: 600;
  width: 100%;
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
    border-radius: 10px;
  }

  &:hover {
    border-color: var(--primary);
    color: var(--text);
    transform: translateY(-3px);
    box-shadow: 0 10px 30px rgba(108, 99, 255, 0.3);

    &:before {
      opacity: 0.1;
    }
  }

  &:active {
    transform: translateY(-1px);
  }
`;

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
`;

const PanelTitle = styled.h4`
  color: var(--text);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  margin: 0;
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

const ToggleSwitch = styled.div`
  position: relative;
  width: 60px;
  height: 32px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
  border-radius: 20px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;

  &:before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 24px;
    height: 24px;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    border-radius: 50%;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &:hover {
    border-color: var(--primary);
    transform: scale(1.05);
  }

  &.active {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    border-color: var(--primary);

    &:before {
      transform: translateX(28px);
      background: white;
    }
  }
`;

const DroppableArea = styled.div<{ isDragOver: boolean }>`
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

const EmailElement = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.02);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: var(--primary);
    background: rgba(108, 99, 255, 0.05);
  }

  &:before {
    content: '⚙️';
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:before {
    opacity: 1;
  }
`;

// Mock data
const audienceSegments = [
  {
    id: "all",
    title: "All Subscribers",
    description: "Send to all active subscribers",
    count: 12890,
    engagement: "Mixed"
  },
  {
    id: "active",
    title: "Highly Engaged",
    description: "Subscribers who opened emails in the last 30 days",
    count: 4567,
    engagement: "High"
  },
  {
    id: "new",
    title: "New Subscribers",
    description: "Subscribers who joined in the last 7 days",
    count: 234,
    engagement: "Unknown"
  },
  {
    id: "inactive",
    title: "Re-engagement",
    description: "Subscribers who haven't opened emails in 60+ days",
    count: 1890,
    engagement: "Low"
  }
];

const templates = [
  {
    id: "newsletter",
    title: "Newsletter Template",
    description: "Clean layout for regular updates",
    preview: "📰 Newsletter Layout"
  },
  {
    id: "promotional",
    title: "Promotional Template",
    description: "Eye-catching design for sales and offers",
    preview: "🎯 Promotional Design"
  },
  {
    id: "welcome",
    title: "Welcome Template",
    description: "Warm welcome message for new users",
    preview: "👋 Welcome Message"
  },
  {
    id: "custom",
    title: "Custom Template",
    description: "Start from scratch with a blank template",
    preview: "✨ Custom Design"
  }
];

interface CampaignData {
  name: string;
  subject: string;
  description: string;
  audience: string;
  template: string;
  content: string;
  scheduleType: string;
  scheduleDate: string;
  scheduleTime: string;
}

// Mock campaigns data for editing
const mockCampaigns = [
  {
    id: "1",
    name: "Welcome Series",
    subject: "Welcome to Cymasphere! 🎵",
    description: "Automated welcome email sequence for new subscribers",
    audience: "new",
    template: "welcome",
    content: `
      <h2>Welcome to Cymasphere!</h2>
      <p>We're excited to have you join our community of music creators and synthesizer enthusiasts.</p>
      <p>Here's what you can expect:</p>
      <ul>
        <li>Access to our powerful web-based synthesizer</li>
        <li>Regular updates on new features and sounds</li>
        <li>Tips and tutorials from our team</li>
      </ul>
      <p>Get started by exploring our synthesizer and creating your first track!</p>
    `,
    scheduleType: "immediate",
    scheduleDate: "",
    scheduleTime: ""
  },
  {
    id: "2",
    name: "Product Launch Announcement",
    subject: "🚀 New Synthesizer Features Available Now!",
    description: "Announcing our latest synthesizer features",
    audience: "active",
    template: "promotional",
    content: `
      <h2>Exciting New Features Just Launched! 🚀</h2>
      <p>We've been working hard to bring you some amazing new synthesizer capabilities...</p>
    `,
    scheduleType: "scheduled",
    scheduleDate: "2024-02-01",
    scheduleTime: "10:00"
  },
  {
    id: "3",
    name: "Monthly Newsletter",
    subject: "🎵 This Month in Music Production",
    description: "Regular updates and tips for music producers",
    audience: "all",
    template: "newsletter",
    content: `
      <h2>This Month in Music Production</h2>
      <p>Here are the latest tips, tricks, and updates from the world of electronic music...</p>
    `,
    scheduleType: "draft",
    scheduleDate: "",
    scheduleTime: ""
  },
  {
    id: "4",
    name: "Re-engagement Campaign",
    subject: "We Miss You! Come Back and Create 🎶",
    description: "Win back inactive subscribers",
    audience: "inactive",
    template: "custom",
    content: `
      <h2>We Miss You!</h2>
      <p>It's been a while since we've seen you creating music with Cymasphere...</p>
    `,
    scheduleType: "trigger",
    scheduleDate: "",
    scheduleTime: ""
  }
];

function CreateCampaignPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditMode = Boolean(editId);
  
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [rightPanelExpanded, setRightPanelExpanded] = useState(true);
  
  // Initialize email elements based on campaign content
  const getInitialEmailElements = () => {
    if (isEditMode && editId) {
      const existingCampaign = mockCampaigns.find(c => c.id === editId);
      if (existingCampaign && existingCampaign.content) {
        // Convert HTML content to email elements for the visual editor
        // This is a simplified version - in a real app you'd parse the HTML properly
        return [
          { id: 'header', type: 'header', content: existingCampaign.subject },
          { id: 'text1', type: 'text', content: existingCampaign.content.replace(/<[^>]*>/g, '') },
          { id: 'button', type: 'button', content: '🚀 Get Started Now', url: '#' }
        ];
      }
    }
    return [
      { id: 'header', type: 'header', content: 'Welcome to Cymasphere! 🎵' },
      { id: 'text1', type: 'text', content: 'Hi {{firstName}}, Thank you for joining our community...' },
      { id: 'button', type: 'button', content: '🚀 Get Started Now', url: '#' },
      { id: 'image', type: 'image', src: 'https://via.placeholder.com/600x300/6c63ff/ffffff?text=🎵+Create+Amazing+Music' }
    ];
  };

  const [emailElements, setEmailElements] = useState<any[]>(getInitialEmailElements());
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);
  
  // Initialize campaign data based on edit mode
  const getInitialCampaignData = () => {
    if (isEditMode && editId) {
      const existingCampaign = mockCampaigns.find(c => c.id === editId);
      if (existingCampaign) {
        return existingCampaign;
      }
    }
    return {
      name: "",
      subject: "",
      description: "",
      audience: "",
      template: "",
      content: "",
      scheduleType: "",
      scheduleDate: "",
      scheduleTime: ""
    };
  };
  
  const [campaignData, setCampaignData] = useState<CampaignData>(getInitialCampaignData());
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  const steps = [
    { number: 1, title: "Campaign Setup", icon: FaInfoCircle },
    { number: 2, title: "Content", icon: FaEdit },
    { number: 3, title: "Review & Schedule", icon: FaEye }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSave = () => {
    console.log(isEditMode ? "Updating campaign:" : "Saving campaign:", campaignData);
    // Implement save logic here
  };

  const handleSend = () => {
    console.log(isEditMode ? "Updating and sending campaign:" : "Sending campaign:", campaignData);
    // Implement send logic here
    router.push("/admin/email-campaigns/campaigns");
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, elementType: string) => {
    setDraggedElement(elementType);
    e.dataTransfer.setData('text/plain', elementType);
    e.dataTransfer.effectAllowed = 'copy';
    
    // Create custom drag image
    if (dragPreviewRef.current) {
      dragPreviewRef.current.textContent = `Adding ${elementType}...`;
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
    if (index !== undefined) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index?: number) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('text/plain');
    
    if (elementType) {
      const newElement = createNewElement(elementType);
      const newElements = [...emailElements];
      
      if (index !== undefined) {
        newElements.splice(index, 0, newElement);
      } else {
        newElements.push(newElement);
      }
      
      setEmailElements(newElements);
    }
    
    setDragOverIndex(null);
    setDraggedElement(null);
  };

  const createNewElement = (type: string) => {
    const id = `${type}_${Date.now()}`;
    
    switch (type) {
      case 'header':
        return { id, type: 'header', content: 'New Header' };
      case 'text':
        return { id, type: 'text', content: 'Add your text content here...' };
      case 'button':
        return { id, type: 'button', content: 'Click Here', url: '#' };
      case 'image':
        return { id, type: 'image', src: 'https://via.placeholder.com/600x200/6c63ff/ffffff?text=New+Image' };
      case 'divider':
        return { id, type: 'divider' };
      case 'spacer':
        return { id, type: 'spacer', height: '20px' };
      default:
        return { id, type: 'text', content: 'New Element' };
    }
  };

  const removeElement = (elementId: string) => {
    setEmailElements(emailElements.filter(el => el.id !== elementId));
  };

  const renderEmailElement = (element: any, index: number) => {
    switch (element.type) {
      case 'header':
        return (
          <EmailElement key={element.id} onClick={() => console.log('Edit element:', element.id)}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              color: '#333', 
              marginBottom: '1rem', 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #333, #666)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800'
            }}>
              {element.content}
            </h1>
          </EmailElement>
        );
      
      case 'text':
        return (
          <EmailElement key={element.id} onClick={() => console.log('Edit element:', element.id)}>
            <p style={{ fontSize: '1rem', lineHeight: '1.7', color: '#555', marginBottom: '1.5rem' }}>
              {element.content}
            </p>
          </EmailElement>
        );
      
      case 'button':
        return (
          <EmailElement key={element.id} onClick={() => console.log('Edit element:', element.id)}>
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <EmailButton>
                {element.content}
              </EmailButton>
            </div>
          </EmailElement>
        );
      
      case 'image':
        return (
          <EmailElement key={element.id} onClick={() => console.log('Edit element:', element.id)}>
            <div style={{ 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}>
              <img 
                src={element.src} 
                alt="Email content" 
                style={{ width: '100%', display: 'block' }}
              />
            </div>
          </EmailElement>
        );
      
      case 'divider':
        return (
          <EmailElement key={element.id} onClick={() => console.log('Edit element:', element.id)}>
            <hr style={{ 
              border: 'none', 
              height: '2px', 
              background: 'linear-gradient(90deg, transparent, #ddd, transparent)',
              margin: '2rem 0'
            }} />
          </EmailElement>
        );
      
      case 'spacer':
        return (
          <EmailElement key={element.id} onClick={() => console.log('Edit element:', element.id)}>
            <div style={{ height: element.height || '20px', background: 'rgba(108, 99, 255, 0.1)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: 'var(--primary)' }}>
              Spacer ({element.height || '20px'})
            </div>
          </EmailElement>
        );
      
      default:
        return null;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepContent variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <StepTitle>
              <FaInfoCircle />
              Campaign Setup
            </StepTitle>
            <StepDescription>
              Set up your campaign details, select your audience, and choose a template.
            </StepDescription>
            
            {/* Campaign Details Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaInfoCircle style={{ color: 'var(--primary)' }} />
                Campaign Details
              </h3>
            <FormGrid>
              <FormGroup>
                <Label>Campaign Name</Label>
                <Input
                  type="text"
                  value={campaignData.name}
                  onChange={(e) => setCampaignData({...campaignData, name: e.target.value})}
                  placeholder="Enter campaign name"
                />
              </FormGroup>
              <FormGroup>
                <Label>Email Subject</Label>
                <Input
                  type="text"
                  value={campaignData.subject}
                  onChange={(e) => setCampaignData({...campaignData, subject: e.target.value})}
                  placeholder="Enter email subject line"
                />
              </FormGroup>
            </FormGrid>
            <FormGroup>
              <Label>Campaign Description</Label>
              <TextArea
                value={campaignData.description}
                onChange={(e) => setCampaignData({...campaignData, description: e.target.value})}
                placeholder="Describe the purpose of this campaign"
              />
            </FormGroup>
            </div>

            {/* Audience Selection Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaUsers style={{ color: 'var(--primary)' }} />
              Select Audience
              </h3>
            <AudienceGrid>
              {audienceSegments.map((segment) => (
                <AudienceCard
                  key={segment.id}
                  selected={campaignData.audience === segment.id}
                  onClick={() => setCampaignData({...campaignData, audience: segment.id})}
                >
                  <AudienceTitle>
                    <FaUsers />
                    {segment.title}
                  </AudienceTitle>
                  <AudienceDescription>{segment.description}</AudienceDescription>
                  <AudienceStats>
                    <span>{segment.count.toLocaleString()} subscribers</span>
                    <span>{segment.engagement} engagement</span>
                  </AudienceStats>
                </AudienceCard>
              ))}
            </AudienceGrid>
            </div>

            {/* Template Selection Section */}
            <div>
              <h3 style={{ color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaPalette style={{ color: 'var(--primary)' }} />
              Choose Template
              </h3>
            <TemplateGrid>
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  selected={campaignData.template === template.id}
                  onClick={() => setCampaignData({...campaignData, template: template.id})}
                >
                  <TemplatePreview>{template.preview}</TemplatePreview>
                  <TemplateInfo>
                    <TemplateTitle>{template.title}</TemplateTitle>
                    <TemplateDescription>{template.description}</TemplateDescription>
                  </TemplateInfo>
                </TemplateCard>
              ))}
            </TemplateGrid>
            </div>
          </StepContent>
        );

      case 2:
        return (
          <StepContent variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
            <StepTitle>
              <FaEdit />
                  Design Your Email
            </StepTitle>
            <StepDescription>
                  Drag and drop elements to build your email. See live preview as you design.
            </StepDescription>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <NavButton onClick={prevStep} disabled={currentStep <= 1}>
                  <FaArrowLeft />
                  Previous
                </NavButton>
                
                <NavButton onClick={handleSave}>
                  <FaSave />
                  Save Draft
                </NavButton>
                
                <NavButton variant="primary" onClick={nextStep}>
                  Next
                  <FaArrowRight />
                </NavButton>
              </div>
            </div>
            
            <DragPreview ref={dragPreviewRef} />
            
            <div style={{ 
              display: 'flex',
              gap: '2rem', 
              minHeight: '600px',
              marginTop: '1rem'
            }}>
              
              {/* Visual Email Canvas - Left */}
              <div style={{ 
                flex: rightPanelExpanded ? '1' : '1 1 auto',
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
                  <ViewToggle active={true}>
                    🖥️ Desktop
                  </ViewToggle>
                  <ViewToggle active={false}>
                    📱 Mobile
                  </ViewToggle>
                  <ViewToggle active={false}>
                    📧 Text Only
                  </ViewToggle>
                </ViewToggleContainer>

                <EmailCanvas>
                  <EmailContainer>
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
                            Drag any element from the sidebar to build your email
                          </small>
                        </DropZone>
                      )}
                    </EmailBody>

                    <EmailFooter>
                      <div style={{ padding: '2.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#999' }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                          <SocialLink href="#">📘 Facebook</SocialLink>
                          <SocialLink href="#">🐦 Twitter</SocialLink>
                          <SocialLink href="#">📷 Instagram</SocialLink>
                          <SocialLink href="#">🎵 YouTube</SocialLink>
                        </div>
                        <div style={{ marginBottom: '1rem', fontWeight: '600', color: '#666' }}>
                          Cymasphere Inc. | 123 Music Street, Audio City, AC 12345
                        </div>
                        <div>
                          <FooterLink href="#">Unsubscribe</FooterLink>
                          <span style={{ margin: '0 0.5rem', color: '#ccc' }}>•</span>
                          <FooterLink href="#">Update Preferences</FooterLink>
                          <span style={{ margin: '0 0.5rem', color: '#ccc' }}>•</span>
                          <FooterLink href="#">Privacy Policy</FooterLink>
                        </div>
                      </div>
                    </EmailFooter>
                  </EmailContainer>
                </EmailCanvas>
              </div>

              {/* All Settings Panels - Right */}
              <div style={{ 
                width: rightPanelExpanded ? '400px' : '60px',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '1.5rem', 
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.01) 100%)',
                borderRadius: '16px',
                padding: rightPanelExpanded ? '1rem' : '0.5rem',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                alignSelf: 'flex-start',
                transition: 'all 0.3s ease',
                overflow: 'hidden'
              }}>
                
                {/* Toggle Button */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: rightPanelExpanded ? 'flex-end' : 'center',
                  marginBottom: rightPanelExpanded ? '0' : '1rem'
                }}>
                  <button
                    onClick={() => setRightPanelExpanded(!rightPanelExpanded)}
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
                    {rightPanelExpanded ? '→' : '←'}
                  </button>
                </div>

                {rightPanelExpanded && (
                  <>
                    {/* Content Elements */}
                    <SidebarPanel>
                      <PanelHeader>
                        <PanelIcon>🧩</PanelIcon>
                        <PanelTitle>Content Elements</PanelTitle>
                      </PanelHeader>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <DragElement 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'header')}
                          onDragEnd={handleDragEnd}
                        >
                          <span>📝</span>
                          <span>Header</span>
                        </DragElement>
                        <DragElement 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'text')}
                          onDragEnd={handleDragEnd}
                        >
                          <span>📄</span>
                          <span>Text Block</span>
                        </DragElement>
                        <DragElement 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'button')}
                          onDragEnd={handleDragEnd}
                        >
                          <span>🎯</span>
                          <span>Button</span>
                        </DragElement>
                        <DragElement 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'image')}
                          onDragEnd={handleDragEnd}
                        >
                          <span>🖼️</span>
                          <span>Image</span>
                        </DragElement>
                        <DragElement 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'divider')}
                          onDragEnd={handleDragEnd}
                        >
                          <span>➖</span>
                          <span>Divider</span>
                        </DragElement>
                        <DragElement 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'social')}
                          onDragEnd={handleDragEnd}
                        >
                          <span>📱</span>
                          <span>Social Links</span>
                        </DragElement>
                        <DragElement 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'spacer')}
                          onDragEnd={handleDragEnd}
                        >
                          <span>⬜</span>
                          <span>Spacer</span>
                        </DragElement>
                        <DragElement 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'columns')}
                          onDragEnd={handleDragEnd}
                        >
                          <span>📐</span>
                          <span>Columns</span>
                        </DragElement>
                        <DragElement 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, 'video')}
                          onDragEnd={handleDragEnd}
                        >
                          <span>🎬</span>
                          <span>Video</span>
                        </DragElement>
                      </div>
                    </SidebarPanel>

                    {/* Element Properties */}
                    <SidebarPanel>
                      <PanelHeader>
                        <PanelIcon>⚙️</PanelIcon>
                        <PanelTitle>Element Properties</PanelTitle>
                      </PanelHeader>
                      <EmptyState>
                        <span style={{ fontSize: '2rem', opacity: 0.5 }}>🔧</span>
                        <span style={{ fontWeight: '500' }}>Select an element to edit its properties</span>
                      </EmptyState>
                    </SidebarPanel>

                    {/* Design Settings */}
                    <SidebarPanel>
                      <PanelHeader>
                        <PanelIcon>🎨</PanelIcon>
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
                        <PanelIcon>🔤</PanelIcon>
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
          </StepContent>
        );

      case 3:
        return (
          <StepContent variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <StepTitle>
              <FaEye />
              Review & Schedule
            </StepTitle>
            <StepDescription>
              Review your campaign details and choose when to send.
            </StepDescription>
            
            {/* Campaign Review Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaEye style={{ color: 'var(--primary)' }} />
                Campaign Summary
              </h3>
              <FormGrid>
                <div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px' }}>
                    <p><strong>Name:</strong> {campaignData.name || "Untitled Campaign"}</p>
                    <p><strong>Subject:</strong> {campaignData.subject || "No subject"}</p>
                    <p><strong>Audience:</strong> {audienceSegments.find(a => a.id === campaignData.audience)?.title || "No audience selected"}</p>
                    <p><strong>Template:</strong> {templates.find(t => t.id === campaignData.template)?.title || "No template selected"}</p>
                  </div>
                </div>
                <div>
                  <PreviewSection>
                    <PreviewTitle>
                      <FaEye />
                      Email Preview
                    </PreviewTitle>
                    <PreviewContent>
                      <h2 style={{ color: '#333', marginBottom: '1rem' }}>
                        {campaignData.subject || "Email Subject"}
                      </h2>
                      <div style={{ whiteSpace: 'pre-wrap' }}>
                        {campaignData.content || "Email content will appear here..."}
                      </div>
                    </PreviewContent>
                  </PreviewSection>
                </div>
              </FormGrid>
            </div>

            {/* Schedule Section */}
            <div>
              <h3 style={{ color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaCalendarAlt style={{ color: 'var(--primary)' }} />
                Schedule Campaign
              </h3>
            <ScheduleOptions>
              <ScheduleOption
                selected={campaignData.scheduleType === "immediate"}
                onClick={() => setCampaignData({...campaignData, scheduleType: "immediate"})}
              >
                <ScheduleIcon><FaPaperPlane /></ScheduleIcon>
                <ScheduleTitle>Send Immediately</ScheduleTitle>
                <ScheduleDescription>Send the campaign right away</ScheduleDescription>
              </ScheduleOption>
              <ScheduleOption
                selected={campaignData.scheduleType === "scheduled"}
                onClick={() => setCampaignData({...campaignData, scheduleType: "scheduled"})}
              >
                <ScheduleIcon><FaClock /></ScheduleIcon>
                <ScheduleTitle>Schedule for Later</ScheduleTitle>
                <ScheduleDescription>Choose a specific date and time</ScheduleDescription>
              </ScheduleOption>
              <ScheduleOption
                selected={campaignData.scheduleType === "draft"}
                onClick={() => setCampaignData({...campaignData, scheduleType: "draft"})}
              >
                <ScheduleIcon><FaSave /></ScheduleIcon>
                <ScheduleTitle>Save as Draft</ScheduleTitle>
                <ScheduleDescription>Save and send later manually</ScheduleDescription>
              </ScheduleOption>
            </ScheduleOptions>
            {campaignData.scheduleType === "scheduled" && (
              <FormGrid>
                <FormGroup>
                  <Label>Schedule Date</Label>
                  <Input
                    type="date"
                    value={campaignData.scheduleDate}
                    onChange={(e) => setCampaignData({...campaignData, scheduleDate: e.target.value})}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Schedule Time</Label>
                  <Input
                    type="time"
                    value={campaignData.scheduleTime}
                    onChange={(e) => setCampaignData({...campaignData, scheduleTime: e.target.value})}
                  />
                </FormGroup>
              </FormGrid>
            )}
                </div>
          </StepContent>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <NextSEO
        title={isEditMode ? "Edit Campaign" : "Create Campaign"}
        description={isEditMode ? "Edit email campaign details and content" : "Create a new email marketing campaign"}
      />
      
      <CreateContainer>
        <Header>
          <Title>
            <FaEnvelopeOpen />
            {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
          </Title>
          <Subtitle>
            {isEditMode 
              ? 'Update your email campaign settings and content'
              : 'Follow the steps below to create and send your email campaign'
            }
          </Subtitle>
        </Header>

        <StepIndicator>
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <Step 
                active={currentStep === step.number}
                completed={currentStep > step.number}
                onClick={() => setCurrentStep(step.number)}
                style={{ cursor: 'pointer' }}
              >
                {currentStep > step.number ? <FaCheck /> : <step.icon />}
                {step.title}
              </Step>
              {index < steps.length - 1 && (
                <StepConnector completed={currentStep > step.number} />
              )}
            </React.Fragment>
          ))}
        </StepIndicator>

        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        <NavigationButtons>
          <NavButton onClick={prevStep} disabled={currentStep <= 1}>
            <FaArrowLeft />
            Previous
          </NavButton>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <NavButton onClick={handleSave}>
              <FaSave />
              Save Draft
            </NavButton>
            
            {currentStep === steps.length ? (
              <NavButton variant="primary" onClick={handleSend}>
                <FaPaperPlane />
                {isEditMode ? 'Update Campaign' : 'Send Campaign'}
              </NavButton>
            ) : (
              <NavButton variant="primary" onClick={nextStep}>
                Next
                <FaArrowRight />
              </NavButton>
            )}
          </div>
        </NavigationButtons>
      </CreateContainer>
    </>
  );
}

export default CreateCampaignPage; 