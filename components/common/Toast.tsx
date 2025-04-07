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
    transform: translate(-50%, calc(-50% + 50px));
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translate(-50%, -50%);
    opacity: 1;
  }
  to {
    transform: translate(-50%, calc(-50% - 50px));
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
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 9999;
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

const Toast = ({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: {
  message: string;
  type: string;
  duration: number;
  onClose: () => void;
}) => {
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
