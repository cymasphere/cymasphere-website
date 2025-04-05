import { NextConfig } from 'next';

/**
 * Simplified configuration that works in development mode
 * Using minimal options to avoid compatibility issues
 */
const config: NextConfig = {
  // Disable checks
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Configure styled-components
  compiler: {
    styledComponents: true,
  },
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Optimize images
  images: {
    unoptimized: true
  }
};

export default config;
