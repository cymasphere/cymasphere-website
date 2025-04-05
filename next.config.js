// @ts-check

/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',

  // Generate a consistent build ID
  generateBuildId: async () => {
    return 'cymasphere-build-' + Math.floor(Date.now() / 86400000);
  },

  // Skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // Skip ESLint checks during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable static generation to prevent page data collection errors
  staticPageGenerationTimeout: 0,

  // Disable strict mode in production to avoid warnings during build
  reactStrictMode: process.env.NODE_ENV !== 'production',

  // Enable CSS optimizations
  experimental: {
    optimizeCss: true,
  },

  // Configure compiler for styled-components
  compiler: {
    styledComponents: true
  },

  // Server component resolver - prevent Node.js modules from being used in Edge Runtime
  serverComponentsExternalPackages: ['stripe'],

  webpack: (config, { isServer }) => {
    // Handle specific Node.js modules in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        ws: false,
      };
    }
    
    return config;
  },
};

module.exports = nextConfig;
