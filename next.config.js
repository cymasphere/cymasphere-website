/** @type {import('next').NextConfig} */

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['react-icons'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit to 10MB for file uploads
    },
  },
  // Force webpack instead of Turbopack to avoid compatibility issues
  webpack: (config, { isServer }) => {
    return config;
  },
  // Exclude problematic symlinks from build
  outputFileTracingExcludes: {
    '*': [
      'cymasphere/svg_conv/**/*',
    ],
  },
};

module.exports = nextConfig;
