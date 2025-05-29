import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  compiler: {
    styledComponents: true,
  },
  // Resolve the platform-specific module issue
  webpack: (config) => {
    // This fixes the issue with lightningcss native bindings
    config.resolve.alias = {
      ...config.resolve.alias,
      // Use pure JS fallbacks for native modules
      lightningcss: require.resolve("lightningcss"),
    };

    return config;
  },
};

export default nextConfig;
