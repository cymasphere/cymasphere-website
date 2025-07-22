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
  experimental: {
    showAllErrors: true,
  },
  // Force error details to show in production
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // Disable error message hiding
  env: {
    NODE_ENV: process.env.NODE_ENV,
  },
};

module.exports = nextConfig;
