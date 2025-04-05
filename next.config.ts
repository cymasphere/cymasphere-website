import { NextConfig } from 'next';

/**
 * This configuration disables static optimization for pages using styled-components.
 * It's a workaround for issues with Server Components and styled-components.
 */
const config: NextConfig = {
  // Use standalone output
  output: 'standalone',
  
  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable optimizations
  experimental: {
    optimizeCss: true,
  },
  
  // Configure styled-components
  compiler: {
    styledComponents: true,
  },
  
  // Use strict mode
  reactStrictMode: true,
  
  // Disable static optimization completely
  staticPageGenerationTimeout: 0,
  
  // Only include NEXT_PUBLIC_ environment variables to avoid errors
  env: {
    NEXT_PUBLIC_DISABLE_STATIC: 'true'
  },
  
  // Optimize images
  images: {
    unoptimized: true
  },
  
  // Disable etag generation
  generateEtags: false
};

export default config;
