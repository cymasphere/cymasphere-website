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
};

module.exports = nextConfig;
