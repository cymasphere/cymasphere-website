import React, { createContext, useContext, useState } from 'react';
import Toast from '../components/common/Toast';

// Create context
const ToastContext = createContext();

// Toast provider component
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  // Add a new toast
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  };
  
  // Remove a toast by ID
  const hideToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  // Convenience methods for different toast types
  const success = (message, duration) => showToast(message, 'success', duration);
  const error = (message, duration) => showToast(message, 'error', duration);
  const warning = (message, duration) => showToast(message, 'warning', duration);
  const info = (message, duration) => showToast(message, 'info', duration);
  
  return (
    <ToastContext.Provider value={{ showToast, hideToast, success, error, warning, info }}>
      {children}
      
      {/* Render all active toasts */}
      {toasts.map(toast => (
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
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext; 