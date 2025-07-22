/** @type {import('next').NextConfig} */

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    styledComponents: true,
  },
  productionBrowserSourceMaps: true,
  transpilePackages: ['react-icons'],
};

module.exports = nextConfig;
