import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Resolve the platform-specific module issue
  webpack: (config, { isServer }) => {
    // Override the resolution of lightningcss to use a JavaScript implementation
    if (config.resolve && config.resolve.alias) {
      // Try to use the WASM version if available (for cross-platform compatibility)
      try {
        require.resolve('lightningcss-wasm');
        config.resolve.alias['lightningcss'] = 'lightningcss-wasm';
        console.log('Using lightningcss-wasm as fallback');
      } catch (e) {
        console.log('lightningcss-wasm not found, using original with potential fallbacks');
      }
    }
    
    return config;
  },
  // Disable minification during development to avoid CSS processing issues
  swcMinify: process.env.NODE_ENV === 'production'
};

export default nextConfig;
