import React from 'react';
import { ThemeProvider, createGlobalStyle } from 'styled-components';
import { AuthProvider } from '../src/contexts/NextAuthContext';
import { ToastProvider } from '../src/context/ToastContext';
// Import global styles
import '../styles/globals.css';
import '../src/App.css';
import '../src/index.css';
import '../src/components/layout/MobileLanguageStyle.css';

// Fix for useLayoutEffect SSR warning
if (typeof window === 'undefined') {
  React.useLayoutEffect = React.useEffect;
}

// Global style definition
const GlobalStyle = createGlobalStyle`
  :root {
    --primary: #6c63ff;
    --accent: #4ecdc4;
    --background: #121212;
    --card-bg: #1e1e1e;
    --text-primary: #ffffff;
    --text-secondary: #b3b3b3;
    --error: #ef5350;
    --success: #66bb6a;
    --warning: #ffb74d;
    --info: #42a5f5;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
      sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background);
    color: var(--text-primary);
  }
`;

// Custom App component
function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider theme={{}}>
      <GlobalStyle />
      <AuthProvider>
        <ToastProvider>
          <Component {...pageProps} />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp; 