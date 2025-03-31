import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import SignUp from './components/SignUp';
import Login from './components/Login';
import ResetPassword from './components/ResetPassword';
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Billing from './components/Billing';
import Downloads from './components/Downloads';
import Settings from './components/Settings';
import LandingPage from './pages/LandingPage';
import LoadingDemo from './pages/LoadingDemo';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ScrollToTop from './components/ScrollToTop';
import CheckoutSuccess from './components/checkout/CheckoutSuccess';
import MockCheckout from './components/checkout/MockCheckout';

// Global CSS Variables
const GlobalStyle = createGlobalStyle`
  :root {
    --primary: #6c63ff;
    --accent: #4ecdc4;
    --background: #121212;
    --card-bg: #1e1e1e;
    --input-bg: #2a2a2a;
    --text: #ffffff;
    --text-secondary: rgba(255, 255, 255, 0.7);
    --text-tertiary: rgba(255, 255, 255, 0.4);
    --border: rgba(255, 255, 255, 0.1);
    --success: #00c9a7;
    --error: #ff5e62;
    --warning: #ffc107;
  }
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    user-select: none; /* Make all text non-selectable */
    -webkit-user-select: none; /* Safari */
    -moz-user-select: none; /* Firefox */
    -ms-user-select: none; /* IE10+/Edge */
  }

  /* Allow selection for input elements and editable content */
  input, textarea, [contenteditable="true"] {
    user-select: text;
    -webkit-user-select: text;
    -moz-user-select: text;
    -ms-user-select: text;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: var(--background);
    color: var(--text);
    line-height: 1.6;
  }
  
  a {
    color: var(--primary);
    text-decoration: none;
    transition: all 0.2s ease;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

// Theme configuration
const theme = {
  colors: {
    primary: '#6c63ff',
    accent: '#4ecdc4',
    background: '#121212',
    cardBg: '#1e1e1e',
    inputBg: '#2a2a2a',
    text: '#ffffff',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.4)',
    border: 'rgba(255, 255, 255, 0.1)',
    success: '#00c9a7',
    error: '#ff5e62',
    warning: '#ffc107',
  },
  breakpoints: {
    mobile: '576px',
    tablet: '768px',
    desktop: '1024px',
    largeDesktop: '1200px',
  },
  shadows: {
    small: '0 2px 8px rgba(0, 0, 0, 0.15)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.2)',
    large: '0 8px 20px rgba(0, 0, 0, 0.25)',
  },
};

const App = () => {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <ToastProvider>
        <Router>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/loading-demo" element={<LoadingDemo />} />
              
              {/* Auth Routes */}
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Checkout Routes */}
              <Route path="/checkout-success" element={<CheckoutSuccess />} />
              <Route path="/mock-checkout" element={<MockCheckout />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              } />
              <Route path="/billing" element={
                <PrivateRoute>
                  <Billing />
                </PrivateRoute>
              } />
              <Route path="/downloads" element={
                <PrivateRoute>
                  <Downloads />
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              } />
              
              {/* Redirect any unmatched routes to home */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App; 