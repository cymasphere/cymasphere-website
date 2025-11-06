"use client";

import React from "react";
import styled from "styled-components";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";

interface ScriptModalProps {
  isOpen: boolean;
  title: string;
  summaryMarkdown: string;
  fullMarkdown?: string;
  onClose: () => void;
}

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
`;

const Container = styled(motion.div)`
  width: 95%;
  max-width: 960px;
  max-height: 85vh;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(0, 0, 0, 0.2);
`;

const Title = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: var(--text);
`;

const CloseBtn = styled.button`
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: var(--hover);
  }
`;

const Body = styled.div`
  padding: 16px;
  overflow: auto;
  color: var(--text);
  line-height: 1.6;

  h1, h2, h3, h4, h5, h6 { color: var(--text); margin: 0.6rem 0; }
  p { margin: 0.5rem 0; color: var(--text-secondary); }
  ul, ol { padding-left: 1.2rem; margin: 0.5rem 0; }
  code { background: rgba(255,255,255,0.06); padding: 2px 4px; border-radius: 4px; }
  pre { background: rgba(255,255,255,0.06); padding: 10px; border-radius: 8px; overflow: auto; }
  a { color: var(--primary); }
`;

const SectionTitle = styled.h4`
  margin: 0.25rem 0 0.5rem 0;
  font-size: 1rem;
  color: var(--text);
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid var(--border);
  margin: 12px 0;
`;

const ScriptModal: React.FC<ScriptModalProps> = ({ isOpen, title, summaryMarkdown, fullMarkdown, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <Container
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            transition={{ type: "spring", damping: 22, stiffness: 240 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Header>
              <Title>{title}</Title>
              <CloseBtn onClick={onClose}>Close</CloseBtn>
            </Header>
            <Body>
              <SectionTitle>Summary</SectionTitle>
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{summaryMarkdown}</ReactMarkdown>

              <Divider />

              <SectionTitle>Recording Script</SectionTitle>
              <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{fullMarkdown || summaryMarkdown}</ReactMarkdown>
            </Body>
          </Container>
        </Overlay>
      )}
    </AnimatePresence>
  );
};

export default ScriptModal;


