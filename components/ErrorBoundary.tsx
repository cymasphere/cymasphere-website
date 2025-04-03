import React from 'react';
import styled from 'styled-components';
import { withNoSSR } from '../utils/dynamicImports';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  margin: 2rem auto;
  max-width: 800px;
  background-color: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--error);
  color: var(--text);
`;

const ErrorTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--error);
  margin-bottom: 1rem;
`;

const ErrorMessage = styled.pre`
  font-size: 0.9rem;
  background-color: rgba(0, 0, 0, 0.2);
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  width: 100%;
  max-height: 300px;
`;

const RetryButton = styled.button`
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #5852e3;
    transform: translateY(-2px);
  }
`;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('ErrorBoundary caught an error', error, errorInfo);
    this.setState({ errorInfo });
    
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo);
  }
  
  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // You could also add logic to reload data here
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <ErrorContainer>
          <ErrorTitle>Something went wrong</ErrorTitle>
          <p>We've encountered an error and are working to fix it.</p>
          {this.state.error && (
            <ErrorMessage>
              {this.state.error.toString()}
              <br />
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </ErrorMessage>
          )}
          <RetryButton onClick={this.handleRetry}>
            Retry / Refresh
          </RetryButton>
        </ErrorContainer>
      );
    }

    return this.props.children; 
  }
}

// Use withNoSSR to prevent SSR issues with error boundary
export default withNoSSR(ErrorBoundary); 