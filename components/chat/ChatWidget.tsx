'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaComment, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

// Import audio utilities dynamically to avoid SSR issues
const playSound = async () => {
  if (typeof window !== "undefined") {
    try {
      console.log("Chat widget: Attempting to play sound...");
      const { playLydianMaj7Chord, initAudio } = await import("../../utils/audioUtils");
      console.log("Chat widget: Audio utils imported successfully");
      
      // Initialize audio context first (this will unlock audio on user interaction)
      await initAudio();
      console.log("Chat widget: Audio context initialized");
      
      // Play the sound
      await playLydianMaj7Chord();
      console.log("Chat widget: Sound played successfully");
    } catch (error) {
      console.error("Chat widget: Error playing sound:", error);
    }
  } else {
    console.log("Chat widget: Window not available, skipping sound");
  }
};

interface MessageCTA {
  label: string;
  href: string;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  cta?: MessageCTA | null;
}

const ChatContainer = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9998;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  
  /* Mobile responsiveness */
  @media (max-width: 480px) {
    bottom: 10px;
    right: 10px;
    left: 10px;
    align-items: center;
  }
  
  @media (max-width: 360px) {
    bottom: 5px;
    right: 5px;
    left: 5px;
  }
`;

const ChatButton = styled.button<{ $isOpen: boolean }>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  box-shadow: 0 4px 20px rgba(108, 99, 255, 0.3);
  transition: all 0.3s ease;
  transform: ${props => props.$isOpen ? 'scale(0.9)' : 'scale(1)'};
  position: relative;
  z-index: 9999;

  &:hover {
    transform: ${props => props.$isOpen ? 'scale(0.85)' : 'scale(1.1)'};
    box-shadow: 0 6px 25px rgba(108, 99, 255, 0.4);
  }
`;

const ChatWindow = styled.div<{ $isOpen: boolean }>`
  width: 420px;
  height: 500px;
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 9998;
  
  /* Mobile responsiveness */
  @media (max-width: 480px) {
    width: calc(100vw - 40px);
    max-width: 420px;
    height: calc(100vh - 120px);
    max-height: 500px;
  }
  
  @media (max-width: 360px) {
    width: calc(100vw - 20px);
    height: calc(100vh - 100px);
  }
`;

const ChatHeader = styled.div`
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ChatTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 16px;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 18px;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  
  /* Mobile responsiveness */
  @media (max-width: 480px) {
    padding: 12px;
    gap: 10px;
  }
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  max-width: 80%;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.$isUser 
    ? 'linear-gradient(135deg, var(--primary), var(--accent))' 
    : 'rgba(255, 255, 255, 0.08)'};
  color: ${props => props.$isUser ? 'white' : 'var(--text)'};
  align-self: ${props => props.$isUser ? 'flex-end' : 'flex-start'};
  word-wrap: break-word;
  position: relative;
  
  /* Mobile responsiveness */
  @media (max-width: 480px) {
    max-width: 90%;
    padding: 10px 14px;
    border-radius: 16px;
    font-size: 14px;
  }
  
  @media (max-width: 360px) {
    max-width: 95%;
    padding: 8px 12px;
    font-size: 13px;
  }

  /* Markdown styling */
  p {
    margin: 0 0 8px 0;
    &:last-child {
      margin-bottom: 0;
    }
  }

  ul, ol {
    margin: 8px 0;
    padding-left: 20px;
  }

  li {
    margin: 4px 0;
  }

  strong {
    font-weight: 600;
  }

  em {
    font-style: italic;
  }

  code {
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 4px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }

  pre {
    background: rgba(255, 255, 255, 0.1);
    padding: 8px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 8px 0;
  }

  blockquote {
    border-left: 3px solid var(--primary);
    padding-left: 12px;
    margin: 8px 0;
    opacity: 0.8;
  }
`;

const MessageTime = styled.div<{ $isUser: boolean }>`
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: ${props => props.$isUser ? 'right' : 'left'};
`;

const CTAButton = styled.span`
  display: inline-block;
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  font-weight: 600;
  font-size: 13px;
  text-decoration: none;
  box-shadow: 0 4px 12px rgba(108, 99, 255, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px rgba(108, 99, 255, 0.45);
  }
`;

