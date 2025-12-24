/**
 * @fileoverview Toast notification context provider for displaying user feedback messages.
 * @module contexts/ToastContext
 * @description Provides a centralized system for displaying toast notifications with
 * different types (success, error, warning, info) and customizable durations.
 */

"use client";

import React, { createContext, useContext, useState } from "react";
import Toast from "@/components/common/Toast";

/**
 * @brief Type definition for toast notification data.
 * @description Defines the structure of a toast notification, including its unique ID,
 * message content, type, and display duration.
 */
export type ToastData = {
  id: string;
  message: string;
  type: string;
  duration: number;
};

/**
 * @brief Type definition for the toast context.
 * @description Defines the shape of the toast context value, including methods
 * for showing and hiding toasts, and convenience methods for different toast types.
 */
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

/**
 * @brief Toast context provider component.
 * @description Manages toast notifications state and provides methods to display
 * and dismiss toasts. Renders all active toasts at the bottom of the provider.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to wrap with toast context.
 * @returns {JSX.Element} ToastContext provider wrapping children and rendering toasts.
 */
export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  /**
   * @brief Displays a new toast notification.
   * @param {string} message - The message to display in the toast.
   * @param {string} [type="info"] - The type of toast (info, success, error, warning).
   * @param {number} [duration=3000] - Duration in milliseconds before auto-dismissing.
   * @returns {string} The unique ID of the created toast.
   */
  const showToast = (message: string, type = "info", duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  };

  /**
   * @brief Removes a toast notification by its ID.
   * @param {string} id - The unique ID of the toast to remove.
   */
  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  /**
   * @brief Displays a success toast notification.
   * @param {string} message - The success message to display.
   * @param {number} duration - Duration in milliseconds before auto-dismissing.
   * @returns {string} The unique ID of the created toast.
   */
  const success = (message: string, duration: number) =>
    showToast(message, "success", duration);
  
  /**
   * @brief Displays an error toast notification.
   * @param {string} message - The error message to display.
   * @param {number} duration - Duration in milliseconds before auto-dismissing.
   * @returns {string} The unique ID of the created toast.
   */
  const error = (message: string, duration: number) =>
    showToast(message, "error", duration);
  
  /**
   * @brief Displays a warning toast notification.
   * @param {string} message - The warning message to display.
   * @param {number} duration - Duration in milliseconds before auto-dismissing.
   * @returns {string} The unique ID of the created toast.
   */
  const warning = (message: string, duration: number) =>
    showToast(message, "warning", duration);
  
  /**
   * @brief Displays an info toast notification.
   * @param {string} message - The info message to display.
   * @param {number} duration - Duration in milliseconds before auto-dismissing.
   * @returns {string} The unique ID of the created toast.
   */
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

/**
 * @brief Custom hook to access the toast context.
 * @description Provides access to toast notification methods. Must be used
 * within a ToastProvider.
 * @returns {ToastContextType} Toast context value.
 * @throws {Error} If used outside of ToastProvider.
 * @example
 * const { success, error } = useToast();
 * success('Operation completed!', 3000);
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
