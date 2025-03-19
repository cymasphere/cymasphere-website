import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './i18n'; // Import i18n configuration
// Import tone patches to fix Tone.js undefined parameter issues
import './utils/tonePatches';

// Aggressively suppress ResizeObserver errors
(function suppressResizeObserverErrors() {
  // Suppress console errors for ResizeObserver
  const originalConsoleError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('ResizeObserver loop') || 
       args[0].includes('ResizeObserver loop completed with undelivered notifications'))
    ) {
      // Suppress ResizeObserver warnings - they're non-critical
      return;
    }
    originalConsoleError(...args);
  };
  
  // Override the error event at the window level
  const errorHandler = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    if (message && typeof message === 'string' && message.includes('ResizeObserver loop')) {
      // Prevent the error from appearing in the console
      return true; // This prevents the error from propagating
    }
    // Call the original handler, if exists
    if (typeof errorHandler === 'function') {
      return errorHandler(message, source, lineno, colno, error);
    }
    return false;
  };
  
  // Capture and prevent ResizeObserver errors from bubbling up
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('ResizeObserver loop')) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true);
  
  // Also handle unhandled promise rejections related to ResizeObserver
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.message && 
        event.reason.message.includes('ResizeObserver loop')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
})();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
