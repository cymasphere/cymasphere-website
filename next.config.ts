import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Resolve the platform-specific module issue
  webpack: (config, { isServer }) => {
    // This fixes the issue with lightningcss native bindings
    config.resolve.alias = {
      ...config.resolve.alias,
      // Use pure JS fallbacks for native modules
      lightningcss: require.resolve('lightningcss')
    };
    
    return config;
  }
};

export default nextConfig;
