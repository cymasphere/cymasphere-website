import { NextConfig } from 'next';

/**
 * Production-ready configuration for Next.js 15.2.4
 * Optimized for Docker deployment with standalone output
 */
const config: NextConfig = {
  // Generate standalone output for Docker deployment
  output: 'standalone',
  
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
  
  // Disable image optimization for simpler deployment
  images: {
    unoptimized: true
  },
  
  // List packages that should be treated as external in server components
  // This is renamed from experimental.serverComponentsExternalPackages in Next.js 15
  serverExternalPackages: ['styled-components'],
  
  // Minimal experimental features
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },
  
  // Note: we can't use both transpilePackages and serverExternalPackages 
  // for the same package, as they would conflict
  // transpilePackages: ['styled-components'],
};

export default config;
