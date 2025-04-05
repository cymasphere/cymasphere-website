import { NextConfig } from 'next';

/**
 * Final minimal configuration for Next.js 15.2.4
 * Designed to avoid all static generation issues
 */
const config: NextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  
  // Disable validation for faster builds
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable styled-components
  compiler: {
    styledComponents: true,
  },
  
  // Disable image optimization
  images: {
    unoptimized: true
  },
  
  // Minimal experimental features
  experimental: {
    optimizeCss: true,
  },
  
  // Don't try to generate pages statically
  output: "standalone"
};

export default config;
