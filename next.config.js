/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    styledComponents: true,
  },
  productionBrowserSourceMaps: true,
  transpilePackages: ['react-icons'],
  // Force error details to show in production
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Force error details to show in production
  experimental: {
    // This will help show more error details
    serverComponentsExternalPackages: [],
  },
  // Override error handling to show details
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // In production, ensure error details are shown
      config.optimization.minimize = false;
      config.optimization.minimizer = [];
    }
    return config;
  },
};

module.exports = nextConfig;
