/**
 * @fileoverview Toast Component
 * @module components/common/Toast
 * 
 * A toast notification component that displays temporary messages to users.
 * Supports multiple types (info, success, error, warning) with automatic dismissal
 * and smooth slide animations.
 * 
 * @example
 * // Success toast
 * <Toast 
 *   message="Settings saved successfully!" 
 *   type="success" 
 *   duration={3000} 
 *   onClose={() => {}} 
 * />
 * 
 * @example
 * // Error toast
 * <Toast 
 *   message="Failed to save changes" 
 *   type="error" 
 *   duration={5000} 
 *   onClose={handleClose} 
 * />
 */

import React, { useEffect } from "react";
import styled, { keyframes } from "styled-components";
import {
  FaExclamationCircle,
  FaInfoCircle,
  FaCheckCircle,
} from "react-icons/fa";

// Animation for toast appearance
const slideIn = keyframes`
  from {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  to {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
`;

// Define interfaces for styled component props
interface ToastContainerProps {
  $type: string;
  $closing: boolean;
}

interface IconContainerProps {
  $type: string;
}

// Toast container
const ToastContainer = styled.div<ToastContainerProps>`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  display: flex;
  align-items: center;
  background: rgba(25, 23, 36, 0.9);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  font-weight: 500;
  min-width: 300px;
  max-width: 80vw;
  backdrop-filter: blur(10px);
  animation: ${(props) => (props.$closing ? slideOut : slideIn)} 0.3s ease
    forwards;
  border: 1px solid rgba(255, 255, 255, 0.1);

  &:before {
    content: "";
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    height: 3px;
    background: ${(props) => {
      switch (props.$type) {
        case "success":
          return "linear-gradient(90deg, #4ECDC4, #2ecc71)";
        case "error":
          return "linear-gradient(90deg, #FF6B6B, #ee5253)";
        case "warning":
          return "linear-gradient(90deg, #FFD166, #F7B731)";
        default:
          return "linear-gradient(90deg, #6C63FF, #4ECDC4)";
      }
    }};
    border-radius: 8px 8px 0 0;
  }
`;

const IconContainer = styled.div<IconContainerProps>`
  margin-right: 12px;
  display: flex;
  font-size: 20px;
  color: ${(props) => {
    switch (props.$type) {
      case "success":
        return "#4ECDC4";
      case "error":
        return "#FF6B6B";
      case "warning":
        return "#FFD166";
      default:
        return "#6C63FF";
    }
  }};
`;

const Message = styled.div`
  flex: 1;
  font-size: 0.95rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  cursor: pointer;
  margin-left: 15px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: white;
  }
`;

/**
 * @brief Props for Toast component
 */
interface ToastProps {
  /** @param {string} message - The message text to display */
  message: string;
  /** @param {"info"|"success"|"error"|"warning"} [type="info"] - Toast type, determines color and icon */
  type?: "info" | "success" | "error" | "warning";
  /** @param {number} [duration=3000] - Auto-dismiss duration in milliseconds */
  duration?: number;
  /** @param {() => void} onClose - Callback function called when toast is dismissed */
  onClose: () => void;
}

/**
 * @brief Toast component
 * 
 * Displays a temporary notification message with type-specific styling and icons.
 * Automatically dismisses after the specified duration with smooth slide-out animation.
 * 
 * @param {ToastProps} props - Component props
 * @returns {JSX.Element} The rendered toast notification
 * 
 * @note Toast appears at the top center of the viewport
 * @note Uses slide-in and slide-out animations for smooth transitions
 * @note Type determines icon and accent color (top border)
 * @note Close button is available but currently doesn't trigger onClose
 * @note Auto-dismisses after duration with 300ms animation delay
 */
const Toast = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: ToastProps) => {
  const [isClosing, setIsClosing] = React.useState(false);

  const handleClose = () => {};

  // Auto close after duration
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
      }, 300); // Match the animation duration
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Get the appropriate icon based on type
  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle />;
      case "error":
        return <FaExclamationCircle />;
      case "warning":
        return <FaExclamationCircle />;
      default:
        return <FaInfoCircle />;
    }
  };

  return (
    <ToastContainer $type={type} $closing={isClosing}>
      <IconContainer $type={type}>{getIcon()}</IconContainer>
      <Message>{message}</Message>
      <CloseButton onClick={handleClose}>✕</CloseButton>
    </ToastContainer>
  );
};

export default Toast;
