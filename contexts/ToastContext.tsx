"use client";

import React, { createContext, useContext, useState } from "react";
import Toast from "@/components/common/Toast";

export type ToastData = {
  id: string;
  message: string;
  type: string;
  duration: number;
};

export type ToastContextType = {
  showToast: (message: string, type: string, duration: number) => string;
  hideToast: (id: string) => void;
  success: (message: string, duration: number) => string;
  error: (message: string, duration: number) => string;
  warning: (message: string, duration: number) => string;
  info: (message: string, duration: number) => string;
};

// Create context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast provider component
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  // Add a new toast
  const showToast = (message: string, type = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  // Remove a toast by ID
  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Convenience methods for different toast types
  const success = (message: string, duration: number) =>
    showToast(message, "success", duration);
  const error = (message: string, duration: number) =>
    showToast(message, "error", duration);
  const warning = (message: string, duration: number) =>
    showToast(message, "warning", duration);
  const info = (message: string, duration: number) =>
    showToast(message, "info", duration);

  return (
    <ToastContext.Provider
      value={{ showToast, hideToast, success, error, warning, info }}
    >
      {children}

      {/* Render all active toasts */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => hideToast(toast.id)}
        />
      ))}
    </ToastContext.Provider>
  );
};

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