const InputContainer = styled.div`
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 8px;
  
  /* Mobile responsiveness */
  @media (max-width: 480px) {
    padding: 12px;
    gap: 6px;
  }
`;

const MessageInput = styled.input`
  flex: 1;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 12px 16px;
  color: var(--text);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  
  /* Mobile responsiveness */
  @media (max-width: 480px) {
    padding: 10px 14px;
    font-size: 13px;
    border-radius: 18px;
  }
  
  @media (max-width: 360px) {
    padding: 8px 12px;
    font-size: 12px;
  }

  &:focus {
    border-color: var(--primary);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const SendButton = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s;
  
  /* Mobile responsiveness */
  @media (max-width: 480px) {
    width: 36px;
    height: 36px;
  }
  
  @media (max-width: 360px) {
    width: 32px;
    height: 32px;
  }

  &:hover {
    transform: scale(1.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  color: var(--text-secondary);
  font-size: 14px;
`;

const TypingDots = styled.div`
  display: flex;
  gap: 2px;

  &::after {
    content: '...';
    animation: typing 1.5s infinite;
  }

  @keyframes typing {
    0%, 60%, 100% { opacity: 0.3; }
    30% { opacity: 1; }
  }
`;

interface ChatWidgetProps {
  className?: string;
}

export default function ChatWidget({ className }: ChatWidgetProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [wasEmailModalOpen, setWasEmailModalOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize greeting message based on language
  useEffect(() => {
    const initialGreeting: Message = {
      id: '1',
      text: t('chat.greeting') || "Hi! I'm your Cymasphere assistant. I can help you with questions about our music production tools, pricing, features, and more. What would you like to know?",
      isUser: false,
      timestamp: new Date()
    };
    setMessages([initialGreeting]);
  }, [i18n.language, t]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Refocus input after messages update (when assistant responds)
  useEffect(() => {
    if (isOpen && inputRef.current && !isTyping) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isOpen, isTyping]);

  // Initialize audio on first user interaction
  useEffect(() => {
    const initializeAudioOnInteraction = async () => {
      if (!audioInitialized) {
        try {
          const { initAudio } = await import("../../utils/audioUtils");
          await initAudio();
          setAudioInitialized(true);
          console.log("Chat widget: Audio initialized on user interaction");
        } catch (error) {
          console.error("Chat widget: Failed to initialize audio:", error);
        }
      }
    };

    // Listen for any user interaction to initialize audio
    const events = ['click', 'touchstart', 'keydown', 'mousedown'];
    events.forEach(event => {
      document.addEventListener(event, initializeAudioOnInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, initializeAudioOnInteraction);
      });
    };
  }, [audioInitialized]);

  // Check if email modal is open (detect modal overlay with z-index 9999)
  useEffect(() => {
    const checkEmailModal = () => {
      // Check for modal overlay - EmailCollectionModal uses z-index 9999
      // Exclude chat widget elements
      const allElements = document.querySelectorAll('*');
      let hasEmailModal = false;
      
      for (const el of allElements) {
        // Skip chat widget elements
        if (el.hasAttribute('data-chat-widget') || 
            el.closest('[data-chat-widget]') ||
            el.closest('[class*="ChatContainer"], [class*="ChatWidget"]')) {
          continue;
        }
        
        const styles = window.getComputedStyle(el);
        // Check for email modal overlay - it should have z-index 9999, be fixed, and have backdrop blur
        // Also check for specific modal classes or data attributes
        if (styles.zIndex === '9999' && styles.position === 'fixed') {
          // Check if it's a modal overlay (has backdrop blur or specific styling)
          // EmailCollectionModal typically has backdrop-filter blur
          if ((styles.backdropFilter && styles.backdropFilter !== 'none') || 
              (styles.backgroundColor === 'rgba(0, 0, 0, 0.7)' && el.classList.toString().includes('Modal'))) {
            hasEmailModal = true;
            break;
          }
        }
      }
      
      const emailModalJustOpened = hasEmailModal && !wasEmailModalOpen;
      setIsEmailModalOpen(hasEmailModal);
      setWasEmailModalOpen(hasEmailModal);
      
      // If email modal just opened (not already open), close chat widget
      // Add a small delay to prevent immediate closing when chat opens
      if (emailModalJustOpened && isOpen) {
        setTimeout(() => {
          setIsOpen(false);
        }, 100);
      }
    };

    // Check immediately
    checkEmailModal();

    // Set up observer to watch for modal changes
    const observer = new MutationObserver(() => {
      checkEmailModal();
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    // Also check periodically as fallback
    const interval = setInterval(checkEmailModal, 200);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [isOpen]);

  // Auto-open chat widget after 15 seconds if not on dashboard pages and user is not logged in
  useEffect(() => {
    const isDashboardPage = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
    const isLoggedIn = !!user;
    
    // Don't auto-open if:
    // - On dashboard/admin pages
    // - User is logged in
    // - Email modal is open
    // - Already auto-opened
    // - Chat is already open
    if (!isDashboardPage && !isLoggedIn && !hasAutoOpened && !isOpen && !isEmailModalOpen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasAutoOpened(true);
        // Play pleasant sound when auto-opening (only if audio was initialized)
        if (audioInitialized) {
          playSound().catch(() => {
            console.log("Audio not available for chat widget auto-open");
          });
        } else {
          console.log("Audio not initialized yet, skipping auto-open sound");
        }
      }, 15000); // 15 seconds

      return () => clearTimeout(timer);
    }
  }, [pathname, hasAutoOpened, isOpen, audioInitialized, isEmailModalOpen, user]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.text,
          conversationHistory: messages.slice(-5), // Send last 5 messages for context
          language: i18n.language // Pass current language code (e.g., 'en', 'es', 'fr')
        }),
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response || t('chat.error_process') || "I'm sorry, I couldn't process your message right now. Please try again.",
        isUser: false,
        timestamp: new Date(),
        cta: null
      };

      // If message mentions pricing/plans/trial, append CTA to view pricing section
      const pricingRegex = /(price|pricing|plan|plans|monthly|yearly|lifetime|trial|subscribe|upgrade)/i;
      if (pricingRegex.test(botMessage.text)) {
        botMessage.cta = {
          label: t('chat.view_pricing') || 'View pricing',
          href: '/#pricing',
        };
      }

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t('chat.error_connecting') || "I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ChatContainer className={className} $isOpen={isOpen} data-chat-widget="true">
      <ChatWindow $isOpen={isOpen}>
        <ChatHeader>
          <ChatTitle>
            <FaRobot />
            {t('chat.title') || 'Cymasphere Assistant'}
          </ChatTitle>
          <CloseButton onClick={() => setIsOpen(false)}>
            <FaTimes />
          </CloseButton>
        </ChatHeader>
        
        <MessagesContainer>
          {messages.map((message) => (
            <MessageBubble key={message.id} $isUser={message.isUser}>
              {message.isUser ? (
                message.text
              ) : (
                <>
                  <ReactMarkdown>{message.text}</ReactMarkdown>
                  {message.cta && (
                    <Link href={message.cta.href} passHref>
                      <CTAButton>{message.cta.label}</CTAButton>
                    </Link>
                  )}
                </>
              )}
              <MessageTime $isUser={message.isUser}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </MessageTime>
            </MessageBubble>
          ))}
          
          {isTyping && (
            <TypingIndicator>
              <FaRobot />
              {t('chat.typing') || 'Assistant is typing'}
              <TypingDots />
            </TypingIndicator>
          )}
          
          <div ref={messagesEndRef} />
        </MessagesContainer>
        
        <InputContainer>
          <MessageInput
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t('chat.placeholder') || 'Ask me anything about Cymasphere...'}
            disabled={isTyping}
          />
          <SendButton 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
          >
            <FaPaperPlane />
          </SendButton>
        </InputContainer>
      </ChatWindow>
      
      <ChatButton 
        $isOpen={isOpen}
        onClick={() => {
          setIsOpen(!isOpen);
          // Play sound when manually opening chat
          if (!isOpen) {
            playSound().catch(() => {
              console.log("Audio not available for manual chat open");
            });
          }
        }}
        aria-label={isOpen ? t('chat.close_label') || 'Close chat' : t('chat.open_label') || 'Open chat'}
      >
        {isOpen ? <FaTimes /> : <FaComment />}
      </ChatButton>
    </ChatContainer>
  );
}
