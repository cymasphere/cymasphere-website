/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Configure compiler options for styled-components
  compiler: {
    styledComponents: true,
  },
  // This allows us to use images from various sources
  images: {
    domains: [],
  },
  // Suppress useLayoutEffect warning message in development
  onDemandEntries: {
    // Set a large buffer to prevent too many refreshes
    pagesBufferLength: 5,
  },
  // This instructs Next.js how to handle certain imports
  transpilePackages: ['styled-components', 'react-is', 'react-router-dom', 'framer-motion'],
  
  // Output as standalone for Docker deployment
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,

  // Handle module resolution for client-side only packages
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve certain modules on the client to prevent errors
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        mongoose: false,
      };
    }

    // Fix warnings about Critical dependency
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
  
  // Custom headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 