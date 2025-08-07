"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class AudioErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.warn('Audio Error Boundary caught an error:', error, errorInfo);
    
    // Only show fallback for audio-related errors
    if (error.message.includes('AudioContext') || 
        error.message.includes('Tone') || 
        error.message.includes('audio')) {
      this.setState({ hasError: true, error });
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="text-sm text-gray-500 p-2">
          Audio temporarily unavailable
        </div>
      );
    }

    return this.props.children;
  }
}

export default AudioErrorBoundary;
